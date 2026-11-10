#!/usr/bin/env python3
"""Все кнопки «Попробовать бесплатно» и «Бесплатно» ведут в ЛК. Запуск: python3 -I scripts/verify-free-trial.py <папка public | https://адрес>"""
import os, re, sys, urllib.request
src = sys.argv[1].rstrip('/')
PAT = re.compile(r'<a\b([^>]*)>\s*<span class="pfh-t">(Попробовать бесплатно|Бесплатно)</span>')
bad = total = 0
for route in ('', 'close', 'open'):
    if src.startswith('http'):
        html = urllib.request.urlopen(urllib.request.Request(f'{src}/{route}', headers={'User-Agent': 'check'}), timeout=30).read().decode('utf8')
    else:
        html = open(os.path.join(src, route, 'index.html'), encoding='utf8').read()
    found = PAT.findall(html)
    for attrs, text in found:
        total += 1
        href = re.search(r'href="([^"]*)"', attrs).group(1)
        if not href.startswith('https://lk.popovichfit.ru'):
            bad += 1
            print('ОШИБКА', '/' + route, text, href)
    print('/' + route, 'кнопок', len(found))
print(f'всего {total}, не в ЛК {bad}')
sys.exit(1 if bad or not total else 0)
