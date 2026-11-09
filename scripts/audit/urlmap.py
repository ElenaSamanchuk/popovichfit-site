#!/usr/bin/env python3
"""Генерирует docs/old-site-url-map.md из old-site/htaccess, sitemap.xml, robots.txt и *.html.
Запуск из корня проекта: python3 scripts/audit/urlmap.py
"""
import re, os, glob, collections
ROOT = 'old-site'
OUT = 'docs/old-site-url-map.md'

ht = open(os.path.join(ROOT, 'htaccess'), encoding='utf-8').read()
routes = collections.OrderedDict()  # slug -> file
for m in re.finditer(r'RewriteRule \^([^\s$]+?)/?\$ (page\d+\.html)', ht):
    routes.setdefault(m.group(1), m.group(2))
file2slugs = collections.defaultdict(list)
for s, f in routes.items():
    file2slugs[f].append(s)
sitemap = open(os.path.join(ROOT, 'sitemap.xml'), encoding='utf-8').read()
sm = set(re.findall(r'<loc>https://popovichfit\.ru/?([^<]*)</loc>', sitemap))
robots = open(os.path.join(ROOT, 'robots.txt'), encoding='utf-8').read()
dis = set(l.split(':', 1)[1].strip().lstrip('/') for l in robots.splitlines() if l.startswith('Disallow:') and l.split(':', 1)[1].strip())
files = sorted(os.path.basename(f) for f in glob.glob(os.path.join(ROOT, '*.html')))

def info(f):
    h = open(os.path.join(ROOT, f), encoding='utf-8', errors='ignore').read()
    t = re.search(r'<title>([^<]*)</title>', h)
    return dict(
        title=(t.group(1) if t else '').replace('&lrm;', '').replace('|', '¦').strip() or '—',
        noindex=bool(re.search(r'name="robots" content="[^"]*noindex', h)),
        zero=len(re.findall(r'class="t396__artboard', h)),
        forms=len(re.findall(r'<form', h)),
        members='tilda-members' in h,
        kb=os.path.getsize(os.path.join(ROOT, f)) // 1024,
        widget=('Sender' if 'senndder.ru/popovichfit-widget' in h else 'NN99' if 'www.nn99.ru/widget.js' in h else 'amoCRM' if 'gso.amocrm.ru' in h else '—'),
    )

# --- категории ---
CORE = 'about results community media media_1_otek mediah media_gluteal_muscles media_mtd2 media_kor mif course_correction course_power new-course korrekciya-new silovye-new inventory sertif taplink support delete successful_payment error-auth promo priut draw money_draw gift1 mk_msk'.split()
LEGAL = 'oferta privacy consent part_oferta data-consent doc_l'.split()
COMMUNITY = 'spikery guest_sorkin guest_gulmanova guest_kineziofitness guest_nogteva guest_ulana guest_redkina guest_drigo guest_korneva guide_makeup trends_23 inspiration popovichlec page01 page02 page03 page04'.split()
MATERIALS = 'bonus bonus1 bonus2 bonus3 bonus4 bonus6 nutric nutric-lk analys-lk menu7-lk diet_analysis menu menu7 pitanie eat eating warmup ifr taping ifrtaping knees body regime health lifestyle max extra test_content test_mtd test_gbd ins brief vvedine_tariff inventar inv_corr inv_pow inventory1'.split()
LEGACY_LK_RE = re.compile(r'^(\d+day|20cor\d+|20pow\d+|cor\d|pow\d|lkcor.*|lkpow.*|lk_cor_end|lk_pow_end|before|test1313|chat_anasatiya|chatpow|add_tr_ofelia|lknachalo|gift|profile-lk|history-ballance|members/signup|ogin1|m)$')
NO_SLUG_LIVE = {  # страницы без slug, но осмысленные (есть в sitemap, отдают 200)
    'page103420636.html': 'Итоги 2025 года (по htaccess /year-results вёл на другой, удалённый файл)',
    'page128228306.html': 'Плашка «Нам важно оставаться на связи» (ВК)',
    'page144406906.html': 'Плашка «Перейти в ВК»',
    'page149736926.html': 'Блок «Хотите подарить POPOVICHFIT»',
    'page203369409.html': 'Плашки розыгрыша NASHA (inline T123 Елены)',
    'page50584427.html': 'Инструкция к курсу (большая, для учениц)',
    'page59078765.html': 'Лендинг «Функциональные коррекционные тренировки»',
    'page94453166.html': 'Лендинг «Бесплатные тренировки и материалы»',
    'page60771825.html': 'Реферальная программа — FAQ («лк реф»)',
    'page53039655.html': 'Программа курса «Коррекция» (образовательная программа)',
    'page64757171.html': 'Лендинг «РЕДИЗ» (telegram-бот уведомлений)',
    'page36594700.html': 'ГЛАВНАЯ (DirectoryIndex)',
}
DRAFT_HINT = re.compile(r'copy of|черновик|blank page|тест|test|редиз|в работе|готово\)|для тимура|для теста', re.I)

rows = []
for f in files:
    slugs = file2slugs.get(f, [])
    i = info(f)
    url = '/' + slugs[0] if slugs else '/' + f
    in_sm = (slugs[0] in sm if slugs else f in sm) or f == 'page36594700.html'
    disallow = any(s in dis for s in slugs) or f in dis
    if f == 'page36594700.html': cat = 'A'
    elif f == '404.html': cat = 'S'
    elif slugs and slugs[0] in CORE: cat = 'A'
    elif slugs and slugs[0] in LEGAL: cat = 'B'
    elif slugs and slugs[0] in COMMUNITY: cat = 'C'
    elif slugs and slugs[0] in MATERIALS: cat = 'D'
    elif slugs and LEGACY_LK_RE.match(slugs[0]): cat = 'E'
    elif f in NO_SLUG_LIVE: cat = 'F'
    elif slugs and slugs[0] in ('futer', 'testvvedenie', 'payment-test'): cat = 'S'
    else: cat = 'S'
    rows.append(dict(f=f, url=url, slugs=slugs, cat=cat, in_sm=in_sm, disallow=disallow, note=NO_SLUG_LIVE.get(f, ''), **i))

CATS = [
    ('A', 'Ядро сайта — навигация, курсы, продажи', 'Переносить обязательно, 1:1.'),
    ('B', 'Юридические документы', 'Переносить обязательно, текст дословно.'),
    ('C', 'Сообщество, гости, лид-магниты', 'Переносить (публичные, в sitemap).'),
    ('D', 'Материалы для учениц (на них ведут ссылки из ЛК/рассылок)', 'Переносить обязательно — URL не менять.'),
    ('E', 'Legacy «ЛК на Тильде»: уроки по датам, стартовые, Tilda Members', 'СЕРАЯ ЗОНА — скорее всего мертвы после переезда ЛК на lk.popovichfit.ru.'),
    ('F', 'Страницы без slug, но живые (URL вида /pageNNN.html)', 'Переносить, URL /pageNNN.html сохранить.'),
    ('S', 'Черновики, копии, тесты, служебные', 'Не переносить (список — на подтверждение).'),
]
missing = []
for s, f in routes.items():
    if f not in files: missing.append((s, f))

with open(OUT, 'w', encoding='utf-8') as o:
    o.write('# Карта страниц popovichfit.ru (экспорт Тильды от 31.08.2026)\n\n')
    o.write('Источник: `old-site/htaccess` (RewriteRule), `old-site/sitemap.xml`, `old-site/robots.txt`, `old-site/*.html`. Сгенерировано `scripts/audit/urlmap.py`.\n\n')
    o.write(f'Всего HTML в архиве: **{len(files)}**. Маршрутов в htaccess: **{len(routes)}**, из них без файла в архиве (не опубликованы, на живом сайте 404): **{len(missing)}**. URL в sitemap: **{len(sm)}**.\n\n')
    o.write('Колонки: `sm` — есть в sitemap.xml; `ni` — meta noindex; `dis` — Disallow в robots.txt; `Z` — число Zero Block; `frm` — формы Тильды; `виджет` — какой чат-виджет подключён.\n\n')
    for c, name, verdict in CATS:
        sub = [r for r in rows if r['cat'] == c]
        o.write(f'## {c}. {name} ({len(sub)})\n\n_{verdict}_\n\n')
        o.write('| URL | Файл | Заголовок | sm | ni | dis | Z | frm | KB | виджет | примечание |\n|---|---|---|---|---|---|---|---|---|---|---|\n')
        for r in sorted(sub, key=lambda r: r['url']):
            extra = (' / ' + ', '.join('/' + s for s in r['slugs'][1:])) if len(r['slugs']) > 1 else ''
            o.write(f"| `{r['url']}`{extra} | {r['f']} | {r['title'][:70]} | {'✓' if r['in_sm'] else ''} | {'✓' if r['noindex'] else ''} | {'✓' if r['disallow'] else ''} | {r['zero']} | {r['forms'] or ''} | {r['kb']} | {r['widget']} | {r['note']}{' · Tilda Members' if r['members'] else ''} |\n")
        o.write('\n')
    o.write(f'## X. Маршруты htaccess без файла в архиве ({len(missing)})\n\n_На живом сайте отдают 404 (страницы сняты с публикации). Решение: 404 или 301 — см. серые зоны._\n\n| URL | Файл |\n|---|---|\n')
    for s, f in missing: o.write(f'| `/{s}` | {f} |\n')
print('written', OUT, 'rows', len(rows), 'missing', len(missing))
print(collections.Counter(r['cat'] for r in rows))
