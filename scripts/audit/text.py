#!/usr/bin/env python3
"""Полный текст/HTML элементов Zero Block по id: python3 scripts/audit/text.py page36594700.html 1749249776141 ..."""
import re, sys, os, html as H
h=open(os.path.join('old-site', sys.argv[1]), encoding='utf-8', errors='ignore').read()
for eid in sys.argv[2:]:
    i=h.find(f"data-elem-id='{eid}'")
    if i<0: print(eid, 'NOT FOUND'); continue
    seg=h[i:i+20000]
    m=re.search(r"class=['\"]tn-atom(?:__button-text)?['\"][^>]*>(.*?)</(?:div|span|a)>\s*(?:</div>)?", seg, re.S)
    inner=re.sub(r'\s+',' ',m.group(1)).strip() if m else '?'
    txt=H.unescape(re.sub(r'<[^>]+>','',re.sub(r'<br\s*/?>','⏎',inner)))
    print(f"--- {eid}\nTEXT: {txt}\nHTML: {inner}")
