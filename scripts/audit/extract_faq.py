#!/usr/bin/env python3
"""Аккордеоны T585 (FAQ) из экспорта → app/data/faq.ts. Ключ — id блока (recNNN) + страница."""
import re, os, glob, json, html as H
ROOT='old-site'
out={}
for f in sorted(glob.glob(os.path.join(ROOT,'*.html'))):
    h=open(f,encoding='utf-8',errors='ignore').read()
    for m in re.finditer(r'<div id="(rec\d+)" class="r t-rec[^"]*"[^>]*data-record-type="585"', h):
        rid=m.group(1); i=m.start(); j=h.find('<div id="rec', i+10); b=h[i:j]
        items=[]
        for t,d in re.findall(r'<span class="t585__title[^"]*"[^>]*>(.*?)</span>.*?<div class="t585__text[^"]*"[^>]*>(.*?)</div>', b, re.S):
            title=H.unescape(re.sub(r'\s+',' ',re.sub(r'<[^>]+>','',t))).strip()
            desc=re.sub(r'\s+',' ',d).strip()
            items.append(dict(title=title, html=desc))
        key=f"{os.path.basename(f)}:{rid}"
        out[key]=items
json.dump(out,open('docs/faq.json','w'),ensure_ascii=False,indent=1)
# dedupe identical lists
uniq={}
for k,v in out.items():
    sig=json.dumps(v,ensure_ascii=False)
    uniq.setdefault(sig,[]).append(k)
print(len(out),'blocks,',len(uniq),'unique lists')
for sig,keys in uniq.items():
    v=json.loads(sig); print(len(v),'items:',keys[:6], '| first:', v[0]['title'][:60] if v else '')
