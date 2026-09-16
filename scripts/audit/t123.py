#!/usr/bin/env python3
"""Собирает все блоки T123 («HTML-код», data-record-type=131) из old-site/*.html, дедуплицирует
по содержимому и пишет docs/tilda-custom-code/NNN_<страниц>p_<hash>.html + docs/custom-code-inventory.md.
Запуск из корня проекта: python3 scripts/audit/t123.py
"""
import re, os, glob, collections, hashlib, shutil
ROOT = 'old-site'
OUTDIR = 'docs/tilda-custom-code'
OUTMD = 'docs/custom-code-inventory.md'
uniq = {}
for f in sorted(glob.glob(os.path.join(ROOT, '*.html'))):
    html = open(f, encoding='utf-8', errors='ignore').read()
    recs = re.split(r'(?=<div id="rec\d+" class="r t-rec)', html)
    for r in recs:
        m = re.match(r'<div id="(rec\d+)"[^>]*data-record-type="131"', r)
        if not m: continue
        b = re.search(r'<!-- nominify begin -->(.*?)<!-- nominify end -->', r, re.S)
        body = (b.group(1) if b else '').strip()
        h = hashlib.md5(body.encode()).hexdigest()[:8]
        u = uniq.setdefault(h, dict(body=body, pages=set(), recs=set()))
        u['pages'].add(os.path.basename(f)); u['recs'].add(m.group(1))
shutil.rmtree(OUTDIR, ignore_errors=True); os.makedirs(OUTDIR)
items = sorted(uniq.items(), key=lambda kv: (-len(kv[1]['pages']), kv[0]))
def label(body):
    t = re.sub(r'\s+', ' ', body)
    for pat, name in [
        (r'sticky-footer', 'Прилипающий подвал (mt-webdesign)'), (r'VK\.Retargeting', 'VK-пиксель ретаргетинга'),
        (r'uc-bonus-apply', 'Стили кнопок бонусов (Collabza)'), (r'NOLIM', 'NOLIM: скрыть блоки без Tilda Members'),
        (r'fiksirovannoe-menyu-zeroblock', 'Фиксация Zero-блока (romanyu)'), (r't-rec_pb_75', 'Обнуление padding .t-rec_pb_75'),
        (r"urlParams\.get\('r'\)", 'Проброс ?r= (и utm) в ссылки блока'), (r'cookieConsent', 'Cookie-баннер (localStorage)'),
        (r'gso\.amocrm', 'amoCRM social button'), (r'Скрипт в перенос|вывод коды', 'Заглушка Collabza (tilda-tools)'),
        (r'senndder\.ru/popovichfit-widget', 'Виджет поддержки Sender'), (r'nn99\.ru/widget\.js', 'Виджет поддержки NN99'),
        (r'horizontal-scroll', 'Горизонтальный скролл Zero (VORON)'), (r'skroll-strelki', 'Скролл стрелками (romanyu, scrollbooster)'),
        (r'skroll-s-uderzhaniem', 'Скролл с зажатой мышью (romanyu)'), (r'form-redirection-timeout', 'Отложенный показ блока (necodim)'),
        (r'TICODE', 'TICODE dragscroll'), (r'PF_CARDS', 'Карточки тарифов PF_CARDS (ссылки на checkout ЛК)'),
        (r'popovich-tariffs', 'iframe тарифов с GitHub Pages (popovichfit-tariffs)'), (r'plashka', 'Плашка розыгрыша NASHA (inline)'),
        (r'simple-preloader', 'Прелоадер (mt-webdesign)'), (r'position: sticky', 'Sticky-блок'), (r'SmoothScroll', 'SmoothScroll cdnjs'),
        (r'drive\.google\.com', 'iframe Google Drive'), (r'setInterval', 'Скрипт с setInterval (ЛК/баланс, legacy)'),
        (r'members|memberarea', 'Tilda Members (legacy)'),
    ]:
        if re.search(pat, t): return name
    return ''
with open(OUTMD, 'w', encoding='utf-8') as o:
    o.write('# Инвентарь кастомного кода (блоки T123 «HTML-код») в экспорте Тильды\n\n')
    o.write(f'Всего вхождений T123: **{sum(len(v["recs"]) for v in uniq.values())}** на 220 страницах, уникальных тел: **{len(uniq)}**, суммарно ~{sum(len(v["body"]) for v in uniq.values())//1024} КБ. ')
    o.write('Полные тексты — в `docs/tilda-custom-code/` (имя: порядковый номер, число страниц, hash). Сгенерировано `scripts/audit/t123.py`.\n\n')
    o.write('| # | страниц | байт | назначение | первая строка |\n|---|---|---|---|---|\n')
    for i, (h, v) in enumerate(items):
        name = f'{i:03d}_{len(v["pages"]):03d}p_{h}.html'
        with open(os.path.join(OUTDIR, name), 'w', encoding='utf-8') as w:
            w.write(f'<!-- pages ({len(v["pages"])}): {" ".join(sorted(v["pages"]))} -->\n<!-- rec ids: {" ".join(sorted(v["recs"]))} -->\n')
            w.write(v['body'])
        first = re.sub(r'\s+', ' ', v['body'])[:90].replace('|', '¦')
        o.write(f'| {i:03d} | {len(v["pages"])} | {len(v["body"])} | {label(v["body"])} | `{first}` |\n')
print('unique', len(uniq), '->', OUTDIR, OUTMD)
