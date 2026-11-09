#!/usr/bin/env python3
"""Разбор блоков T131 нового экспорта Тильды (шапка, подвал, главная, /open, /close) в файлы сайта.
Запуск: python3 -I convert-from-export.py <папка-с-блоками> (блоки: page<ID>_rec<ID>.html, вырезаны из экспорта).
Пишет app/components/home/html/*.html и app/assets/css/pfh.css. Ассеты jsDelivr -> /home/, шрифты Involve/Manrope
переименованы в PfhInvolve/PfhManrope (иначе перебьют шрифты старых страниц)."""
import re, sys, pathlib
B = pathlib.Path(sys.argv[1])
ROOT = pathlib.Path(__file__).resolve().parents[3]
OUT_H = ROOT / 'app/components/home/html'
CDN = 'https://cdn.jsdelivr.net/gh/ElenaSamanchuk/popovichfit-home-tilda@2415be4/assets/'

def blk(page, rec):
    return (B / f'{page}_{rec[3:]}.html').read_text(encoding='utf-8')

def inner(h):
    a = h.index('<!-- nominify begin -->') + len('<!-- nominify begin -->')
    b = h.rindex('<!-- nominify end -->')
    return h[a:b].strip()

def local(s):
    return s.replace(CDN, '/home/')

def fonts(css):
    css = css.replace('font-family:Involve', 'font-family:PfhInvolve').replace('font-family:Manrope', 'font-family:PfhManrope')
    css = css.replace('--font:"Manrope"', '--font:"PfhManrope"').replace('--display:"Involve","Manrope"', '--display:"PfhInvolve","PfhManrope"')
    return css

def split_style(s):
    m = re.match(r'\s*<style>(.*?)</style>(.*)$', s, re.S)
    return m.group(1), m.group(2).strip()

def unwrap(s, cls):
    """<div class="pfh X">…</div> (+ необязательный <script>) -> внутренность div"""
    s = re.sub(r'<script>.*?</script>\s*$', '', s, flags=re.S).strip()
    m = re.match(r'<div class="%s"[^>]*>(.*)</div>$' % re.escape(cls), s, re.S)
    assert m, cls
    return m.group(1)

# --- CSS: меню-стили + стили страницы + стили подвала (порядок как на Тильде)
menu_css, menu_rest = split_style(inner(blk('page36594700', 'rec5440834801')))
page_css = re.search(r'<style>(.*?)</style>', inner(blk('page36594700', 'rec5440835801')), re.S).group(1)
foot_css, foot_rest = split_style(inner(blk('page36594700', 'rec5440851001')))
css = fonts(local('\n'.join([menu_css, page_css, foot_css])))
(ROOT / 'app/assets/css/pfh.css').write_text('/* Дизайн новой главной/шапки/подвала POPOVICHFIT (T131 Тильды). Все селекторы под .pfh. Сгенерировано docs/screens/2026-11-09-new-home/convert-from-export.py */\n' + css + '\n', encoding='utf-8')

def write(name, text):
    (OUT_H / name).write_text(text.strip() + '\n', encoding='utf-8')

# --- шапка/подвал: общие (продажи закрыты) и /open
write('header.html', local(unwrap(menu_rest, 'pfh pfh-hdr')))
write('footer.html', local(unwrap(foot_rest, 'pfh pfh-foot')))
oh = split_style(inner(blk('page346949309', 'rec5311154101')))[1]
of = split_style(inner(blk('page346949309', 'rec5311154501')))[1]
write('header-open.html', local(unwrap(oh, 'pfh pfh-hdr')))
write('footer-open.html', local(unwrap(of, 'pfh pfh-foot')))
# --- содержимое страниц
write('home.html', local(unwrap(inner(blk('page36594700', 'rec5440837501')), 'pfh')))
write('close.html', local(unwrap(inner(blk('page345934909', 'rec5298870301')), 'pfh')))
write('open.html', local(unwrap(inner(blk('page346949309', 'rec5311154301')), 'pfh')))

# --- /pred: копия от 06.11 (popovichfit-home-tilda/work/2026-11-06-all-published-final/pred-desktop.html), очищенная от следов runtime
PRED = pathlib.Path('/Users/elena/Projects/popovichfit-home-tilda/work/2026-11-06-all-published-final/pred-desktop.html')
if PRED.exists():
    h = PRED.read_text(encoding='utf-8')
    m = re.search(r'<div id="rec5325187701".*?(?=<div id="rec5325193901")', h, re.S)
    blkp = m.group(0)
    body = unwrap(inner(blkp), 'pfh')
    body = re.sub(r' data-watch="[a-z]*"', '', body)       # ставит скрипт наблюдения за панелью
    body = body.replace('hidden=""', 'hidden')              # сериализация DOM
    body = re.sub(r'<(path|use)\b([^>]*)></\1>', r'<\1\2/>', body)
    body = body.replace('Подходит при&nbsp;беременности', 'Можно в беременность').replace('Подходит при беременности', 'Можно в беременность')  # как на текущей главной
    write('pred.html', local(body))
print('ok')
