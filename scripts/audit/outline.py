import re, sys, os, html as H
ROOT = 'old-site'
f = sys.argv[1]
html = open(os.path.join(ROOT,f), encoding='utf-8', errors='ignore').read()
recs = re.split(r'(?=<div id="rec\d+" class="r t-rec)', html)
for r in recs[1:]:
    m = re.match(r'<div id="(rec\d+)" class="r t-rec([^"]*)"[^>]*data-record-type="(\d+)"', r)
    if not m: continue
    rid, cls, t = m.groups()
    vis = ' '.join(re.findall(r'data-screen-(?:min|max)="[^"]*"', r[:r.find('>')]))
    if vis: cls += ' ' + vis
    # text content
    body = re.sub(r'<script.*?</script>', ' ', r, flags=re.S)
    body = re.sub(r'<style.*?</style>', ' ', body, flags=re.S)
    txt = re.sub(r'<[^>]+>', ' ', body)
    txt = H.unescape(re.sub(r'\s+', ' ', txt)).strip()
    hidden = 'r_hidden' in cls
    arts = re.findall(r'data-artboard-screens="([^"]*)"', r)
    imgs = len(re.findall(r'<img', r))
    hooks = re.findall(r'data-tooltip-hook="([^"]*)"', r)
    uc = re.findall(r'class="r t-rec[^"]*?(uc-[\w-]+)', r)
    print(f"{rid:>14} T{t:<5} {'HIDDEN ' if hidden else ''}{('uc:'+','.join(uc)+' ') if uc else ''}{('hook:'+','.join(hooks)+' ') if hooks else ''}imgs={imgs:<3} {('art:'+arts[0]+' ') if arts else ''}| {txt[:140]}")
