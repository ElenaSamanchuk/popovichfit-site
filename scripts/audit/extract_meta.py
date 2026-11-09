#!/usr/bin/env python3
"""Мета всех страниц экспорта → docs/meta.json (title, description, og, canonical, noindex, slug, header/footer наличие)."""
import re, os, glob, json, html as H
ROOT='old-site'
CFG=json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'export-config.json'),encoding='utf-8'))
DRAFT=set(CFG['draft']['files']); CUSTOM=set(CFG['customRoutes']['files'])
HDR=CFG['chromeRecs']['header']; FTR=CFG['chromeRecs']['footer']
ht=open(os.path.join(ROOT,'htaccess'),encoding='utf-8').read()
file2slugs={}
for m in re.finditer(r'RewriteRule \^([^\s$]+?)/?\$ (page\d+\.html)', ht):
    file2slugs.setdefault(m.group(2),[]).append(m.group(1))
def attr(h, pat):
    m=re.search(pat,h); return H.unescape(m.group(1)).strip() if m else ''
out={}
for f in sorted(glob.glob(os.path.join(ROOT,'*.html'))):
    n=os.path.basename(f)
    if n in DRAFT: continue  # черновик без адреса — в сайт не включаем
    h=open(f,encoding='utf-8',errors='ignore').read()
    head=h.split('</head>')[0]
    out[n]=dict(
        slugs=file2slugs.get(n,[]),
        url=('/'+file2slugs[n][0]) if n in file2slugs else ('/' if n=='page36594700.html' else '/'+n),
        title=attr(head,r'<title>([^<]*)</title>').replace('‎',''),
        description=attr(head,r'<meta name="description" content="([^"]*)"'),
        ogTitle=attr(head,r'<meta property="og:title" content="([^"]*)"'),
        ogDescription=attr(head,r'<meta property="og:description" content="([^"]*)"'),
        ogImage=attr(head,r'<meta property="og:image" content="([^"]*)"'),
        ogUrl=attr(head,r'<meta property="og:url" content="([^"]*)"'),
        canonical=attr(head,r'<link rel="canonical" href="([^"]*)"'),
        noindex=bool(re.search(r'name="robots" content="[^"]*noindex', head)),
        favicon=attr(head,r'<link rel="shortcut icon" href="([^"]*)"'),
        members='tilda-members' in h,
        header=any('id="rec%s"'%i in h for i in HDR),
        footer=any('id="rec%s"'%i in h for i in FTR),
        customRoute=n in CUSTOM,
        mobileMenu='id="rec592229670"' in h,
        cookie='id="rec2019524321"' in h,
        vkNotice=bool(re.search(r'Дублируем информацию в других соцсетях', h)),
        bodyBg=attr(h,r'<body[^>]*class="t-body"[^>]*style="[^"]*background-color:([^;"]*)') ,
        zero=len(re.findall(r'class="t396__artboard',h)),
        recs=[m for m in re.findall(r'<div id="(rec\d+)" class="r t-rec',h)],
        types=re.findall(r'data-record-type="(\d+)"',h),
    )
json.dump(out,open('docs/meta.json','w'),ensure_ascii=False,indent=1)
print(len(out),'pages')
import collections
print('with header:',sum(v['header'] for v in out.values()),'footer:',sum(v['footer'] for v in out.values()),'vk:',sum(v['vkNotice'] for v in out.values()))
print('canonicals sample:',[v['canonical'] for v in list(out.values())[:5]])
print('og:image sample:',[v['ogImage'] for v in list(out.values())[:3]])
