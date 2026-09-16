import re, os, glob, json, collections
ROOT = 'old-site'
ht = open(os.path.join(ROOT,'htaccess'), encoding='utf-8').read()
routes = {}
for m in re.finditer(r'RewriteRule \^([^\s$]+?)/?\$ (page\d+\.html)', ht):
    routes.setdefault(m.group(2), []).append(m.group(1))
sitemap = open(os.path.join(ROOT,'sitemap.xml'), encoding='utf-8').read()
sm_urls = set(re.findall(r'<loc>([^<]+)</loc>', sitemap))
robots = open(os.path.join(ROOT,'robots.txt'), encoding='utf-8').read()
disallowed = set(l.split(':',1)[1].strip() for l in robots.splitlines() if l.startswith('Disallow:') and l.split(':',1)[1].strip())

rows = []
for f in sorted(glob.glob(os.path.join(ROOT,'*.html'))):
    name = os.path.basename(f)
    html = open(f, encoding='utf-8', errors='ignore').read()
    title = re.search(r'<title>([^<]*)</title>', html)
    title = title.group(1) if title else ''
    slugs = routes.get(name, [])
    urls = ['/'+s for s in slugs] or ['/'+name]
    in_sitemap = any(('https://popovichfit.ru'+u) in sm_urls for u in urls) or ('https://popovichfit.ru/'+name) in sm_urls or (name=='page36594700.html')
    noindex = 'name="robots" content="noindex"' in html
    rec = len(re.findall(r'<div id="rec\d+"', html))
    zero = len(re.findall(r'class="t396__artboard', html))
    forms = len(re.findall(r'<form', html))
    formsapi = 'forms.tildaapi' in html or 'tilda-forms' in html
    members = 'tilda-members' in html
    t123 = len(re.findall(r't123', html))
    kinescope = len(re.findall(r'kinescope\.io', html))
    youtube = len(re.findall(r'youtube\.com', html))
    iframe = len(re.findall(r'<iframe', html))
    amocrm = 'amocrm' in html
    metrika = len(set(re.findall(r'ym\((\d+)', html)))
    store = 't-store' in html or 't706' in html
    payments = 'tilda-payments' in html or 't-payment' in html
    popup = 'tilda-popup' in html
    lkl = len(re.findall(r'lk\.popovichfit\.ru', html))
    senndder = 'senndder' in html
    size = os.path.getsize(f)
    blocks = collections.Counter(re.findall(r'<div id="rec\d+" class="r t-rec[^"]*"[^>]*data-record-type="(\d+)"', html))
    rows.append(dict(file=name, slugs=slugs, title=title, sitemap=in_sitemap, noindex=noindex, disallow=any(('/'+s) in disallowed or ('/'+name) in disallowed for s in (slugs or [''])), rec=rec, zero=zero, forms=forms, formsapi=formsapi, members=members, t123=t123, kinescope=kinescope, youtube=youtube, iframe=iframe, amocrm=amocrm, metrika=metrika, store=store, payments=payments, popup=popup, lk=lkl, senndder=senndder, size=size, blocks=dict(blocks)))
json.dump(rows, open('pages.json','w'), ensure_ascii=False, indent=1)
print('pages:', len(rows))
print('in sitemap:', sum(r['sitemap'] for r in rows))
print('noindex:', sum(r['noindex'] for r in rows))
print('members:', sum(r['members'] for r in rows))
print('with forms:', sum(1 for r in rows if r['forms']))
print('formsapi:', sum(r['formsapi'] for r in rows))
print('zero blocks total:', sum(r['zero'] for r in rows), 'pages with zero:', sum(1 for r in rows if r['zero']))
print('kinescope pages:', sum(1 for r in rows if r['kinescope']))
print('youtube pages:', sum(1 for r in rows if r['youtube']))
print('amocrm pages:', sum(r['amocrm'] for r in rows))
print('store/payments:', sum(r['store'] or r['payments'] for r in rows))
print('senndder:', sum(r['senndder'] for r in rows))
print('no slug (only pageNNN.html):', sum(1 for r in rows if not r['slugs']))
print()
# block type frequency
bt = collections.Counter()
for r in rows:
    for k,v in r['blocks'].items(): bt[k]+=v
print('block types:', bt.most_common(40))
