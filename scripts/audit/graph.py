import re, os, glob, json, collections
ROOT='old-site'
ht=open(os.path.join(ROOT,'htaccess'),encoding='utf-8').read()
slug2file={}
for m in re.finditer(r'RewriteRule \^([^\s$]+?)/?\$ (page\d+\.html)', ht):
    slug2file.setdefault(m.group(1).lower(), m.group(2))
file2slug=collections.defaultdict(list)
for s,f in slug2file.items(): file2slug[f].append(s)
files=set(os.path.basename(f) for f in glob.glob(os.path.join(ROOT,'*.html')))
def norm(href):
    href=href.strip()
    if href.startswith('#') or href.startswith('tg:') or href.startswith('mailto:') or href.startswith('tel:'): return None
    m=re.match(r'^(?:https?:)?//(?:www\.)?popovichfit\.ru/?([^#?]*)', href)
    if m: path=m.group(1)
    elif re.match(r'^https?://', href) or href.startswith('//'): return None
    else: path=href.lstrip('/').split('#')[0].split('?')[0]
    path=path.rstrip('/').lower()
    if path=='' : return 'page36594700.html'
    if path.endswith('.html'): return path if path in files else 'MISSING:'+path
    return slug2file.get(path, 'MISSING:/'+path)
links=collections.defaultdict(set)
for f in files:
    h=open(os.path.join(ROOT,f),encoding='utf-8',errors='ignore').read()
    for href in re.findall(r'<a\s[^>]*?href=["\']([^"\']+)["\']', h):
        t=norm(href)
        if t: links[f].add(t)
    # also JS redirects / window.location
    for href in re.findall(r'(?:location\.href|window\.open)\s*[=(]\s*["\']([^"\']+)', h):
        t=norm(href)
        if t: links[f].add(t)
# BFS from main
start='page36594700.html'
seen={start}; q=[start]
while q:
    f=q.pop()
    for t in links[f]:
        if t.startswith('MISSING'): continue
        if t not in seen: seen.add(t); q.append(t)
print('reachable from main:', len(seen), 'of', len(files))
unreach=sorted(files-seen)
titles={}
for f in files:
    h=open(os.path.join(ROOT,f),encoding='utf-8',errors='ignore').read(4000)
    m=re.search(r'<title>([^<]*)</title>',h); titles[f]=m.group(1) if m else ''
print('\n=== REACHABLE from main ===')
for f in sorted(seen):
    print(f"{f:22} {','.join(file2slug.get(f,[])):28} | {titles[f][:60]}")
print('\n=== links to MISSING targets (pages not in archive), by count ===')
miss=collections.Counter()
for f,ts in links.items():
    for t in ts:
        if t.startswith('MISSING'): miss[t]+=1
for t,c in miss.most_common(40): print(c, t)
# inbound counts
inb=collections.Counter()
for f,ts in links.items():
    for t in ts: inb[t]+=1
json.dump({'reachable':sorted(seen),'inbound':inb,'links':{k:sorted(v) for k,v in links.items()}}, open('graph.json','w'), ensure_ascii=False, indent=1)
