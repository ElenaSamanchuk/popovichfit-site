#!/usr/bin/env python3
"""Проверка без браузера: на адресе развёрнут весь сайт popovichfit и он настроен.

python3 -I scripts/verify-server.py https://preview.popovichfit.ru --report out.json [--rate 3] [--assets 200] [--no-neighbors]

Только GET/HEAD, один поток, не больше --rate запросов в секунду (по умолчанию 2.5), внешние домены не обходятся
(кроме 4 соседних проектов: только GET главной). Эталон маршрутов — app/data/pages.ts, app/data/sales.ts, nuxt.config.ts.
Код выхода: 0 — ошибок нет, 1 — есть ошибки, 2 — неверный запуск."""
import html as htmllib, json, os, re, sys, time, urllib.error, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEIGHBORS = ['https://kochfit.ru/', 'https://preview.medvediva.ru/', 'https://preview.kineziofitness.online/',
             'https://preview.sistemayasnosti.com/']
UA = 'popovichfit-verify-server/1.0 (read-only GET/HEAD check)'
ASSET_RE = re.compile(r'\.(js|mjs|css|png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|otf|eot|mp4|webm|json|map)$|^/(_nuxt|img|fonts|home|tariffs)/', re.I)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


OPENER = urllib.request.build_opener(NoRedirect)
_last = [0.0]
MIN_GAP = [0.4]
STATS = {'requests': 0}


def raw(url, method='GET', timeout=25):
    """Один запрос без следования редиректам. -> dict(status, headers, body(bytes), ms, error)"""
    wait = MIN_GAP[0] - (time.time() - _last[0])
    if wait > 0:
        time.sleep(wait)
    _last[0] = time.time()
    STATS['requests'] += 1
    req = urllib.request.Request(url, method=method, headers={'User-Agent': UA, 'Accept': '*/*', 'Accept-Encoding': 'identity'})
    t0 = time.time()
    try:
        r = OPENER.open(req, timeout=timeout)
        body = r.read() if method == 'GET' else b''
        return {'status': r.status, 'headers': {k.lower(): v for k, v in r.headers.items()}, 'body': body, 'ms': int((time.time() - t0) * 1000), 'error': None}
    except urllib.error.HTTPError as e:
        try:
            body = e.read() if method == 'GET' else b''
        except Exception:
            body = b''
        return {'status': e.code, 'headers': {k.lower(): v for k, v in e.headers.items()}, 'body': body, 'ms': int((time.time() - t0) * 1000), 'error': None}
    except Exception as e:  # сеть, таймаут, TLS
        return {'status': 0, 'headers': {}, 'body': b'', 'ms': int((time.time() - t0) * 1000), 'error': f'{type(e).__name__}: {e}'[:200]}


def fetch(url, method='GET', host=None, max_hops=6):
    """С ручным следованием редиректам только внутри того же хоста. -> результат последнего ответа + цепочка."""
    chain = []
    cur = url
    for _ in range(max_hops):
        r = raw(cur, method)
        if r['status'] in (301, 302, 303, 307, 308) and r['headers'].get('location'):
            nxt = urllib.parse.urljoin(cur, r['headers']['location'])
            chain.append({'from': cur, 'status': r['status'], 'to': nxt})
            if host and urllib.parse.urlsplit(nxt).netloc != host:
                r['final_url'] = nxt
                r['external_redirect'] = True
                r['chain'] = chain
                return r
            cur = nxt
            continue
        r['final_url'] = cur
        r['chain'] = chain
        return r
    r['final_url'] = cur
    r['chain'] = chain
    r['error'] = 'слишком много редиректов'
    return r


def text(r):
    b = r['body']
    for enc in ('utf-8', 'cp1251'):
        try:
            return b.decode(enc)
        except Exception:
            pass
    return b.decode('utf-8', 'replace')


def load_routes():
    src = open(os.path.join(ROOT, 'app/data/pages.ts'), encoding='utf-8').read()
    routes = []
    for m in re.finditer(r'"(page\d+\.html|404\.html)":\s*\{\s*url:\s*"([^"]*)"(.*)', src):
        rest = m.group(3)
        pub = re.search(r'published:\s*(true|false)', rest)
        tt = re.search(r'title:\s*"([^"]*)"', rest)
        routes.append({'file': m.group(1), 'url': m.group(2), 'published': (pub.group(1) != 'false') if pub else True, 'code_title': tt.group(1) if tt else None})
    sales = open(os.path.join(ROOT, 'app/data/sales.ts'), encoding='utf-8').read()
    sales_open = bool(re.search(r'SALES_OPEN\s*=\s*true', sales))
    redirects = {}
    blk = re.search(r'SALES_REDIRECTS[^{]*\{(.*?)\}', sales, re.S)
    if blk:
        for k, v in re.findall(r"'([^']+)':\s*'([^']+)'", blk.group(1)):
            redirects[k] = v
    return routes, sales_open, redirects


def extract_title(h):
    m = re.search(r'<title[^>]*>(.*?)</title>', h, re.S | re.I)
    return htmllib.unescape(m.group(1)).strip() if m else ''


def looks_404(title, body):
    t = title.lower()
    if re.search(r'\b404\b|not found|не найден', t):
        return True
    return bool(re.search(r'page not found|страница не найдена', body[:200000], re.I)) and len(body) < 20000


def main():
    args = sys.argv[1:]
    if not args or args[0].startswith('-'):
        print(__doc__)
        sys.exit(2)
    base = args[0].rstrip('/')
    report_path = args[args.index('--report') + 1] if '--report' in args else None
    rate = float(args[args.index('--rate') + 1]) if '--rate' in args else 2.5
    max_assets = int(args[args.index('--assets') + 1]) if '--assets' in args else 200
    MIN_GAP[0] = 1.0 / min(rate, 3.0)
    host = urllib.parse.urlsplit(base).netloc
    started = time.time()
    routes, sales_open, sales_redirects = load_routes()
    try:
        dead = set(json.load(open(os.path.join(ROOT, 'scripts/known-dead-links.json'), encoding='utf-8'))['paths'])
    except Exception:
        dead = set()
    rep = {'base': base, 'started': time.strftime('%Y-%m-%d %H:%M:%S'), 'sales_open_in_code': sales_open,
           'expected_redirects_from_code': sales_redirects}
    errors, warnings = [], []

    # 1. маршруты
    todo = []
    for r in routes:
        todo.append({'path': r['url'], 'code_title': r['code_title'], 'source': r['file'], 'kind': '404-эталон' if r['file'] == '404.html' else ('скрытая' if not r['published'] else 'страница')})
    for p in ('/open', '/close', '/speakers'):
        todo.append({'path': p, 'source': 'app/pages', 'kind': 'страница'})
    if sales_open:
        for p in ('/sales-open', '/pred', '/predcor', '/predpow'):
            todo.append({'path': p, 'source': 'nuxt.config.ts', 'kind': 'страница'})
    else:
        for p in sales_redirects:
            todo.append({'path': p, 'source': 'sales.ts SALES_REDIRECTS', 'kind': 'редирект-по-задумке'})
    seen, uniq = set(), []
    for t in todo:
        if t['path'] in seen:
            continue
        seen.add(t['path'])
        uniq.append(t)
    results, htmls = [], {}
    print(f'Маршрутов: {len(uniq)}; база {base}; ≤{1.0 / MIN_GAP[0]:.1f} зап/с', flush=True)
    for i, t in enumerate(uniq, 1):
        url = base + urllib.parse.quote(t['path'], safe="/%:@!$&'()*+,;=-._~")
        r = fetch(url, 'GET', host)
        title = extract_title(text(r)) if r['status'] == 200 else ''
        first = r['chain'][0] if r['chain'] else None
        entry = {'path': t['path'], 'kind': t['kind'], 'source': t['source'], 'status': r['status'],
                 'first_status': first['status'] if first else r['status'], 'final_url': r['final_url'], 'title': title,
                 'ms': r['ms'], 'redirect_chain': [f"{c['status']} -> {c['to']}" for c in r['chain']], 'error': r['error'], 'problems': []}
        expected_target = sales_redirects.get(t['path']) if not sales_open else None
        is_members = t['path'].startswith('/members/')
        if t['kind'] == '404-эталон':
            entry['verdict'] = 'ok-404' if r['status'] == 404 else 'info'
            if r['status'] != 404:
                entry['problems'].append(f'ждали 404, получили {r["status"]}')
        elif r['error'] or r['status'] == 0:
            entry['verdict'] = 'error'
            entry['problems'].append(r['error'] or 'нет ответа')
        elif t['kind'] == 'скрытая':
            entry['verdict'] = 'hidden-' + ('404' if r['status'] == 404 else str(r['status']))
        elif is_members and r['chain'] and r['chain'][0]['status'] == 301 and 'lk.popovichfit.ru' in r['chain'][0]['to']:
            entry['verdict'] = 'redirect-expected'  # server/middleware/redirects.ts: /members/* -> ЛК
        elif r['chain'] and t['kind'] == 'редирект-по-задумке':
            ok_target = expected_target and urllib.parse.urlsplit(r['final_url']).path == expected_target
            entry['verdict'] = 'redirect-expected' if ok_target and r['status'] == 200 else 'error'
            if entry['verdict'] == 'error':
                entry['problems'].append(f'редирект не туда или цель не 200: {r["status"]} {r["final_url"]}')
        elif r['chain']:
            entry['verdict'] = 'redirect' if r['status'] == 200 else 'error'
            if r['status'] != 200:
                entry['problems'].append(f'после редиректа {r["status"]}')
        elif r['status'] == 200:
            entry['verdict'] = 'ok'
        else:
            entry['verdict'] = 'error'
            entry['problems'].append(f'код {r["status"]}')
        if entry['verdict'] in ('ok', 'redirect', 'redirect-expected') and r['status'] == 200 and not (is_members and r['chain']):
            if not title and not t.get('code_title'):
                entry['verdict'] = 'warn-empty-title-in-code'  # пусто и в pages.ts (экспорт Тильды) — не расхождение
                entry['problems'].append('пустой <title> (и в app/data/pages.ts пусто)')
            elif not title:
                entry['verdict'] = 'error'
                entry['problems'].append('пустой <title>')
            elif looks_404(title, text(r)):
                entry['verdict'] = 'error'
                entry['problems'].append('похоже на страницу 404 сайта: ' + title[:60])
            htmls[entry['final_url']] = text(r)
        results.append(entry)
        if entry['verdict'] == 'warn-empty-title-in-code':
            warnings.append({'path': t['path'], 'problem': entry['problems'][-1]})
        if t['kind'] == '404-эталон' and entry['problems']:
            warnings.append({'path': t['path'], 'problem': entry['problems'][0] + ' (в проекте /404.html должна отдавать страницу 404)'})
        if entry['verdict'] == 'error':
            errors.append({'where': 'маршрут', 'path': t['path'], 'problem': '; '.join(entry['problems'])})
        if i % 25 == 0:
            print(f'  {i}/{len(uniq)}', flush=True)
    rep['routes'] = results
    counts = {}
    for e in results:
        counts[e['verdict']] = counts.get(e['verdict'], 0) + 1
    rep['routes_summary'] = {'total': len(results), 'by_verdict': counts,
                             'http_200_direct': sum(1 for e in results if e['status'] == 200 and not e['redirect_chain']),
                             'redirect_then_200': sum(1 for e in results if e['status'] == 200 and e['redirect_chain']),
                             'redirect_unexpected': [e['path'] + ' -> ' + e['final_url'] for e in results if e['verdict'] == 'redirect']}

    # 2. ссылки
    link_re = re.compile(r'''(?:href|src|poster|data-src)\s*=\s*["']([^"']+)["']''', re.I)
    internal, assets = {}, {}
    for page_url, h in htmls.items():
        for raw_link in link_re.findall(h):
            v = htmllib.unescape(raw_link).strip()
            if not v or v.startswith(('#', 'mailto:', 'tel:', 'javascript:', 'data:')):
                continue
            absu = urllib.parse.urljoin(page_url, v)
            sp = urllib.parse.urlsplit(absu)
            if sp.netloc != host or sp.scheme not in ('http', 'https'):
                continue
            clean = urllib.parse.urlunsplit((sp.scheme, sp.netloc, sp.path, sp.query, ''))
            target = assets if ASSET_RE.search(sp.path) else internal
            target.setdefault(clean, page_url)
    checked_paths = {urllib.parse.urlsplit(e['final_url']).path: e for e in results}
    route_urls = {base + t['path'] for t in uniq}
    link_results = []
    pending = [(u, s) for u, s in internal.items() if u not in route_urls]
    print(f'Внутренние ссылки: {len(internal)} уникальных, новых к проверке {len(pending)}', flush=True)
    for u, src in pending:
        r = fetch(u, 'GET', host)
        ext_redirect = bool(r.get('external_redirect')) and r['status'] in (301, 302, 307, 308)
        kd = urllib.parse.urlsplit(u).path in dead
        bad = r['status'] != 200 and not ext_redirect and not kd
        link_results.append({'url': u, 'found_on': src, 'status': r['status'], 'final_url': r['final_url'], 'redirect': bool(r['chain']), 'external_redirect': ext_redirect, 'known_dead': kd, 'ms': r['ms'], 'error': r['error']})
        if bad:
            errors.append({'where': 'ссылка', 'path': u, 'problem': f'код {r["status"]}{" " + r["error"] if r["error"] else ""}, найдена на {src}'})
    rep['links'] = {'unique_internal': len(internal), 'already_covered_by_routes': len(internal) - len(pending), 'checked': link_results,
                    'bad': [x for x in link_results if x['status'] != 200 and not x['external_redirect'] and not x['known_dead']],
                    'known_dead_in_project': [x['url'] for x in link_results if x['known_dead'] and x['status'] != 200],
                    'external_redirects': [x['url'] + ' -> ' + x['final_url'] for x in link_results if x['external_redirect']]}
    asset_list = list(assets.items())
    first_assets = asset_list[:max_assets]
    print(f'Файлы: {len(assets)} уникальных, проверяю первые {len(first_assets)} (HEAD)', flush=True)
    asset_results = []
    for u, src in first_assets:
        r = fetch(u, 'HEAD', host)
        if r['status'] in (405, 501):
            r = fetch(u, 'GET', host)
        asset_results.append({'url': u, 'found_on': src, 'status': r['status'], 'type': r['headers'].get('content-type', ''), 'ms': r['ms']})
        if r['status'] != 200:
            errors.append({'where': 'файл', 'path': u, 'problem': f'код {r["status"]}, найден на {src}'})
    rep['assets'] = {'unique': len(assets), 'checked': len(asset_results), 'bad': [x for x in asset_results if x['status'] != 200], 'sample': asset_results[:5]}

    # 3. настройки
    S = {}
    home = fetch(base + '/', 'GET', host)
    hh = text(home)
    S['home_status'] = home['status']
    S['home_headers'] = {k: home['headers'].get(k) for k in ('x-robots-tag', 'content-security-policy', 'content-security-policy-report-only', 'strict-transport-security', 'x-frame-options', 'x-content-type-options', 'referrer-policy', 'cache-control', 'server', 'last-modified', 'etag')}
    S['x_robots_tag'] = home['headers'].get('x-robots-tag')
    S['csp_header'] = home['headers'].get('content-security-policy') or home['headers'].get('content-security-policy-report-only')
    m = re.search(r'buildId["\']?\s*:\s*["\']([0-9a-f-]{8,})["\']', hh)
    S['buildId'] = m.group(1) if m else None
    S['nuxt_builds_latest'] = None
    bl = raw(base + '/_nuxt/builds/latest.json')
    if bl['status'] == 200:
        S['nuxt_builds_latest'] = bl['body'][:200].decode('utf-8', 'replace')
    S['meta_robots_home'] = re.findall(r'<meta[^>]+name=["\']robots["\'][^>]*>', hh, re.I)
    S['canonical_home'] = re.findall(r'<link[^>]+rel=["\']canonical["\'][^>]*>', hh, re.I)
    # canonical/robots на нескольких страницах
    sample = ['/', '/course_power', '/course_correction', '/open', '/close', '/speakers', '/gift', '/10day']
    sp = []
    for p in sample:
        u = base + p
        r = fetch(u, 'GET', host)
        h = text(r)
        sp.append({'path': p, 'status': r['status'], 'x_robots_tag': r['headers'].get('x-robots-tag'),
                   'meta_robots': re.findall(r'<meta[^>]+name=["\']robots["\'][^>]*content=["\']([^"\']*)', h, re.I),
                   'canonical': re.findall(r'<link[^>]+rel=["\']canonical["\'][^>]*href=["\']([^"\']*)', h, re.I),
                   'og_url': re.findall(r'<meta[^>]+property=["\']og:url["\'][^>]*content=["\']([^"\']*)', h, re.I)})
    S['sample_pages_seo'] = sp
    # robots.txt
    rb = fetch(base + '/robots.txt', 'GET', host)
    S['robots_txt'] = {'status': rb['status'], 'x_robots_tag': rb['headers'].get('x-robots-tag'), 'content': text(rb)[:800] if rb['status'] == 200 else None}
    # sitemap
    sm = fetch(base + '/sitemap.xml', 'GET', host)
    smt = text(sm)
    locs = re.findall(r'<loc>\s*([^<\s]+)\s*</loc>', smt)
    doms = {}
    for l in locs:
        d = urllib.parse.urlsplit(l).netloc
        doms[d] = doms.get(d, 0) + 1
    S['sitemap'] = {'status': sm['status'], 'content_type': sm['headers'].get('content-type'), 'urls': len(locs), 'domains': doms, 'first': locs[:3]}
    if sm['status'] == 200 and locs:
        in_map = {urllib.parse.urlsplit(l).path.rstrip('/') or '/' for l in locs}
        expected = {t['path'].rstrip('/') or '/' for t in uniq if t['kind'] == 'страница'}
        S['sitemap']['routes_missing_in_sitemap'] = sorted(expected - in_map)[:40]
    # скрипты: Метрика, VK, Sender — в HTML и в основных _nuxt-скриптах
    scripts = re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', hh, re.I) + re.findall(r'<link[^>]+rel=["\']modulepreload["\'][^>]*href=["\']([^"\']+)["\']', hh, re.I)
    scripts = [urllib.parse.urljoin(base + '/', s) for s in dict.fromkeys(scripts) if s.endswith('.js') and urllib.parse.urlsplit(urllib.parse.urljoin(base + '/', s)).netloc == host]
    probes = {'metrika_mc_yandex': 'mc.yandex.ru/metrika', 'metrika_id_88400923': '88400923', 'vk_openapi': 'vk.com/js/api/openapi.js', 'vk_pixel_VK-RTRG': 'VK-RTRG-1817271', 'sender_senndder': 'senndder.ru',
              'host_gate_popovichfit': "popovichfit.ru"}
    in_html = {k: (v in hh) for k, v in probes.items()}
    in_js = {k: [] for k in probes}
    for s in scripts[:25]:
        r = raw(s)
        if r['status'] == 200:
            body = r['body'].decode('utf-8', 'replace')
            for k, v in probes.items():
                if v in body:
                    in_js[k].append(s.rsplit('/', 1)[-1])
    S['scripts_scanned'] = min(len(scripts), 25)
    S['third_party_in_html'] = in_html
    S['third_party_in_js_files'] = in_js
    S['third_party_note'] = ('Метрика и VK подключаются плагином analytics.client.ts только если hostname = popovichfit.ru / www.popovichfit.ru; '
                             'на других доменах в браузере они не загружаются, в статическом HTML их быть не должно. Sender — head-скрипт SupportWidget на всех страницах.')
    rep['settings'] = S

    # 4. соседи
    nb = []
    if '--no-neighbors' not in args:
        for u in NEIGHBORS:
            r = raw(u, 'GET', 20)
            nb.append({'url': u, 'status': r['status'], 'ms': r['ms'], 'server': r['headers'].get('server'), 'location': r['headers'].get('location'), 'title': extract_title(text(r)) if r['status'] == 200 else '', 'error': r['error']})
    rep['neighbors'] = nb

    rep['requests_total'] = STATS['requests']
    rep['seconds'] = int(time.time() - started)
    rep['warnings'] = warnings
    rep['errors'] = errors
    rep['errors_count'] = len(errors)
    if report_path:
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(rep, f, ensure_ascii=False, indent=1)

    # консоль
    print('\n=== ИТОГ ===')
    print(f"Маршрутов: {rep['routes_summary']['total']} | прямых 200: {rep['routes_summary']['http_200_direct']} | через редирект до 200: {rep['routes_summary']['redirect_then_200']} | по вердиктам: {counts}")
    for e in results:
        if e['redirect_chain'] and e['verdict'] != 'ok':
            print(f"  редирект [{e['verdict']}] {e['path']}: {' | '.join(e['redirect_chain'])}")
    print(f"Ссылок внутренних: {len(internal)}, битых: {len(rep['links']['bad'])}; файлов: {len(assets)}, проверено {len(asset_results)}, битых {len(rep['assets']['bad'])}")
    print(f"buildId: {S['buildId']} | X-Robots-Tag: {S['x_robots_tag']} | CSP: {'есть' if S['csp_header'] else 'нет'} | sitemap: {S['sitemap']['status']}, {S['sitemap']['urls']} url, домены {S['sitemap']['domains']} | robots.txt: {S['robots_txt']['status']}")
    print(f"В HTML: {in_html}")
    print(f"В JS-файлах: { {k: len(v) for k, v in in_js.items()} }")
    for n in nb:
        print(f"  сосед {n['url']}: {n['status']} {n['ms']} мс {n['error'] or ''}")
    for w in warnings:
        print(f"  предупреждение {w['path']}: {w['problem']}")
    print(f"Ссылки: известные мёртвые из known-dead-links.json {len(rep['links']['known_dead_in_project'])}, внешние редиректы {len(rep['links']['external_redirects'])}")
    print(f"\nОШИБОК: {len(errors)} (запросов {STATS['requests']}, {rep['seconds']} с)")
    for e in errors[:40]:
        print(f"  [{e['where']}] {e['path']} — {e['problem']}")
    if len(errors) > 40:
        print(f'  ... и ещё {len(errors) - 40}, полный список в отчёте')
    sys.exit(1 if errors else 0)


if __name__ == '__main__':
    main()
