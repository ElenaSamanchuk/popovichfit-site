#!/usr/bin/env python3
"""Оформление форм Zero Block из экспорта Тильды (data-field-input*/button*) -> app/assets/css/zero-forms.css.
Запуск из корня проекта: python3 -I scripts/audit/build_form_css.py"""
import glob, json, os, re

RES = [('960', '1199.98px'), ('640', '959.98px'), ('480', '639.98px'), ('320', '479.98px')]
KEYS = 'inputfontfamily inputfontsize inputfontweight inputcolor inputbgcolor inputbordercolor inputbordersize inputradius inputheight inputmargbottom buttoncolor buttonbgcolor buttonbordersize buttonbordercolor buttonradius buttonwidth buttonheight buttonfontfamily buttonfontsize buttonfontweight buttonalign buttonmargtop'.split()
FONT = {'Manrope': "'Manrope','PfhManrope',sans-serif", 'Involve': "'Involve','PfhInvolve',sans-serif"}


def u(v):
    return f"calc({v} * var(--u, 1px))"


def fam(v):
    return FONT.get(v, f"'{v}',sans-serif")


def css(v):
    # кнопка нулевого размера в экспорте: у формы своя кнопка поверх, размеры по умолчанию оставляем кликабельными
    for k in ('buttonwidth', 'buttonheight'):
        if v.get(k) and float(v[k]) < 20: v[k] = None
    i, b = [], []
    if v.get('inputfontfamily'): i.append(f"font-family:{fam(v['inputfontfamily'])}")
    if v.get('inputfontsize'): i.append(f"font-size:{u(v['inputfontsize'])}")
    if v.get('inputfontweight'): i.append(f"font-weight:{v['inputfontweight']}")
    if v.get('inputcolor'): i.append(f"color:{v['inputcolor']}")
    if v.get('inputbgcolor'): i.append(f"background:{v['inputbgcolor']}")
    if v.get('inputbordersize') is not None and v.get('inputbordersize') != '': i.append(f"border-width:{u(v['inputbordersize'])}")
    if v.get('inputbordercolor'): i.append(f"border-color:{v['inputbordercolor']}")
    if v.get('inputradius'): i.append(f"border-radius:{u(v['inputradius'])}")
    if v.get('inputheight'): i.append(f"height:{u(v['inputheight'])}")
    if v.get('buttoncolor'): b.append(f"color:{v['buttoncolor']}")
    if v.get('buttonbgcolor'): b.append(f"background:{v['buttonbgcolor']}")
    if v.get('buttonbordersize'): b.append(f"border:{v['buttonbordersize']}px solid {v.get('buttonbordercolor') or 'transparent'}")
    if v.get('buttonradius'): b.append(f"border-radius:{u(v['buttonradius'])}")
    if v.get('buttonwidth'): b.append(f"width:{u(v['buttonwidth'])};max-width:100%;padding:0 {u(15)}")
    if v.get('buttonheight'): b.append(f"height:{u(v['buttonheight'])}")
    if v.get('buttonfontfamily'): b.append(f"font-family:{fam(v['buttonfontfamily'])}")
    if v.get('buttonfontsize'): b.append(f"font-size:{u(v['buttonfontsize'])}")
    if v.get('buttonfontweight'): b.append(f"font-weight:{v['buttonfontweight']}")
    if v.get('buttonalign'): b.append('align-self:' + {'center': 'center', 'right': 'flex-end', 'left': 'flex-start'}.get(v['buttonalign'], 'flex-start'))
    elif v.get('buttonwidth'): b.append('align-self:flex-start')
    if v.get('buttonmargtop'): b.append(f"margin-top:{u(v['buttonmargtop'])}")
    return i, b


def rules(eid, v):
    i, b = css(v)
    out = []
    if i: out.append(f".e{eid} .tz-form__input{{{';'.join(i)}}}")
    if b: out.append(f".e{eid} button[type=submit]{{{';'.join(b)};text-transform:none}}")
    if v.get('inputmargbottom'): out.append(f".e{eid} .tz-form{{gap:{u(v['inputmargbottom'])}}}")
    return out


parts = ['/* Сгенерировано scripts/audit/build_form_css.py из экспорта Тильды, руками не править */']
for f in sorted(glob.glob('app/data/tilda/page*.json')):
    data = json.load(open(f, encoding='utf8'))
    html = open('old-site/' + os.path.basename(f).replace('.json', '.html'), encoding='utf8').read()
    for block in data['blocks']:
        for e in block.get('elems') or []:
            if e.get('type') != 'form':
                continue
            at = html.index(f"data-elem-id='{e['id']}'")
            end = html.find("data-elem-id='", at + 20)
            chunk = html[at:end if end > 0 else None]
            get = lambda k: (re.search(rf'data-field-{k}-value="([^"]*)"', chunk) or [0, None])[1]
            parts += rules(e['id'], {k: get(k) for k in KEYS})
            for scr, mw in RES:
                res = {k: get(f'{k}-res-{scr}') for k in KEYS}
                res = {k: v for k, v in res.items() if v}
                r = rules(e['id'], res)
                if r: parts.append(f"@media (max-width:{mw}){{{''.join(r)}}}")
            size = get('inputfontsize')
            # Safari на телефоне увеличивает страницу при фокусе на поле мельче 16 px
            if size: parts.append(f"@media (max-width:959.98px){{.e{e['id']} .tz-form__input{{font-size:max(16px,{u(size)})}}}}")
open('app/assets/css/zero-forms.css', 'w', encoding='utf8').write('\n'.join(parts) + '\n')
print(len(parts) - 1, 'правил')
