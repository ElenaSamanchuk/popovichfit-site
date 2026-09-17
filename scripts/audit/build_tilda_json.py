#!/usr/bin/env python3
"""
Сборка данных страниц Тильды для универсального рендерера (app/components/tilda/*).
Из old-site/pageNNN.html вытаскивает все блоки страницы по порядку:
  - T396 Zero Block: артборд (высоты/фон по брейкпоинтам) и элементы с ЭФФЕКТИВНОЙ геометрией/стилями
    на 5 артбордах (1200/960/640/480/320 — каскад CSS экспорта свёрнут), контентом (HTML текста, ссылка,
    картинка, inline-SVG, видео, встроенный HTML) и группами;
  - остальные блоки: тип + вычищенный HTML содержимого (без скриптов/стилей) + хуки попапов.
Пути картинок → /img/t/<id>-<имя> (см. scripts/import-images.mjs --all), ссылки popovichfit.ru → относительные.
Результат: app/data/tilda/<file>.json + docs/tilda-json-report.md.
Запуск: python3 scripts/audit/build_tilda_json.py [pageNNN.html ...]   (без аргументов — все страницы)
"""
import re, os, sys, json, glob, copy
sys.path.insert(0, os.path.dirname(__file__))
import zero_spec as Z

ROOT = 'old-site'
OUT = 'app/data/tilda'
SCREENS = ['1200', '960', '640', '480', '320']
os.makedirs(OUT, exist_ok=True)

def img_path(p):
    """images/tild3834-3931-4164-b935-643265363733__favicon_5.ico → /img/t/t38343931-favicon_5.ico (растровые → .webp)"""
    if not p: return p
    p = p.split('?')[0]
    base = os.path.basename(p)
    m = re.match(r'tild([0-9a-f]{4})-([0-9a-f]{4})-[0-9a-f-]+__(.+)$', base)
    if not m: return '/img/t/' + base
    # варианты -/resize/504x/, -/resizeb/20x/ (ленивые превью) → оригинал
    name = re.sub(r'^-__(?:resizeb?|empty)__(?:\d+x__)?', '', m.group(3))
    name = re.sub(r'[^A-Za-z0-9._-]+', '_', name).lower()
    ext = os.path.splitext(name)[1]
    if ext in ('.jpg', '.jpeg', '.png'):
        name = name[:-len(ext)] + '.webp'
    return f'/img/t/t{m.group(1)}{m.group(2)}-{name}'

def rewrite_links(h):
    if not h: return h
    h = re.sub(r'href="https?://(?:www\.)?popovichfit\.ru/?([^"]*)"', lambda m: f'href="/{m.group(1)}"', h)
    h = re.sub(r'href="/(page\d+\.html)"', r'href="/\1"', h)
    h = re.sub(r"href='https?://(?:www\.)?popovichfit\.ru/?([^']*)'", lambda m: f"href='/{m.group(1)}'", h)
    h = re.sub(r'(src|data-original|data-src|content)="(images/[^"]+)"', lambda m: f'{m.group(1)}="{img_path(m.group(2))}"', h)
    h = re.sub(r"url\(['\"]?(images/[^'\")]+)['\"]?\)", lambda m: f"url('{img_path(m.group(1))}')", h)
    h = re.sub(r"url\('\.\./images/(lib__[^']+)'\)", lambda m: f"url('/img/t/{m.group(1)}')", h)
    # свои иконки кнопок (--icon:url('../images/tild…__name.svg')) → как остальные картинки экспорта
    h = re.sub(r"url\(['\"]?\.\./images/(tild[^'\")]+)['\"]?\)", lambda m: f"url('{img_path(m.group(1))}')", h)
    return h

def px(v):
    if v is None: return None
    v = v.strip()
    if v in ('auto', ''): return None
    m = re.fullmatch(r'(-?[\d.]+)(px)?', v)
    if m: return float(m.group(1))
    m = re.fullmatch(r'(-?[\d.]+)%', v)
    if m: return {'pct': float(m.group(1))}
    return None

def parse_left(v):
    if v is None: return None
    v = v.strip()
    # calc(50% - Hpx + Xpx): H = половина артборда (grid) или половина ширины элемента (axisx=center) — различает posCss
    m = re.fullmatch(r'calc\(50% - ([\d.]+)px \+ (-?[\d.]+)px\)', v)
    if m: return {'a': 'grid', 'x': float(m.group(2)), 'half': float(m.group(1))}
    m = re.fullmatch(r'calc\(50% \+ (\d+)px - ([\d.]+)px \+ (-?[\d.]+)px\)', v)
    if m: return {'a': 'grid-right', 'x': float(m.group(3)), 'w': float(m.group(2))}
    m = re.fullmatch(r'calc\(100% - ([\d.]+)px \+ (-?[\d.]+)px\)', v)
    if m: return {'a': 'window-right', 'x': float(m.group(2)), 'w': float(m.group(1))}
    m = re.fullmatch(r'calc\(50% - ([\d.]+)% \+ (-?[\d.]+)px\)', v)
    if m: return {'a': 'center-pct', 'pct': float(m.group(1)), 'x': float(m.group(2))}
    m = re.fullmatch(r'calc\(50% - ([\d.]+)px \+ (-?[\d.]+)%\)', v)
    if m: return {'a': 'grid', 'x': 0.0, 'xpct': float(m.group(2))}
    m = re.fullmatch(r'(-?[\d.]+)px', v)
    if m: return {'a': 'window-left', 'x': float(m.group(1))}
    m = re.fullmatch(r'(-?[\d.]+)%', v)
    if m: return {'a': 'window-left', 'x': 0.0, 'xpct': float(m.group(1))}
    return {'a': 'raw', 'raw': v}

STYLE_KEYS = ('icon', 'btn-color', 'btn-hover-color', 'btn-pad', 'btn-gap', 'backdrop-filter', 'flex-shrink', 'flex-grow', 'align-self', 'order', 'margin', 'min-width', 'max-width', 'font-size', 'line-height', 'font-weight', 'font-family', 'color', 'text-align', 'letter-spacing', 'background-color',
              'border-radius', 'opacity', 'transform', 'background-image', 'border-color', 'border-width', 'text-transform', 'box-shadow',
              'background-position', 'background-size', 'white-space', 'padding', 'justify-content', 'align-items', 'z-index',
              'text-decoration', 'font-style', 'background-attachment', 'background-repeat', 'overflow', 'display')

def parse_top(v):
    """top: 280px | calc(280px - 0px + 0px) | calc(50vh - 40px + 0px) (axisy center/bottom, контейнер окно)"""
    if v is None: return None
    m = re.fullmatch(r'calc\((-?[\d.]+)(px|vh) - (-?[\d.]+)px \+ (-?[\d.]+)px\)', v.strip())
    if m: return {'calc': {'base': float(m.group(1)), 'unit': m.group(2), 'sub': float(m.group(3)), 'x': float(m.group(4))}}
    return px(v)

def norm_geo(g):
    out = {}
    if 'left' in g: out['left'] = parse_left(g['left'])
    if 'top' in g: out['top'] = parse_top(g['top'])
    if 'width' in g: out['width'] = px(g['width'])
    if 'height' in g: out['height'] = px(g['height'])
    st = {k: (rewrite_links(g[k]) if k == 'icon' else g[k]) for k in g if k in STYLE_KEYS or k.startswith('$')}
    if 'hover' in g: st['hover'] = g['hover']
    if st: out['style'] = st
    return out

def merge(a, b):
    out = copy.deepcopy(a)
    for k, v in b.items():
        if k == 'style':
            out.setdefault('style', {}).update(v)
        else:
            out[k] = v
    return out

def effective(geo):
    """каскад Тильды: base(1200) → ≤1199(960) → ≤959(640) → ≤639(480) → ≤479(320)"""
    eff = {}
    cur = {}
    for scr in SCREENS:
        cur = merge(cur, geo.get(scr, {}))
        eff[scr] = cur
    return eff

def clean_block_html(rec_html):
    b = re.sub(r'<script.*?</script>', '', rec_html, flags=re.S)
    b = re.sub(r'<style.*?</style>', '', b, flags=re.S)
    b = re.sub(r'<!--.*?-->', '', b, flags=re.S)
    b = re.sub(r'src="images/[^"]*__-__(?:resize|empty)[^"]*"\s+data-original="([^"]+)"', r'src="\1"', b)
    b = re.sub(r'data-original="([^"]+)"', r'data-src="\1"', b)
    b = re.sub(r'\s+', ' ', b).strip()
    # корневой <div id="recN" class="r t-rec …" style="padding…"> не берём: id, отступы и фон ставит TildaBlock (иначе дубль id и двойной padding)
    m = re.match(r'<div id="rec\d+"[^>]*>', b)
    if m:
        # содержимое до парного закрывающего тега корня (у последнего блока страницы в кусок попадает хвост страницы)
        depth = 1; end = len(b)
        for t in re.finditer(r'<div\b|</div>', b[m.end():]):
            depth += 1 if t.group(0) == '<div' else -1
            if depth == 0: end = m.end() + t.start(); break
        b = b[m.end():end].strip()
    return rewrite_links(b)

def elem_extra(el_html, etype):
    """inline-SVG (vector), встроенный HTML (html), видео (video), поля формы (form)"""
    out = {}
    if etype == 'vector':
        m = re.search(r'<svg.*?</svg>', el_html, re.S)
        if m: out['svg'] = re.sub(r'\s+', ' ', m.group(0))
    elif etype == 'html':
        # содержимое атома — сбалансированно (внутри бывают свои <div>): иначе теряется закрывающий тег и ломается гидрация
        am = re.search(r"<div class='tn-atom tn-atom__html'>", el_html)
        m = re.match(r'(.*)', Z.balanced_inner(el_html, am.start())[1], re.S) if am else None
        if m: out['embed'] = rewrite_links(re.sub(r'\s+', ' ', m.group(1)).strip())
    elif etype == 'video':
        for key, kind in (('data-youtubeid', 'youtube'), ('data-vimeoid', 'vimeo'), ('data-kinescopeid', 'kinescope'), ('data-video-kinescope-id', 'kinescope')):
            m = re.search(key + r'="([^"]+)"', el_html)
            if m: out['video'] = {'kind': kind, 'id': m.group(1)}; break
        m = re.search(r'<iframe[^>]*src="([^"]+)"', el_html)
        if m and 'video' not in out: out['embed'] = f'<iframe src="{m.group(1)}" allowfullscreen frameborder="0" style="position:absolute;inset:0;width:100%;height:100%"></iframe>'
    elif etype == 'form':
        m = re.search(r'class="tn-atom__inputs-data" data-value="([^"]*)"', el_html)
        if m:
            import html as H
            try: out['form'] = json.loads(H.unescape(m.group(1)))
            except Exception: out['form'] = []
        m = re.search(r'data-formactiontype="([^"]*)"', el_html)
        out['formServices'] = re.findall(r'name="formservices\[\]" value="([^"]*)"', el_html)
    return out

def parse_page(fname):
    html = open(os.path.join(ROOT, fname), encoding='utf-8', errors='ignore').read()
    body = html.split('<!--allrecords-->')[1] if '<!--allrecords-->' in html else html
    recs = re.split(r'(?=<div id="rec\d+" class="r t-rec)', body)
    blocks = []
    pb75zero = False  # на странице есть T123 с .t-rec_pb_75{padding-bottom:0!important}
    for r in recs:
        m = re.match(r'<div id="(rec\d+)" class="r t-rec([^"]*)"([^>]*)data-record-type="(\d+)"', r)
        if not m: continue
        rid, cls, attrs, t = m.groups()
        tag = r[:r.find('>')]
        vis = {}
        mm = re.search(r'data-screen-min="(\d+)px"', tag); vis['min'] = int(mm.group(1)) if mm else None
        mm = re.search(r'data-screen-max="(\d+)px"', tag); vis['max'] = int(mm.group(1)) if mm else None
        bg = re.search(r'background-color:\s*([^;"]+)', tag); bgc = bg.group(1).strip() if bg else None
        pad = {}
        for k in ('padding-top', 'padding-bottom'):
            mm = re.search(k + r':\s*(\d+)px', tag); pad[k] = int(mm.group(1)) if mm else None
        uc = re.findall(r'\b(uc-[\w-]+)', cls)
        block = {'id': rid, 'type': t, 'vis': vis, 'bg': bgc, 'pad': pad, 'uc': uc}
        # отступы записи для отдельных экранов: классы t-rec_pt-res-480_15 / t-rec_pb-res-480_0 (Тильда: @media (max-width:480px) … !important)
        pad_res = {}
        for side, res, val in re.findall(r't-rec_p([tb])-res-(\d+)_(\d+)', cls):
            pad_res.setdefault(res, {})['padding-top' if side == 't' else 'padding-bottom'] = int(val)
        # правило Тильды для экранов ≤480: отступы 120/135/150/165 → 90px, 210 → 120px (!important, перекрывает inline);
        # меньшие значения остаются (правило без !important проигрывает inline-стилю записи)
        for side, key in (('padding-top', 'padding-top'), ('padding-bottom', 'padding-bottom')):
            v = pad.get(key)
            if v and key not in pad_res.get('480', {}):
                if v >= 210: pad_res.setdefault('480', {})[key] = 120
                elif v >= 120: pad_res.setdefault('480', {})[key] = 90
        if pad_res: block['padRes'] = pad_res
        if '.t-rec_pb_75' in r and 'padding-bottom: 0' in r.replace('padding-bottom:0', 'padding-bottom: 0'): pb75zero = True
        if t == '396':
            spec = Z.block_spec(r)
            art = spec['artboard']
            artboards = {}
            for scr in SCREENS:
                a = spec['artcss'].get(scr, {})
                h = px(a.get('height')) if a.get('height') else None
                if h is None:
                    hv = art.get(f'height-res-{scr}') if scr != '1200' else art.get('height')
                    h = float(hv) if hv else None
                artboards[scr] = {'h': h, 'bg': a.get('background-color'), 'pos': a.get('position'),
                                  'upscale': art.get(f'upscale-res-{scr}') or art.get('upscale'), 'valign': art.get('valign'),
                                  'hug': art.get('heightmode') == 'hug', 'bgImage': rewrite_links(a.get('background-image', '')) or None}
            # эффективные высоты (каскад)
            cur = None
            for scr in SCREENS:
                if artboards[scr]['h'] is None: artboards[scr]['h'] = cur
                cur = artboards[scr]['h']
            block['artboard'] = {'screens': art.get('screens', ''), 'fixed': art.get('pos') == 'fixed', 'fixedPos': art.get('fixed-pos'),
                                 'ovrflw': art.get('ovrflw'), 'bg': {k: v for k, v in art.items() if k.startswith('bg')}}
            block['artboards'] = artboards
            # элементы по порядку разметки (важно для групп) + доп. контент
            el_chunks = re.split(r"(?=<div\s+class='t396__elem tn-elem)", r)[1:]
            by_id = {e['id']: e for e in spec['elems']}
            elems = []
            for chunk in el_chunks:
                mm = re.search(r"data-elem-id='(\d+)'", chunk)
                if not mm or mm.group(1) not in by_id: continue
                e = by_id[mm.group(1)]
                geo = {scr: norm_geo(g) for scr, g in e['geo'].items()}
                el = {'id': e['id'], 'type': e['type'], 'cls': e['cls'], 'eff': effective(geo), 'fields': e['fields'], 'anim': {k: v for k, v in e['anim'].items() if k != 'sbs-opts'}}
                if e.get('sbs'): el['sbs'] = e['sbs']
                if e['html']: el['html'] = rewrite_links(e['html'])
                if e['text']: el['text'] = e['text']
                if e.get('tag') in ('h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'): el['tag'] = e['tag']
                if e['href']: el['href'] = rewrite_links(f'href="{e["href"]}"')[6:-1]
                if e['img']: el['img'] = img_path(e['img'])
                if e.get('inline'):
                    mi = re.search(r"url\(['\"]?([^'\")]+)", chunk)
                    if mi: el['bgImg'] = img_path(mi.group(1))
                el.update(elem_extra(chunk, e['type']))
                elems.append(el)
            block['elems'] = elems
            groups = []
            for g in spec['groups']:
                geo = {scr: norm_geo({k: v for k, v in gg.items() if not k.startswith('mol.')}) for scr, gg in g['geo'].items()}
                for scr, gg in g['geo'].items():
                    extra = {k: v for k, v in gg.items() if k in ('flex-shrink', 'flex-grow', 'align-self', 'order', 'margin', 'min-width', 'max-width', 'z-index')}
                    if extra: geo.setdefault(scr, {}).setdefault('style', {}).update(extra)
                mol = {scr: {k[4:]: v for k, v in gg.items() if k.startswith('mol.')} for scr, gg in g['geo'].items()}
                # каскад для стилей молекулы (как для элементов)
                molEff = {}; cur = {}
                for scr in SCREENS:
                    cur = {**cur, **mol.get(scr, {})}; molEff[scr] = dict(cur)
                groups.append({'id': g['id'], 'cls': g['cls'], 'flex': g['flex'], 'molFlex': g['molFlex'], 'attrs': g['attrs'], 'eff': effective(geo), 'mol': molEff})
            block['groups'] = groups
            block['tree'] = spec['tree']
            for el in elems:
                el['flex'] = by_id[el['id']].get('flex', False)
        else:
            block['html'] = clean_block_html(r)[:80000]
            # блочный CSS экспорта (#recNNN …) — безопасен, нужен для типовых блоков
            css = ' '.join(re.findall(r'<style>(.*?)</style>', r, re.S))
            css = re.sub(r'\s+', ' ', css).strip()
            if css: block['css'] = rewrite_links(css)[:40000]
            block['hooks'] = re.findall(r'data-tooltip-hook="([^"]*)"', r)
            block['popupRecs'] = re.findall(r'data-popup-rec-ids="([^"]*)"', r)
            if t == '131':
                mm = re.search(r'<!-- nominify begin -->(.*?)<!-- nominify end -->', r, re.S)
                custom = (mm.group(1).strip() if mm else '')[:80000]
                # подключения скриптов с серверов Тильды (Tilda Members и т.п.) — в данные не берём
                custom = re.sub(r'<script[^>]*src="https?://[^"]*tilda[^"]*"[^>]*>\s*</script>', '', custom)
                block['custom'] = rewrite_links(custom)
                del block['html']
        blocks.append(block)
    if pb75zero:
        for b in blocks:
            if b['pad'].get('padding-bottom') == 75: b['pad']['padding-bottom'] = 0
    return blocks

def tabs_of_blocks(blocks):
    """T395 «табы из блоков»: data-tab-rec-ids на вкладках — блоки невыбранных вкладок скрыты (t395__off).
    Помечаем блоки: tab = {'of': id T395, 'index': номер вкладки (0-based)}, tabHidden — скрыт при загрузке."""
    by = {b['id']: b for b in blocks}
    for b in blocks:
        if b['type'] not in ('395', '1281') or not b.get('html'): continue  # T1281 — те же «табы из блоков» (t1281__off)
        h = b['html']
        cur = int((re.search(r'data-tab-current="(\d+)"', h) or [None, '1'])[1]) - 1
        tabs = re.findall(r'data-tab-rec-ids="([^"]*)"', h)
        for i, ids in enumerate(tabs):
            for rid in ids.split(','):
                t = by.get('rec' + rid.strip())
                if t: t['tab'] = {'of': b['id'], 'index': i}; t['tabHidden'] = i != cur

def showmore_configs(blocks):
    """«Показ скрытых блоков по клику» (mo-ti.ru): shmoreArr = ['#showmore', 'uc-showmore'] — блоки с классом скрыты (tabshide),
    ссылка с таким href их переключает. Блоки помечаем showHidden, конфиг — на страницу."""
    out = []
    for b in blocks:
        c = b.get('custom') or ''
        m = re.search(r"shmoreArr\s*=\s*\[\s*'([^']+)'\s*,\s*'([^']+)'", c)
        if not m: continue
        href, cls = m.group(1), m.group(2)
        out.append({'href': href, 'cls': cls, 'hideBtn': bool(re.search(r'hideBtn\s*=\s*true', c)), 'hideBlk': bool(re.search(r'hideBlk\s*=\s*true', c))})
        for t in blocks:
            if cls in (t.get('uc') or []): t['showHidden'] = True
    return out

def hscroll_configs(blocks):
    """Горизонтальный скролл Zero Block (romanyu: scrollbooster + стрелки) из T123: блок со скроллом, блок со стрелками
    (.arrow-left/.arrow-right), сдвиг по клику. Воспроизводится компонентом tilda/HScroll.vue."""
    out = []
    for b in blocks:
        c = b.get('custom') or ''
        if 'scrollbooster' in c:  # romanyu: стрелки .arrow-left/.arrow-right
            sc = re.search(r"blockScrollId\s*=\s*'#(rec\d+)'", c) or re.search(r"blockId\s*=\s*'#(rec\d+)'", c)
            if not sc: continue
            ar = re.search(r"blockArrowsId\s*=\s*'#(rec\d+)'", c)
            sh = re.search(r"shiftSize\s*=\s*'(\d+)px'", c)
            out.append({'scroll': sc.group(1), 'arrows': ar.group(1) if ar else None, 'shift': int(sh.group(1)) if sh else 320})
        elif 'TCD014' in c or 'dragscroll' in c:  # TICODE TCD014 (dragscroll): только перетаскивание, блок из $('#recN')
            for sc in re.findall(r"\$\('#(rec\d+)'\)", c):
                out.append({'scroll': sc, 'arrows': None, 'shift': 300})
        elif 'voron-dev.ru/horizontal-scroll' in c:  # VORON: стрелки .scrollback/.scrollfwd, пары блоков по индексу
            arrows = re.findall(r"'#(rec\d+)'", (re.search(r'arrowBlocks\s*=\s*\[([^\]]*)\]', c) or [None, ''])[1])
            scrolls = re.findall(r"'#(rec\d+)'", (re.search(r'scrollableBlocks\s*=\s*\[([^\]]*)\]', c) or [None, ''])[1])
            sh = re.search(r'innerWidth\s*>\s*1200\)\s*:\s*shift\s*=\s*(\d+)', c) or re.search(r'shift\s*=\s*(\d+)', c)
            for i, sc in enumerate(scrolls):
                out.append({'scroll': sc, 'arrows': arrows[i] if i < len(arrows) else None, 'shift': int(sh.group(1)) if sh else 200})
    return out

def main(files):
    report = []
    for f in files:
        blocks = parse_page(f)
        tabs_of_blocks(blocks)
        hs = hscroll_configs(blocks)
        sm = showmore_configs(blocks)
        json.dump({'file': f, 'blocks': blocks, **({'hscroll': hs} if hs else {}), **({'showmore': sm} if sm else {})}, open(os.path.join(OUT, f.replace('.html', '.json')), 'w'), ensure_ascii=False, separators=(',', ':'))
        types = {}
        for b in blocks: types[b['type']] = types.get(b['type'], 0) + 1
        report.append((f, len(blocks), types))
    with open('docs/tilda-json-report.md', 'w') as o:
        o.write('# Данные страниц для рендерера (app/data/tilda)\n\nСгенерировано `scripts/audit/build_tilda_json.py`.\n\n| файл | блоков | типы |\n|---|---|---|\n')
        for f, n, types in report:
            o.write(f"| {f} | {n} | {', '.join(f'T{k}×{v}' for k, v in sorted(types.items(), key=lambda kv: -kv[1]))} |\n")
    print('done', len(files), 'pages')

if __name__ == '__main__':
    files = sys.argv[1:] or sorted(os.path.basename(p) for p in glob.glob(os.path.join(ROOT, 'page*.html')))
    main(files)
