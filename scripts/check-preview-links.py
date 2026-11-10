#!/usr/bin/env python3
"""Все внутренние ссылки и файлы статического превью ведут на существующие адреса. Запускать ПЕРЕД публикацией.
python3 -I scripts/check-preview-links.py <папка OUTPUT> [--base /popovichfit-preview/]   Код выхода 1, если есть битые."""
import html, os, posixpath, re, sys, urllib.parse
root = sys.argv[1]
base = sys.argv[sys.argv.index('--base') + 1] if '--base' in sys.argv else '/popovichfit-preview/'
attr = re.compile(r'''(?:href|src|poster|data-src|data-original)=["']([^"']+)["']''')
def exists(path):
    rel = (path + '/')[len(base):] if (path + '/').startswith(base) else None
    if rel is None: return False
    rel = urllib.parse.unquote(rel).strip('/')
    target = os.path.join(root, rel)
    return os.path.isfile(target) or os.path.isfile(os.path.join(target, 'index.html'))
pages, bad = 0, {}
for folder, _, names in os.walk(root):
    if '.git' in folder or 'index.html' not in names: continue
    pages += 1
    here = '/' + os.path.relpath(folder, root).replace('.', '', 1 if os.path.relpath(folder, root) == '.' else 0).strip('/')
    page = base + os.path.relpath(folder, root).strip('.').strip('/') + '/'
    page = page.replace('//', '/')
    text = open(os.path.join(folder, 'index.html'), encoding='utf-8', errors='replace').read()
    for raw in attr.findall(text):
        value = html.unescape(raw).split('#')[0].split('?')[0]
        if not value or re.match(r'[a-z]+:|//', value, re.I): continue
        path = posixpath.normpath(urllib.parse.urljoin(page, value))
        if not exists(path): bad.setdefault(path, set()).add(page)
print(f'страниц {pages}, битых адресов {len(bad)}')
for path, sources in sorted(bad.items(), key=lambda kv: -len(kv[1]))[:80]: print(' 404', path, '<-', len(sources), sorted(sources)[:3])
sys.exit(1 if bad else 0)
