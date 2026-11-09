#!/usr/bin/env python3
"""Спецификация Zero Block (T396) страницы: артборд + элементы с геометрией на брейкпоинтах и типографикой.
Запуск из корня: python3 scripts/audit/zero_spec.py page36594700.html [recId ...] [--json out.json]
Печатает Markdown-подобную спеку для ручной вёрстки.
"""
import re
import json, sys, os, json, html as H
ROOT = 'old-site'
SCREENS = ['1600', '1200', '960', '640', '480', '320']  # 1600 — только у артбордов с data-artboard-screens «…,1600» (у остальных пусто)

ART_W = {'1600': 1600, '1200': 1200, '960': 960, '640': 640, '480': 480, '320': 320}  # 1600: сетка Тильды на широких экранах

def gattr(attrs, key, scr, maxscr='1200'):
    """значение поля группы для разрешения с каскадом вверх (t396_group__getFieldValue): res-N → ближайшее большее → база.
    База (без -res-) относится к самому большому экрану артборда: 1200 или 1600 (data-artboard-screens)."""
    order = ['320', '480', '640', '960', '1200', '1600']
    for s in order[order.index(scr):]:
        if s == '1600' and maxscr != '1600': continue
        v = attrs.get(f'{key}-value') if s == maxscr else attrs.get(f'{key}-res-{s}-value')
        if v not in (None, ''): return v
    return None

def strip_at_blocks(css, at):
    """убрать блоки @supports…{…} (с вложенными скобками)"""
    out = []; pos = 0
    for m in re.finditer(re.escape(at) + r'[^{]*\{', css):
        if m.start() < pos: continue
        out.append(css[pos:m.start()])
        depth = 1; i = m.end()
        while depth and i < len(css):
            if css[i] == '{': depth += 1
            elif css[i] == '}': depth -= 1
            i += 1
        pos = i
    out.append(css[pos:])
    return ''.join(out)

def parse_style_rules(style_css, rec, base_scr='1200'):
    """#recNNN .tn-elem[data-elem-id="X"]{...} и @media → {(elem_id, screen): {prop: val}}.
    base_scr — экран базовых правил (вне @media): 1200, а у артбордов с экраном 1600 — 1600 (тогда @media 1599 = 1200)."""
    rules = {}
    # @supports (-webkit-touch-callout:none) … { gap:0; margin-bottom } — фолбэк для старого iOS, в каскад не берём
    style_css = strip_at_blocks(style_css, '@supports')
    # split media blocks
    pos = 0
    out = []
    for m in re.finditer(r'@media screen and \(max-width:(\d+)px\)\s*\{', style_css):
        out.append((base_scr, style_css[pos:m.start()]))
        depth = 1; i = m.end()
        while depth and i < len(style_css):
            if style_css[i] == '{': depth += 1
            elif style_css[i] == '}': depth -= 1
            i += 1
        scr = {'1199': '960', '959': '640', '639': '480', '479': '320', '1599': '1200'}.get(m.group(1), m.group(1))
        out.append((scr, style_css[m.end():i-1]))
        pos = i
    out.append((base_scr, style_css[pos:]))
    for scr, css in out:
        for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', css):
            sel, body = m.group(1).strip(), m.group(2)
            gm = re.search(r'data-group-id="(\d+)"\]', sel)
            if gm:
                gtail = sel.split(']')[-1].strip()
                key = ('G' + gm.group(1), scr, 'molecule' if 'molecule' in gtail else 'group')
                d = rules.setdefault(key, {})
                for prop in body.split(';'):
                    if ':' in prop:
                        k, v = prop.split(':', 1); d[k.strip()] = v.strip()
                continue
            em = re.search(r'data-elem-id="(\d+)"\]', sel)
            tail = sel.split(']')[-1].strip() if em else ''
            if em:
                if tail == '': kind = 'elem'
                elif tail == '.tn-atom': kind = 'atom'
                elif tail == '.tn-atom:hover': kind = 'hover'
                elif ':hover' in tail and 'tn-atom__button-text' in tail: kind = 'hover-btntext'  # цвет текста кнопки при наведении
                elif 'tn-atom__button-text' in tail or 'tn-atom__button-content' in tail: kind = 'btntext'
                elif tail == '.tn-atom .tn-atom__button-icon' or tail == '.tn-atom__button-icon': kind = 'icon'
                else: kind = 'other:' + tail
            else:
                kind = 'elem'
            key = (em.group(1) if em else ('ARTBOARD' if 't396__artboard' in sel else None), scr, kind)
            if key[0] is None: continue
            d = rules.setdefault(key, {})
            for prop in body.split(';'):
                if ':' in prop:
                    k, v = prop.split(':', 1); d[k.strip()] = v.strip()
    return rules

def balanced_inner(s, start):
    """s[start:] начинается с открывающего тега; вернуть (имя тега, внутренний HTML до парного закрывающего)"""
    m = re.match(r'<([a-zA-Z][\w-]*)\b[^>]*>', s[start:])
    if not m: return '', ''
    tag = m.group(1).lower()
    body = start + m.end()
    pat = re.compile(r'<(/?)' + re.escape(tag) + r'\b[^>]*>', re.I)
    depth, pos = 1, body
    while True:
        mm = pat.search(s, pos)
        if not mm: return tag, s[body:]
        depth += -1 if mm.group(1) else 1
        if depth == 0: return tag, s[body:mm.start()]
        pos = mm.end()

def elem_spec(el_html, rules, screens=''):
    maxscr = '1600' if '1600' in str(screens) else '1200'
    # у последнего элемента блока в кусок попадает хвост записи (script/noscript Метрики и т.п.) — отрезаем
    el_html = re.split(r'<(?:script|noscript)\b', el_html, 1)[0]
    m = re.search(r'data-elem-id=[\'"](\d+)[\'"]', el_html); eid = m.group(1)
    etype = re.search(r'data-elem-type=[\'"](\w+)[\'"]', el_html); etype = etype.group(1) if etype else '?'
    cls_raw = re.search(r"<div class='t396__elem tn-elem([^']*)'", el_html)
    is_flex = bool(cls_raw and 't396__elem-flex' in cls_raw.group(1))
    cls = re.sub(r'\s*(t396__elem-flex|tn-elem__\d+)\s*', ' ', cls_raw.group(1)).strip() if cls_raw else ''
    fields = dict(re.findall(r'data-field-([\w-]+)-value=[\'"]([^\'"]*)[\'"]', el_html))
    atom = re.search(r"<(?:div|a|img|iframe)[^>]*class=['\"][^'\"]*tn-atom[^'\"]*['\"][^>]*>(.*)", el_html, re.S)
    text = ''; html_inner = ''; tag = ''
    if etype in ('text', 'button'):
        # содержимое атома — сбалансированно (до парного закрывающего тега), а не до первого </div>:
        # иначе в SSR-разметку попадают незакрытые <a>/<span>/<div>, браузер чинит их не так, как vdom → ломается гидрация
        key = 'tn-atom__button-text' if etype == 'button' and 'tn-atom__button-text' in el_html else 'tn-atom'
        am = re.search(r"<[a-zA-Z][\w-]*\b[^>]*class=['\"]" + key + r"(?:\s[^'\"]*)?['\"][^>]*>", el_html)
        if am:
            tag, t = balanced_inner(el_html, am.start())
            # тонкий пробел U+2009 в разряде числа («7 699 р.») → неразрывный (иначе \s ниже схлопнет его в обычный пробел);
            # «пробел + U+2028 + тире» → неразрывный пробел перед тире (U+2028 тоже \s и превращался в обычный пробел)
            # (во временный знак U+E000, т.к. \s схлопывает и сам U+00A0; после схлопывания — обратно в U+00A0)
            t_nb = re.sub(r'(?<=\d)\u2009(?=\d{3}(?!\d))', '\ue000', t)
            t_nb = re.sub(r' ?\u2028(?=[—–])', '\ue000', t_nb)
            html_inner = re.sub(r'\s+', ' ', t_nb).strip().replace('\ue000', '\u00a0')
            t = re.sub(r'<br\s*/?>', '⏎', t); t = re.sub(r'<[^>]+>', '', t)
            text = H.unescape(re.sub(r'[ \t\r\n]+', ' ', t)).strip()
    # data-field-* — источник координат для рантайма Тильды (CSS экспорта иногда устаревший): каскад по экранам
    df = dict(re.findall(r'data-field-([\w-]+)-value="([^"]*)"', el_html))
    def dval(key, scr):
        order = ['320', '480', '640', '960', '1200', '1600']
        for sc in order[order.index(scr):]:
            if sc == '1600' and maxscr != '1600': continue
            v = df.get(key) if sc == maxscr else df.get(f'{key}-res-{sc}')
            if v not in (None, ''): return v
        return None
    data = {}
    for scr in SCREENS:
        d = {k: dval(k, scr) for k in ('top', 'left', 'width', 'height', 'container', 'axisx', 'axisy', 'topunits', 'leftunits', 'widthunits', 'heightunits')}
        data[scr] = d
    href = re.search(r"<a[^>]*class=['\"]tn-atom(?:\s[^'\"]*)?['\"][^>]*href=[\"']([^\"']*)[\"']", el_html) or re.search(r"href=[\"']([^\"']*)[\"'][^>]*class=['\"]tn-atom(?:\s[^'\"]*)?['\"]", el_html)
    href = href.group(1) if href else ''
    img = re.search(r"data-original=[\"']([^\"']*)[\"']", el_html) or re.search(r"<img[^>]*src=[\"']([^\"']*)[\"']", el_html)
    img = img.group(1) if img else ''
    bg = re.search(r"background-image:\s*url\(['\"]?([^'\")]+)", el_html); bg = bg.group(1) if bg else ''
    anim = {k: v for k, _q, v in re.findall(r'data-animate-([\w-]+)=([\'"])(.*?)\2', el_html)}
    # пошаговая анимация (sbs): opts — JSON с одинарными кавычками; первый шаг = начальное состояние
    sbs = None
    if anim.get('sbs-opts'):
        try:
            steps = json.loads(anim['sbs-opts'].replace("'", '"'))
            sbs = {'event': anim.get('sbs-event', ''), 'trg': [t for t in re.split(r'[,\s]+', anim.get('sbs-trgels', '')) if t], 'steps': [{k: (float(v) if isinstance(v, (int, float)) or re.fullmatch(r'-?[\d.]+', str(v)) else v) for k, v in st.items() if k in ('mx', 'my', 'sx', 'sy', 'op', 'ro', 'ti', 'ea', 'dt', 'bl')} for st in steps]}
        except Exception:
            sbs = None
    inline = re.search(r"class=['\"]tn-atom(?:\s[^'\"]*)?['\"][^>]*style=[\"']([^\"']*)[\"']", el_html)
    inline = inline.group(1) if inline else ''
    geo = {}
    for scr in SCREENS:
        r = rules.get((eid, scr, 'elem'), {}); a = rules.get((eid, scr, 'atom'), {}); hv = rules.get((eid, scr, 'hover'), {})
        # 'px' без числа — пустое значение в экспорте (width:px), в каскад не берём (рантайм берёт значение большего экрана)
        g = {k: r[k] for k in ('top', 'left', 'width', 'height', 'z-index', 'text-align', 'backdrop-filter') if k in r and r[k] not in ('px', '')}  # text-align Тильда пишет на элемент, не на атом
        if r.get('opacity') not in (None, ''): g['$elem-opacity'] = r['opacity']  # opacity элемента (anim-hidden и т.п.) — отдельный слой от opacity атома
        for k in ('font-size', 'line-height', 'font-weight', 'font-family', 'color', 'text-align', 'letter-spacing', 'background-color', 'border-radius', 'opacity', 'transform', 'background-image', 'border-color', 'border-width', 'text-transform', 'box-shadow', 'background-position', 'background-size', 'object-fit', 'white-space', 'padding', 'display', 'justify-content', 'align-items', '--t396-speedhover'):
            if k in a: g[k] = a[k]
        for k, v in a.items():
            if k.startswith('--t396-'): g[k.replace('--t396-', '$')] = v
        ic = rules.get((eid, scr, 'icon'), {})
        if ic:
            g['icon'] = ' '.join(f'{k}:{v}' for k, v in ic.items() if k in ('width', 'height', 'order', '--icon', 'margin-right', 'margin-left'))
        hb = rules.get((eid, scr, 'hover-btntext'), {})
        if hb.get('color'): g['btn-hover-color'] = hb['color']
        bt = rules.get((eid, scr, 'btntext'), {})
        if bt.get('color'): g['btn-color'] = bt['color']
        if bt.get('padding'): g['btn-pad'] = bt['padding']
        if bt.get('column-gap'): g['btn-gap'] = bt['column-gap']
        for k in ('flex-shrink', 'flex-grow', 'align-self', 'order', 'margin', 'min-width', 'max-width'):
            if k in r and r[k] != '': g[k] = r[k]
        if hv: g['hover'] = '{' + ' '.join(f'{k}:{v}' for k, v in hv.items()) + '}'
        if g: geo[scr] = g
    return dict(id=eid, type=etype, cls=cls, flex=is_flex, tag=tag, text=text, html=html_inner, href=href, img=img or bg, geo=geo, data=data, anim=anim, sbs=sbs, inline=inline, fields={k: v for k, v in fields.items() if k in ('container', 'widthmode', 'heightmode', 'textfit', 'container-res-320', 'container-res-480', 'container-res-640', 'container-res-960', 'container-res-1200', 'imgwidthmode', 'lockaspectratio', 'filewidth', 'fileheight', 'zoomable', 'imgpopup', 'bgcolor', 'hoverbgcolor', 'hovercolor', 'bordercolor', 'borderwidth', 'hoverbordercolor', 'buttonicon', 'buttoniconpos', 'axisx', 'axisy', 'axisx-res-320', 'axisy-res-320', 'fixed', 'sbs-anim', 'animation', 'containermode')})

def block_spec(rec_html):
    rid = re.match(r'<div id="(rec\d+)"', rec_html).group(1)
    tag = rec_html[:rec_html.find('>')]
    vis = ' '.join(re.findall(r'(data-screen-(?:min|max)="[^"]*")', tag))
    style = ''.join(re.findall(r'<style>(.*?)</style>', rec_html, re.S))
    art = re.search(r'<div class="t396__artboard[^>]*>', rec_html)
    artattrs = dict(re.findall(r'data-artboard-([\w-]+)="([^"]*)"', art.group(0))) if art else {}
    rules = parse_style_rules(style, rid, '1600' if '1600' in artattrs.get('screens', '') else '1200')
    artcss = {scr: rules.get(('ARTBOARD', scr, 'elem'), {}) for scr in SCREENS}
    els = re.split(r"(?=<div class='t396__elem tn-elem)", rec_html)[1:]
    specs = [elem_spec(e, rules, artattrs.get('screens', '')) for e in els]
    maxscr = '1600' if '1600' in artattrs.get('screens', '') else '1200'
    # группы (tn-group / molecule): дерево вложенности обходом тегов, стили контейнера и молекулы
    groups = []
    tree = []
    stack = []  # [(node, depth)] — node: dict(kind='group', children=[])
    depth = 0
    for tm in re.finditer(r"<div\b[^>]*>|</div>", rec_html):
        tag = tm.group(0)
        if tag == '</div>':
            depth -= 1
            while stack and stack[-1][1] >= depth: stack.pop()
            continue
        depth += 1
        gm = re.search(r'class="t396__group tn-group ([^"]*)"[^>]*data-group-id="(\d+)"', tag)
        # молекула без обёртки tn-group (бывает в экспорте: <div class="tn-molecule" id="molecule-X"> прямо в артборде, а CSS
        # группы .tn-group[data-group-id="X"] есть) — строим группу из CSS, её flex-дети раскладываются молекулой
        mm = None if gm else re.search(r'class="tn-molecule"[^>]*id="molecule-(\d+)"', tag)
        if mm and not (stack and stack[-1][0]['id'] == mm.group(1)):
            gm = None
            gid = mm.group(1); cl = 't396__group-flex' if 'flex' in str(rules.get(('G' + gid, '1200', 'molecule'), {}).get('display', '')) else ''
            attrs = {}
        if gm:
            gid = gm.group(2); cl = gm.group(1)
            attrs = dict(re.findall(r'data-group-([\w-]+)="([^"]*)"', tag))
        if gm or (mm and not (stack and stack[-1][0]['id'] == mm.group(1))):
            ganim = {k: v for k, v in re.findall(r'data-animate-([\w-]+)="([^"]*)"', tag) if k in ('style', 'duration', 'delay', 'distance', 'scale', 'mobile', 'chain', 'group')}  # анимация появления группы
            geo = {}
            for scr in SCREENS:
                g = rules.get(('G' + gid, scr, 'group'), {}); mol = rules.get(('G' + gid, scr, 'molecule'), {})
                d = {k: g[k] for k in ('top', 'left', 'width', 'height', 'z-index', 'flex-shrink', 'flex-grow', 'align-self', 'order', 'margin', 'min-width', 'max-width') if k in g and g[k] not in ('', 'px')}
                for k, v in mol.items():
                    if k in ('display', 'flex-direction', 'row-gap', 'column-gap', 'gap', 'align-items', 'justify-content', 'padding', 'background-color', 'border-radius', 'box-shadow', 'flex-wrap', 'background-image', 'border-width', 'border-color', 'border-style', 'opacity', 'width', 'height', 'align-content'):
                        d['mol.' + k] = v
                if d: geo[scr] = d
            # позиция группы: как в рантайме Тильды (t396_group__renderView) — из data-group-top/left(-res-N)-value,
            # абсолютных в артборде, за вычетом координат родительской группы; CSS экспорта для групп бывает устаревшим
            fm = re.search(r'data-fields="([^"]*)"', tag); fields = fm.group(1).split(',') if fm else []
            parent = stack[-1][0] if stack else None
            absxy = {}
            if 'top' in fields and 'left' in fields and attrs.get('type-value', 'physical') == 'physical':
                for scr in SCREENS:
                    top = gattr(attrs, 'top', scr, maxscr); left = gattr(attrs, 'left', scr, maxscr)
                    if top is None or left is None: continue
                    absxy[scr] = (float(top), float(left))
                    d = geo.setdefault(scr, {})
                    pxy = (parent or {}).get('absxy', {}).get(scr) if parent else None
                    if pxy:
                        d['top'] = f'{float(top) - pxy[0]:g}px'; d['left'] = f'{float(left) - pxy[1]:g}px'
                    else:
                        cont = gattr(attrs, 'container', scr, maxscr) or 'grid'
                        d['top'] = f'{float(top):g}px'
                        d['left'] = f'calc(50% - {ART_W[scr] / 2:g}px + {float(left):g}px)' if cont == 'grid' else f'{float(left):g}px'
            # группа без data-group-top/left (координаты только в CSS, относительно родителя): абсолютные координаты
            # = CSS + абсолютные родителя — иначе у вложенных групп с data-атрибутами не от чего отнимать (плашка «38 мин» на /inventory)
            if not absxy:
                for scr in SCREENS:
                    g0 = geo.get(scr, {})
                    mt = re.match(r'^(-?[\d.]+)px$', str(g0.get('top', '')))
                    ml = re.search(r'\+\s*(-?[\d.]+)px\)$', str(g0.get('left', ''))) or re.match(r'^(-?[\d.]+)px$', str(g0.get('left', '')))
                    if not mt or not ml: continue
                    pxy = (parent or {}).get('absxy', {}).get(scr) if parent else None
                    absxy[scr] = (float(mt.group(1)) + (pxy[0] if pxy else 0), float(ml.group(1)) + (pxy[1] if pxy else 0))
            node = dict(kind='group', id=gid, absxy=absxy, cls=' '.join(c for c in cl.split() if not c.startswith('tn-group__') and c not in ('t396__group-flex', 't-animate', 't396__elem-flex')),
                        flex='t396__elem-flex' in cl, molFlex='t396__group-flex' in cl, attrs={k: v for k, v in attrs.items() if k in ('flex', 'flexdirection', 'flexalignitems', 'padding', 'widthmode', 'heightmode', 'type-value')}, geo=geo, children=[], **({'anim': ganim} if ganim else {}))
            groups.append(dict(id=gid, cls=node['cls'], flex=node['flex'], molFlex=node['molFlex'], attrs=node['attrs'], geo=geo, anim=ganim))
            (stack[-1][0]['children'] if stack else tree).append(node)
            # у молекулы без обёртки дети лежат на один уровень ближе — узел закрывается вместе с самой молекулой
            stack.append((node, depth - 1 if mm else depth))
            continue
        em = re.search(r"class='t396__elem tn-elem[^']*'[^>]*data-elem-id='(\d+)'", tag)
        if em:
            (stack[-1][0]['children'] if stack else tree).append(dict(kind='elem', id=em.group(1)))
    # родительская группа каждого элемента (для перевода абсолютных data-координат в относительные)
    parent_of = {}
    def walk(nodes, parent):
        for n in nodes:
            if n['kind'] == 'group': walk(n['children'], n)
            else: parent_of[n['id']] = parent
    walk(tree, None)
    by_id = {sp['id']: sp for sp in specs}
    for sp in specs:
        par = parent_of.get(sp['id'])
        # элемент с классом t396__elem-flex, но без группы-родителя в экспорте (группа потеряна) — позиционируем абсолютно
        orphan = sp['flex'] and par is None
        if orphan: sp['flex'] = False
        if sp['flex']: continue  # flex-дети раскладывает молекула
        for scr in SCREENS:
            d = sp['data'].get(scr) or {}
            if d.get('top') is None or d.get('left') is None: continue
            if (d.get('axisx') or 'left') != 'left' or (d.get('axisy') or 'top') != 'top': continue
            if (d.get('topunits') or 'px') != 'px' or (d.get('leftunits') or 'px') != 'px': continue
            try: top, left = float(d['top']), float(d['left'])
            except ValueError: continue
            pxy = (par or {}).get('absxy', {}).get(scr) if par else None
            if par and not pxy: continue
            if pxy: top, left = top - pxy[0], left - pxy[1]
            g = sp['geo'].setdefault(scr, {})
            # сирота flex-группы: ширина в CSS — доля молекулы (100%), берём из data
            if orphan and d.get('width') and (d.get('widthunits') or 'px') == 'px':
                try: g['width'] = f"{float(d['width']):g}px"
                except ValueError: pass
            # top: только если в CSS простое число
            mt = re.fullmatch(r'(-?[\d.]+)px', (g.get('top') or '').strip())
            if mt and abs(float(mt.group(1)) - top) > 0.5: g['top'] = f'{top:g}px'
            elif not g.get('top') and scr == '1200': g['top'] = f'{top:g}px'
            cl = (g.get('left') or '').strip()
            ml = re.fullmatch(r'(-?[\d.]+)px', cl)
            mg = re.fullmatch(r'calc\(50% - ([\d.]+)px \+ (-?[\d.]+)px\)', cl)
            if ml and abs(float(ml.group(1)) - left) > 0.5: g['left'] = f'{left:g}px'
            elif mg and abs(float(mg.group(1)) - ART_W[scr] / 2) < 0.5 and abs(float(mg.group(2)) - left) > 0.5: g['left'] = f'calc(50% - {ART_W[scr] / 2:g}px + {left:g}px)'
            elif not cl and scr == '1200' and not par: g['left'] = f'calc(50% - {ART_W[scr] / 2:g}px + {left:g}px)' if (d.get('container') or 'grid') == 'grid' else f'{left:g}px'
    # sort by top at 1200 then left
    def key(s):
        g = s['geo'].get('1200', {})
        def num(v):
            try: return float(re.sub(r'[^\d.-]', '', v))
            except: return 9999
        return (num(g.get('top', '9999')), num(g.get('left', '9999')))
    specs.sort(key=key)
    return dict(rec=rid, vis=vis, artboard=artattrs, artcss=artcss, elems=specs, groups=groups, tree=tree)

def fmt(spec):
    L = [f"## {spec['rec']}  {('VISIBILITY: ' + spec['vis'] + '  ') if spec.get('vis') else ''}artboard: " + ', '.join(f'{k}={v}' for k, v in spec['artboard'].items() if k not in ('recid',))]
    for scr in SCREENS:
        c = spec['artcss'].get(scr)
        if c: L.append(f"   artboard@{scr}: " + ' '.join(f'{k}:{v}' for k, v in c.items()))
    for g in spec.get('groups', []):
        L.append(f"- [GROUP] #{g['id']}" + (f" cls={g['cls']}" if g['cls'] else '') + f"  members={','.join(g['members'])}")
        for scr in SCREENS:
            d = g['geo'].get(scr)
            if d: L.append(f"    @{scr}: " + ' '.join(f'{k}:{v}' for k, v in d.items()))
    for e in spec['elems']:
        head = f"- [{e['type']}] #{e['id']}"
        if e['cls']: head += f" cls={e['cls']}"
        if e['text']: head += f"  «{e['text'][:200]}»"
        if e['href']: head += f"  → {e['href']}"
        if e['img']: head += f"  img={os.path.basename(e['img'])}"
        L.append(head)
        for scr in SCREENS:
            g = e['geo'].get(scr)
            if g: L.append(f"    @{scr}: " + ' '.join(f'{k}:{v}' for k, v in g.items()))
        if e['fields']: L.append('    fields: ' + ' '.join(f'{k}={v}' for k, v in e['fields'].items()))
        if e['anim']: L.append('    anim: ' + ' '.join(f'{k}={v}' for k, v in e['anim'].items()))
        if e['inline']: L.append('    inline: ' + e['inline'])
        if e['html'] and re.search(r'<(?!br)', e['html']): L.append('    html: ' + e['html'][:600])
    return '\n'.join(L)

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    f = args[0]; want = set(args[1:])
    html = open(os.path.join(ROOT, f), encoding='utf-8', errors='ignore').read()
    recs = re.split(r'(?=<div id="rec\d+" class="r t-rec)', html)
    out = []
    for r in recs:
        m = re.match(r'<div id="(rec\d+)"[^>]*data-record-type="396"', r)
        if not m: continue
        if want and m.group(1) not in want and m.group(1)[3:] not in want: continue
        out.append(block_spec(r))
    if '--json' in sys.argv:
        json.dump(out, open(sys.argv[sys.argv.index('--json') + 1], 'w'), ensure_ascii=False, indent=1)
    else:
        print('\n\n'.join(fmt(s) for s in out))
