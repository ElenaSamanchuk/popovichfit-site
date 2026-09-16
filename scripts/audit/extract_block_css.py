#!/usr/bin/env python3
"""Вытаскивает из CSS экспорта правила для классов типовых блоков Тильды, которые реально используются
в HTML не-Zero блоков (app/data/tilda/*.json: t004, t017, t585, t395, t663, t-container, t-col, t-text…),
без #recNNN-правил (они лежат в JSON у блока). Результат: app/assets/css/tilda-blocks-export.css.
Это статический CSS-слой для стандартных блоков; runtime Тильды не используется."""
import re, os, glob, json
classes = set()
for f in glob.glob('app/data/tilda/*.json'):
    d = json.load(open(f))
    for b in d['blocks']:
        if b['type'] == '396' or not b.get('html'): continue
        for m in re.finditer(r'class="([^"]+)"', b['html']):
            for c in m.group(1).split():
                if c.startswith('t') and not c.startswith('tn-'): classes.add(c)
print('классов:', len(classes))
# источники: tilda-grid + все tilda-blocks-page*.css (правила дедуплицируем)
srcs = ['old-site/css/tilda-grid-3.0.min.css'] + sorted(glob.glob('old-site/css/tilda-blocks-page*.min.css'))
seen = set(); out = []
def want(sel):
    if '#rec' in sel or '#allrecords' in sel: return False
    return any(re.search(r'\.' + re.escape(c) + r'(?![\w-])', sel) for c in classes)
for src in srcs:
    css = open(src, encoding='utf-8').read()
    # разбор верхнего уровня с @media
    pos = 0
    def emit(block, media):
        for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', block):
            sel, body = m.group(1).strip(), m.group(2).strip()
            if not want(sel): continue
            key = (media, sel, body)
            if key in seen: continue
            seen.add(key)
            out.append((media, f'{sel}{{{body}}}'))
    for m in re.finditer(r'@media([^{]*)\{', css):
        emit(css[pos:m.start()], '')
        depth = 1; i = m.end()
        while depth and i < len(css):
            if css[i] == '{': depth += 1
            elif css[i] == '}': depth -= 1
            i += 1
        emit(css[m.end():i - 1], '@media ' + m.group(1).strip())
        pos = i
    emit(css[pos:], '')
# группируем по media в порядке появления
from collections import OrderedDict
groups = OrderedDict()
for media, rule in out: groups.setdefault(media, []).append(rule)
with open('app/assets/css/tilda-blocks-export.css', 'w') as o:
    o.write('/* Правила стандартных блоков Тильды, извлечённые из CSS экспорта для классов, которые используются\n   в типовых блоках сайта (scripts/audit/extract_block_css.py). Runtime Тильды не нужен. */\n')
    for media, rules in groups.items():
        if media: o.write(media + '{' + ''.join(rules) + '}\n')
        else: o.write(''.join(rules) + '\n')
print('правил:', len(out), '→ app/assets/css/tilda-blocks-export.css', os.path.getsize('app/assets/css/tilda-blocks-export.css') // 1024, 'KB')
