#!/usr/bin/env python3
"""Сверка авторского кода (T123/T131) двух экспортов: какие тела блоков появились/исчезли.
Запуск: python3 -I scripts/audit/new_custom_code.py <старый-экспорт> <новый-экспорт>
Каждое новое тело печатается со страницами, id записи, размером и признаками (script/style/dialog/iframe/PF_CARDS/inline config)."""
import re, sys, glob, os, hashlib
def bodies(root):
    out = {}
    for f in sorted(glob.glob(os.path.join(root, 'page*.html'))):
        h = open(f, encoding='utf-8', errors='ignore').read()
        for m in re.finditer(r'<div id="rec(\d+)" class="r t-rec[^"]*"[^>]*data-record-type="131".*?<!-- nominify begin -->(.*?)<!-- nominify end -->', h, re.S):
            body = re.sub(r'\s+', ' ', m.group(2)).strip()
            key = hashlib.md5(body.encode()).hexdigest()[:10]
            out.setdefault(key, {'size': len(body), 'pages': [], 'body': body})['pages'].append((os.path.basename(f), m.group(1)))
    return out
old, new = bodies(sys.argv[1]), bodies(sys.argv[2])
added = {k: v for k, v in new.items() if k not in old}; gone = {k: v for k, v in old.items() if k not in new}
def flags(b): return ','.join(n for n, p in (('script', '<script'), ('style', '<style'), ('dialog', '<dialog'), ('iframe', '<iframe'), ('PF_CARDS', 'PF_CARDS'), ('inline-config', '__PF_INLINE_CONFIG__'), ('jquery', '$(')) if p in b)
print(f'уникальных тел T131: было {len(old)}, стало {len(new)}; новых {len(added)}, исчезло {len(gone)}')
for title, d in (('НОВЫЕ', added), ('ИСЧЕЗЛИ', gone)):
    print('==', title)
    for k, v in sorted(d.items(), key=lambda kv: kv[1]['pages'][0]):
        print(f"  {k} {v['size']:>6} Б  [{flags(v['body'])}]  {len(v['pages'])} стр.: " + ', '.join(f'{p}#rec{r}' for p, r in v['pages'][:4]) + f"\n      {v['body'][:140]}")
