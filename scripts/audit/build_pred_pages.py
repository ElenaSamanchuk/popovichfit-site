#!/usr/bin/env python3
"""Страницы /predcor (page41134729) и /predpow (page41134747) из сохранённых копий живого сайта от 06.11.2026 (sources/pred-2026-11-06/)
→ old-site/page41134729.html, old-site/page41134747.html в формате экспорта Тильды (их дальше берёт обычный конвейер pages:sync).

Копии — отрисованный DOM (runtime Тильды). Что делаем:
  1. блок, который есть в свежем экспорте (/course_correction = page41085668, /course_power = page41126306) с тем же id и типом, берём из экспорта;
     остальные — из копии, очищенные от следов рендера (inline-геометрия tn-elem/группы, --zoom, --lh-px, rendered/visible/t-animate_started,
     ленивые превью, клоны слайдера, ссылки CDN Тильды → локальные images/tild…__имя);
  2. десктопная и мобильная копии сверяются после очистки (расхождения → scripts/tmp/pred-desktop-vs-mobile.txt);
  3. «Подходит при беременности» → «Можно в беременность» (решение Елены 09.11); найденные даты/устаревшие тексты → scripts/tmp/pred-stale-text.txt;
  4. картинки, которых нет в old-site/images → scripts/tmp/pred-missing-images.txt (ищем ещё в архивах ../popovichfit-site-archives/*/images).
Запуск из корня проекта: python3 -I scripts/audit/build_pred_pages.py"""
import re, os, sys, glob, html as H

SRC = 'sources/pred-2026-11-06'
PAGES = {'predcor': ('page41134729.html', 'page41085668.html'), 'predpow': ('page41134747.html', 'page41126306.html')}
ARCH = sorted(glob.glob('../popovichfit-site-archives/*/images'))
os.makedirs('scripts/tmp', exist_ok=True)
missing, stale, compare = set(), [], []

def rec_split(h):
    """[(id, type, html)] — записи по порядку, каждая обрезана по парному </div> (хвост страницы не захватывается)"""
    out = []
    for m in re.finditer(r'<div id="rec(\d+)" class="r t-rec[^"]*"[^>]*?data-record-type="(\d+)"', h):
        start = m.start(); depth = 0; end = len(h)
        for t in re.finditer(r'<div\b|</div>', h[start:]):
            depth += 1 if t.group(0) == '<div' else -1
            if depth == 0: end = start + t.end(); break
        out.append((m.group(1), m.group(2), h[start:end]))
    return out

def local_image(url):
    """https://static|thb|optim.tildacdn.*/tild…/[-/…модификаторы/]имя → images/tild…__имя (оригинал из экспорта; варианты resize/webp builder сводит к оригиналу сам)"""
    m = re.match(r'https?://(?:static|thb|optim)\.tildacdn\.\w+/(tild[0-9a-f-]+)/(.*)$', url)
    if not m: return url
    tid, tail = m.groups()
    name = tail.split('?')[0].split('#')[0].rstrip('/').split('/')[-1]
    if not name: return url
    if 'format/webp' in tail: name = re.sub(r'(\.(?:png|jpe?g|gif))\.webp$', r'\1', name)
    base = f'{tid}__{name}'
    if not os.path.exists('old-site/images/' + base) and not any(os.path.exists(os.path.join(a, base)) for a in ARCH): missing.add(url)
    return 'images/' + base

def clean_style(tag_name, cls, style):
    """оставляем только авторские inline-стили; всё, что записал runtime Тильды, убираем"""
    props = [p.strip() for p in style.split(';') if p.strip()]
    keep = []
    for p in props:
        k = p.split(':', 1)[0].strip().lower()
        if k in ('--zoom', '--lh-px'): continue
        if 't396__elem' in cls or 't396__group' in cls or 't396__artboard' in cls or 't396__filter' in cls or 't396__carrier' in cls: continue  # геометрия — из CSS записи
        if 'tn-atom' in cls and k in ('line-height', 'width', 'height', 'min-width', 'min-height') and 'background' not in style: continue
        if 't-slds__arrow' in cls or 't-slds__item' in cls and k == 'width': continue
        if 't746__separator' in cls or 't-slds' == cls.strip() or cls.strip().startswith('t-slds ') and k == 'visibility': continue
        if 'tn-atom__button-icon' in cls and k in ('width', 'height'): continue
        if tag_name == 'div' and re.search(r'\br\b', cls) and k not in ('padding-top', 'padding-bottom', 'background-color'): continue
        keep.append(p)
    return '; '.join(keep) + (';' if keep else '')

RUNTIME_CLASSES = {'t-animate_wait', 't396__artboard_scale', 't-popup__container-static', 't-popup_show', 't-zoomable_loaded', 'rendered', 'visible', 't-animate_started', 't396__artboard-fixed-no-bg', 't-slds__item_dummy', 'loaded', 't-img-loaded', 'js-product-controls-wrapper'}

def clean_rec(r):
    r = re.sub(r'<div[^>]*t-slds__item_dummy[^>]*>.*?</div>\s*</div>\s*(?=</div>|<div class="t-slds__item)', '', r, flags=re.S) if 't-slds__item_dummy' in r else r
    def fix_tag(m):
        tag = m.group(0)
        name = re.match(r'<(\w+)', tag).group(1)
        cm = re.search(r'\sclass="([^"]*)"', tag); cls = cm.group(1) if cm else ''
        new_cls = ' '.join(c for c in cls.split() if c not in RUNTIME_CLASSES)
        if cm: tag = tag.replace(cm.group(0), f' class="{new_cls}"', 1)
        sm = re.search(r'\sstyle="([^"]*)"', tag)
        if sm:
            st = clean_style(name, new_cls, sm.group(1))
            tag = tag.replace(sm.group(0), f' style="{st}"' if st else '', 1)
        return tag
    r = re.sub(r'<(?:div|span|li|button|ul|a|img|svg|h\d|p)\b[^>]*>', fix_tag, r)
    r = re.sub(r'\st-animate__chain_[\w-]+', '', r)
    r = re.sub(r'\s(?:data-observer-ready|data-scale-off|data-artboard-proxy-[\w-]+)="[^"]*"', '', r)  # служебные атрибуты runtime (зависят от экрана)
    r = re.sub(r'<style class="t396__scale-style">.*?</style>', '', r, flags=re.S)
    r = re.sub(r'<style>\s*@media only screen and \(min-width:1366px\)[^<]*</style>', '', r)  # служебное правило runtime  # автоскейл мобильной версии, пишет runtime
    # runtime снимает t-animate после проигрывания анимации: у элементов с data-animate-style возвращаем класс
    r = re.sub(r'<div class="(t585__accordion)"([^>]*data-animate-style=)', r'<div class="\1 t-animate"\2', r)
    r = re.sub(r'<div class="(t396__elem tn-elem[^"]*)"([^>]*data-animate-style=)', lambda m: '<div class="' + (m.group(1) if 't-animate' in m.group(1).split() else m.group(1) + ' t-animate') + '"' + m.group(2), r)
    # Zero Block: парсер экспорта ждёт элементы вида <div class='t396__elem tn-elem …' data-elem-id='…' data-elem-type='…'>
    def elem_quotes(m):
        t = m.group(0)
        t = re.sub(r'class="([^"]*)"', r"class='\1'", t, 1)
        t = re.sub(r'data-elem-id="(\d+)"', r"data-elem-id='\1'", t, 1)
        t = re.sub(r'data-elem-type="(\w+)"', r"data-elem-type='\1'", t, 1)
        return t
    r = re.sub(r'<div class="t396__elem tn-elem[^>]*>', elem_quotes, r)
    r = re.sub(r'<div class="tn-atom"\s+field=', "<div class='tn-atom' field=", r)
    r = re.sub(r'url\((?:&quot;|&#39;|\'|\")?(https?://[^)\s&\'\"]+?)(?:&quot;|&#39;|\'|\")?\)', lambda m: "url('" + m.group(1) + "')", r)  # url(&quot;…&quot;) → url('…')
    # метка data-ready от inline-скриптов Тильды (DOM-копия снята после их запуска): с ней наш initSafetyDialog считал окно #safety уже
    # инициализированным и не вешал обработчики — ссылка #safety не открывала окно
    r = r.replace(' data-ready="true"', '')
    # url(&quot; images/x.jpg&quot; ) (DOM-копия: кавычки-сущности и пробелы внутри url) → url('images/x.jpg'); иначе в данные уезжал «x.jpg_quot_» и фон давал 404
    r = re.sub(r'url\(\s*(?:&quot;|&#39;|\'|\")\s*([^)&\'\"]+?)\s*(?:&quot;|&#39;|\'|\")\s*\)', lambda m: "url('" + m.group(1) + "')", r)
    # ссылки CDN Тильды → локальные файлы
    r = re.sub(r'https?://(?:static|thb|optim)\.tildacdn\.\w+/tild[^"\')\s&<]+', lambda m: local_image(m.group(0)), r)
    r = re.sub(r"https?://static\.tildacdn\.\w+/lib/([^'\")\s]+)", lambda m: '../images/lib__' + m.group(1).replace('/', '__'), r)  # иконки библиотеки Тильды: как в экспорте
    r = r.replace('--zoom: 1;', '')
    r = re.sub(r'style="\s*"', 'style=" "', r)
    return r

def norm_text(r):
    """для сверки десктоп/мобильная: без атрибутов style и пробельных различий"""
    return re.sub(r'\s+', ' ', re.sub(r'\sstyle="[^"]*"', '', r)).strip()

def head_of(h):
    hd = h.split('</head>')[0]
    g = lambda pat: (re.search(pat, hd) or [None, ''])[1]
    og_img = local_image(g(r'<meta property="og:image" content="([^"]*)"')) if g(r'<meta property="og:image" content="([^"]*)"') else ''
    fav = local_image(g(r'<link rel="shortcut icon" href="([^"]*)"'))
    out = ['<!DOCTYPE html><html><head><meta charset="utf-8">', f'<title>{g(chr(60)+"title>([^<]*)</title>")}</title>']
    d = g(r'<meta name="description" content="([^"]*)"')
    if d: out.append(f'<meta name="description" content="{d}">')
    for p in ('title', 'description'):
        v = g(r'<meta property="og:%s" content="([^"]*)"' % p)
        out.append(f'<meta property="og:{p}" content="{v}">')
    if og_img: out.append(f'<meta property="og:image" content="{og_img}">')
    out.append(f'<link rel="canonical" href="{g(chr(60)+"link rel=" + chr(34) + "canonical" + chr(34) + " href=" + chr(34) + "([^" + chr(34) + "]*)" + chr(34))}">')
    if '<meta name="robots" content="noindex">' in hd: out.append('<meta name="robots" content="noindex">')
    out.append(f'<link rel="shortcut icon" href="{fav}" type="image/x-icon">')
    out.append('</head><body class="t-body">')
    return '\n'.join(out)

def main():
    if not os.path.exists('old-site/htaccess'): sys.exit('нет old-site/ — сначала распакуйте экспорт')
    # картинки страниц продаж, которых нет в экспорте: скачаны с исходных адресов 09.11, переживают новый экспорт
    import shutil
    for f in glob.glob(f'{SRC}/images/*'): shutil.copy2(f, 'old-site/images/' + os.path.basename(f))
    for name, (out_file, exp_file) in PAGES.items():
        exp = {i: (t, r) for i, t, r in rec_split(open('old-site/' + exp_file, encoding='utf-8', errors='ignore').read())}
        d_html = open(f'{SRC}/{name}-desktop.html', encoding='utf-8').read()
        m_html = open(f'{SRC}/{name}-mobile.html', encoding='utf-8').read()
        d, mob = rec_split(d_html), {i: r for i, _, r in rec_split(m_html)}
        parts, report = [], []
        for rid, typ, r in d:
            if rid in exp and exp[rid][0] == typ:
                parts.append(exp[rid][1]); report.append((rid, typ, 'экспорт'))
                continue
            c = clean_rec(r)
            # сверка с мобильной копией
            if rid in mob:
                if norm_text(clean_rec(mob[rid])) != norm_text(c): compare.append(f'{name} rec{rid} (T{typ}): десктопная и мобильная копии различаются после очистки (взята десктопная)')
            else: compare.append(f'{name} rec{rid}: нет в мобильной копии')
            # текст: «Подходит при беременности» → «Можно в беременность»
            TAG = r'Подходит(?:\s|&nbsp;|\u00a0)+при(?:\s|&nbsp;|\u00a0)+беременности'
            n = len(re.findall(TAG, c))
            if n: c = re.sub(TAG, 'Можно в беременность', c); report.append((rid, typ, f'копия; заменено «Подходит при беременности» ×{n}'))
            else: report.append((rid, typ, 'копия'))
            # устаревшее: даты, «потока», «до N»
            txt = re.sub(r'<(script|style)\b.*?</\1>', ' ', c, flags=re.S); txt = H.unescape(re.sub(r'<[^>]+>', ' ', txt))
            for mm in re.finditer(r'[^.!?\n]{0,60}(?:\d{1,2}\s+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)|20[12]\d)[^.!?\n]{0,50}', txt):
                stale.append(f'{name} rec{rid}: …{re.sub(chr(32)+"+", chr(32), mm.group(0)).strip()}…')
            parts.append(c)
        doc = head_of(d_html) + '\n<!--allrecords-->\n<div id="allrecords" class="t-records">\n' + '\n'.join(parts) + '\n</div>\n<!--/allrecords-->\n</body></html>\n'
        open('old-site/' + out_file, 'w', encoding='utf-8').write(doc)
        open(f'scripts/tmp/pred-blocks-{name}.txt', 'w', encoding='utf-8').write('\n'.join(f'rec{a} T{b}: {c}' for a, b, c in report) + '\n')
        print(f'{out_file}: {len(d)} блоков (из экспорта {sum(1 for x in report if x[2]=="экспорт")}, из копии {sum(1 for x in report if x[2]!="экспорт")})')
    open('scripts/tmp/pred-desktop-vs-mobile.txt', 'w', encoding='utf-8').write('\n'.join(compare) + '\n')
    open('scripts/tmp/pred-stale-text.txt', 'w', encoding='utf-8').write('\n'.join(sorted(set(stale))) + '\n')
    open('scripts/tmp/pred-missing-images.txt', 'w', encoding='utf-8').write('\n'.join(sorted(missing)) + '\n')
    print(f'расхождений десктоп/мобильная: {len(compare)}; строк с датами/годами: {len(set(stale))}; нет картинок локально: {len(missing)}')
main()
