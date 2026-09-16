#!/usr/bin/env python3
"""Спецификация Zero Block (T396) страницы: артборд + элементы с геометрией на брейкпоинтах и типографикой.
Запуск из корня: python3 scripts/audit/zero_spec.py page36594700.html [recId ...] [--json out.json]
Печатает Markdown-подобную спеку для ручной вёрстки.
"""
import re, sys, os, json, html as H
ROOT = 'old-site'
SCREENS = ['1200', '960', '640', '480', '320']

def parse_style_rules(style_css, rec):
    """#recNNN .tn-elem[data-elem-id="X"]{...} и @media → {(elem_id, screen): {prop: val}}"""
    rules = {}
    # split media blocks
    pos = 0
    out = []
    for m in re.finditer(r'@media screen and \(max-width:(\d+)px\)\s*\{', style_css):
        out.append(('1200', style_css[pos:m.start()]))
        depth = 1; i = m.end()
        while depth and i < len(style_css):
            if style_css[i] == '{': depth += 1
            elif style_css[i] == '}': depth -= 1
            i += 1
        scr = {'1199': '960', '959': '640', '639': '480', '479': '320', '1599': '1200'}.get(m.group(1), m.group(1))
        out.append((scr, style_css[m.end():i-1]))
        pos = i
    out.append(('1200', style_css[pos:]))
    for scr, css in out:
        for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', css):
            sel, body = m.group(1).strip(), m.group(2)
            gm = re.search(r'data-group-id="(\d+)"\]', sel)
            if gm:
                gtail = sel.split(']')[-1].strip()
                key = ('G' + gm.group(1), scr, 'molecule' if 'molecule' in gtail else 'group')
                d = rules.setdefault(key, {})
                for prop in body.split(';'):
                    if ':' in prop:
                        k, v = prop.split(':', 1); d[k.strip()] = v.strip()
                continue
            em = re.search(r'data-elem-id="(\d+)"\]', sel)
            tail = sel.split(']')[-1].strip() if em else ''
            if em:
                if tail == '': kind = 'elem'
                elif tail == '.tn-atom': kind = 'atom'
                elif tail == '.tn-atom:hover': kind = 'hover'
                elif 'tn-atom__button-text' in tail or 'tn-atom__button-content' in tail: kind = 'btntext'
                elif tail == '.tn-atom .tn-atom__button-icon' or tail == '.tn-atom__button-icon': kind = 'icon'
                else: kind = 'other:' + tail
            else:
                kind = 'elem'
            key = (em.group(1) if em else ('ARTBOARD' if 't396__artboard' in sel else None), scr, kind)
            if key[0] is None: continue
            d = rules.setdefault(key, {})
            for prop in body.split(';'):
                if ':' in prop:
                    k, v = prop.split(':', 1); d[k.strip()] = v.strip()
    return rules

def elem_spec(el_html, rules):
    m = re.search(r'data-elem-id=[\'"](\d+)[\'"]', el_html); eid = m.group(1)
    etype = re.search(r'data-elem-type=[\'"](\w+)[\'"]', el_html); etype = etype.group(1) if etype else '?'
    cls_raw = re.search(r"<div class='t396__elem tn-elem([^']*)'", el_html)
    is_flex = bool(cls_raw and 't396__elem-flex' in cls_raw.group(1))
    cls = re.sub(r'\s*(t396__elem-flex|tn-elem__\d+)\s*', ' ', cls_raw.group(1)).strip() if cls_raw else ''
    fields = dict(re.findall(r'data-field-([\w-]+)-value=[\'"]([^\'"]*)[\'"]', el_html))
    atom = re.search(r"<(?:div|a|img|iframe)[^>]*class=['\"][^'\"]*tn-atom[^'\"]*['\"][^>]*>(.*)", el_html, re.S)
    text = ''; html_inner = ''
    if etype in ('text', 'button'):
        inner = re.search(r"class=['\"]tn-atom(?:__button-text)?(?:\s[^'\"]*)?['\"][^>]*>(.*?)</(?:div|span|a)>", el_html, re.S)
        if inner:
            t = inner.group(1)
            html_inner = re.sub(r'\s+', ' ', t).strip()
            t = re.sub(r'<br\s*/?>', '⏎', t); t = re.sub(r'<[^>]+>', '', t)
            text = H.unescape(re.sub(r'[ \t\r\n]+', ' ', t)).strip()
    href = re.search(r"<a[^>]*class=['\"]tn-atom(?:\s[^'\"]*)?['\"][^>]*href=[\"']([^\"']*)[\"']", el_html) or re.search(r"href=[\"']([^\"']*)[\"'][^>]*class=['\"]tn-atom(?:\s[^'\"]*)?['\"]", el_html)
    href = href.group(1) if href else ''
    img = re.search(r"data-original=[\"']([^\"']*)[\"']", el_html) or re.search(r"<img[^>]*src=[\"']([^\"']*)[\"']", el_html)
    img = img.group(1) if img else ''
    bg = re.search(r"background-image:\s*url\(['\"]?([^'\")]+)", el_html); bg = bg.group(1) if bg else ''
    anim = dict(re.findall(r'data-animate-([\w-]+)=[\'"]([^\'"]*)[\'"]', el_html))
    inline = re.search(r"class=['\"]tn-atom(?:\s[^'\"]*)?['\"][^>]*style=[\"']([^\"']*)[\"']", el_html)
    inline = inline.group(1) if inline else ''
    geo = {}
    for scr in SCREENS:
        r = rules.get((eid, scr, 'elem'), {}); a = rules.get((eid, scr, 'atom'), {}); hv = rules.get((eid, scr, 'hover'), {})
        g = {k: r[k] for k in ('top', 'left', 'width', 'height', 'z-index', 'opacity') if k in r}
        for k in ('font-size', 'line-height', 'font-weight', 'font-family', 'color', 'text-align', 'letter-spacing', 'background-color', 'border-radius', 'opacity', 'transform', 'background-image', 'border-color', 'border-width', 'text-transform', 'box-shadow', 'background-position', 'background-size', 'object-fit', 'white-space', 'padding', 'display', 'justify-content', 'align-items'):
            if k in a: g[k] = a[k]
        for k, v in a.items():
            if k.startswith('--t396-'): g[k.replace('--t396-', '$')] = v
        ic = rules.get((eid, scr, 'icon'), {})
        if ic:
            g['icon'] = ' '.join(f'{k}:{v}' for k, v in ic.items() if k in ('width', 'height', 'order', '--icon', 'margin-right', 'margin-left'))
        bt = rules.get((eid, scr, 'btntext'), {})
        if bt.get('color'): g['btn-color'] = bt['color']
        if bt.get('padding'): g['btn-pad'] = bt['padding']
        if bt.get('column-gap'): g['btn-gap'] = bt['column-gap']
        for k in ('flex-shrink', 'flex-grow', 'align-self', 'order', 'margin', 'min-width', 'max-width'):
            if k in r and r[k] != '': g[k] = r[k]
        if hv: g['hover'] = '{' + ' '.join(f'{k}:{v}' for k, v in hv.items()) + '}'
        if g: geo[scr] = g
    return dict(id=eid, type=etype, cls=cls, flex=is_flex, text=text, html=html_inner, href=href, img=img or bg, geo=geo, anim=anim, inline=inline, fields={k: v for k, v in fields.items() if k in ('container', 'widthmode', 'heightmode', 'textfit', 'container-res-320', 'container-res-480', 'container-res-640', 'container-res-960', 'imgwidthmode', 'lockaspectratio', 'filewidth', 'fileheight', 'zoomable', 'imgpopup', 'bgcolor', 'hoverbgcolor', 'hovercolor', 'bordercolor', 'borderwidth', 'hoverbordercolor', 'buttonicon', 'buttoniconpos', 'axisx', 'axisy', 'axisx-res-320', 'axisy-res-320', 'fixed', 'sbs-anim', 'animation', 'containermode')})

def block_spec(rec_html):
    rid = re.match(r'<div id="(rec\d+)"', rec_html).group(1)
    tag = rec_html[:rec_html.find('>')]
    vis = ' '.join(re.findall(r'(data-screen-(?:min|max)="[^"]*")', tag))
    style = ''.join(re.findall(r'<style>(.*?)</style>', rec_html, re.S))
    rules = parse_style_rules(style, rid)
    art = re.search(r'<div class="t396__artboard[^>]*>', rec_html)
    artattrs = dict(re.findall(r'data-artboard-([\w-]+)="([^"]*)"', art.group(0))) if art else {}
    artcss = {scr: rules.get(('ARTBOARD', scr, 'elem'), {}) for scr in SCREENS}
    els = re.split(r"(?=<div class='t396__elem tn-elem)", rec_html)[1:]
    specs = [elem_spec(e, rules) for e in els]
    # группы (tn-group / molecule): дерево вложенности обходом тегов, стили контейнера и молекулы
    groups = []
    tree = []
    stack = []  # [(node, depth)] — node: dict(kind='group', children=[])
    depth = 0
    for tm in re.finditer(r"<div\b[^>]*>|</div>", rec_html):
        tag = tm.group(0)
        if tag == '</div>':
            depth -= 1
            while stack and stack[-1][1] >= depth: stack.pop()
            continue
        depth += 1
        gm = re.search(r'class="t396__group tn-group ([^"]*)"[^>]*data-group-id="(\d+)"', tag)
        if gm:
            gid = gm.group(2); cl = gm.group(1)
            attrs = dict(re.findall(r'data-group-([\w-]+)="([^"]*)"', tag))
            geo = {}
            for scr in SCREENS:
                g = rules.get(('G' + gid, scr, 'group'), {}); mol = rules.get(('G' + gid, scr, 'molecule'), {})
                d = {k: g[k] for k in ('top', 'left', 'width', 'height', 'z-index', 'flex-shrink', 'flex-grow', 'align-self', 'order', 'margin', 'min-width', 'max-width') if k in g and g[k] != ''}
                for k, v in mol.items():
                    if k in ('display', 'flex-direction', 'row-gap', 'column-gap', 'gap', 'align-items', 'justify-content', 'padding', 'background-color', 'border-radius', 'box-shadow', 'flex-wrap', 'background-image', 'border-width', 'border-color', 'border-style', 'opacity', 'width', 'height', 'align-content'):
                        d['mol.' + k] = v
                if d: geo[scr] = d
            node = dict(kind='group', id=gid, cls=' '.join(c for c in cl.split() if not c.startswith('tn-group__') and c not in ('t396__group-flex', 't-animate', 't396__elem-flex')),
                        flex='t396__elem-flex' in cl, molFlex='t396__group-flex' in cl, attrs={k: v for k, v in attrs.items() if k in ('flex', 'flexdirection', 'flexalignitems', 'padding', 'widthmode', 'heightmode', 'type-value')}, geo=geo, children=[])
            groups.append(dict(id=gid, cls=node['cls'], flex=node['flex'], molFlex=node['molFlex'], attrs=node['attrs'], geo=geo))
            (stack[-1][0]['children'] if stack else tree).append(node)
            stack.append((node, depth))
            continue
        em = re.search(r"class='t396__elem tn-elem[^']*'[^>]*data-elem-id='(\d+)'", tag)
        if em:
            (stack[-1][0]['children'] if stack else tree).append(dict(kind='elem', id=em.group(1)))
    # sort by top at 1200 then left
    def key(s):
        g = s['geo'].get('1200', {})
        def num(v):
            try: return float(re.sub(r'[^\d.-]', '', v))
            except: return 9999
        return (num(g.get('top', '9999')), num(g.get('left', '9999')))
    specs.sort(key=key)
    return dict(rec=rid, vis=vis, artboard=artattrs, artcss=artcss, elems=specs, groups=groups, tree=tree)

def fmt(spec):
    L = [f"## {spec['rec']}  {('VISIBILITY: ' + spec['vis'] + '  ') if spec.get('vis') else ''}artboard: " + ', '.join(f'{k}={v}' for k, v in spec['artboard'].items() if k not in ('recid',))]
    for scr in SCREENS:
        c = spec['artcss'].get(scr)
        if c: L.append(f"   artboard@{scr}: " + ' '.join(f'{k}:{v}' for k, v in c.items()))
    for g in spec.get('groups', []):
        L.append(f"- [GROUP] #{g['id']}" + (f" cls={g['cls']}" if g['cls'] else '') + f"  members={','.join(g['members'])}")
        for scr in SCREENS:
            d = g['geo'].get(scr)
            if d: L.append(f"    @{scr}: " + ' '.join(f'{k}:{v}' for k, v in d.items()))
    for e in spec['elems']:
        head = f"- [{e['type']}] #{e['id']}"
        if e['cls']: head += f" cls={e['cls']}"
        if e['text']: head += f"  «{e['text'][:200]}»"
        if e['href']: head += f"  → {e['href']}"
        if e['img']: head += f"  img={os.path.basename(e['img'])}"
        L.append(head)
        for scr in SCREENS:
            g = e['geo'].get(scr)
            if g: L.append(f"    @{scr}: " + ' '.join(f'{k}:{v}' for k, v in g.items()))
        if e['fields']: L.append('    fields: ' + ' '.join(f'{k}={v}' for k, v in e['fields'].items()))
        if e['anim']: L.append('    anim: ' + ' '.join(f'{k}={v}' for k, v in e['anim'].items()))
        if e['inline']: L.append('    inline: ' + e['inline'])
        if e['html'] and re.search(r'<(?!br)', e['html']): L.append('    html: ' + e['html'][:600])
    return '\n'.join(L)

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    f = args[0]; want = set(args[1:])
    html = open(os.path.join(ROOT, f), encoding='utf-8', errors='ignore').read()
    recs = re.split(r'(?=<div id="rec\d+" class="r t-rec)', html)
    out = []
    for r in recs:
        m = re.match(r'<div id="(rec\d+)"[^>]*data-record-type="396"', r)
        if not m: continue
        if want and m.group(1) not in want and m.group(1)[3:] not in want: continue
        out.append(block_spec(r))
    if '--json' in sys.argv:
        json.dump(out, open(sys.argv[sys.argv.index('--json') + 1], 'w'), ensure_ascii=False, indent=1)
    else:
        print('\n\n'.join(fmt(s) for s in out))
