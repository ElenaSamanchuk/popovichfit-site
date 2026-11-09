#!/usr/bin/env node
/**
 * Проверка приоритетных страниц без ИИ: npm run verify:priority   (после npm run build)
 *   node scripts/verify-priority.mjs                    поднимает .output на свободном порту, проверяет страницы × ширины
 *   node scripts/verify-priority.mjs --base http://127.0.0.1:3100   использовать уже запущенный сервер
 *   node scripts/verify-priority.mjs --redirects        только адреса продаж /pred /predcor /predpow по файлам сборки и nginx (без браузера)
 *   node scripts/verify-priority.mjs --widths 1440,390 --pages /about,/oferta   сузить набор
 *   node scripts/verify-priority.mjs --browser firefox   проверить другим движком Playwright
 *   node scripts/verify-priority.mjs --out docs/screens/2026-11-09-final/verify-priority.json   сохранить результат
 * Для каждой страницы и ширины: ответ 200; ровно одна шапка (header.hdr) и один подвал (footer.foot); нет горизонтальной
 * прокрутки; нет console.error и ответов ≥400 от своего сервера; после прокрутки нет битых <img>; нет ссылок/ресурсов
 * tilda.cc / tildacdn.com / tilda.ws. Код выхода 0 — всё хорошо, 1 — есть ошибки, 2 — не запустился сервер/браузер.
 * Один headless-браузер, один контекст за раз, без видео и трейсов. Запускать под `nice -n 15`.
 */
import fs from 'node:fs'
import path from 'node:path'
import net from 'node:net'
import { spawn } from 'node:child_process'

const ROOT = path.resolve(import.meta.dirname, '..')
const argv = process.argv.slice(2)
const opt = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : d }
const flag = (n) => argv.includes('--' + n)

const PAGES = ['/', '/course_correction', '/course_power', '/course_prod', '/course_corprod', '/course_powprod', '/results', '/media', '/about', '/community',
  '/oferta', '/part_oferta', '/privacy', '/data-consent', '/consent', '/promo', '/inventory', '/nutric-lk', '/sertif', '/taplink', '/open', '/close']
const WIDTHS = [1440, 960, 768, 430, 412, 390, 360, 320]
const pages = opt('pages') ? opt('pages').split(',') : PAGES
const widths = opt('widths') ? opt('widths').split(',').map(Number) : WIDTHS
const browserName = opt('browser', 'chromium')
if (!['chromium', 'firefox', 'webkit'].includes(browserName)) {
  console.error(`Неизвестный движок Playwright: ${browserName}`)
  process.exit(2)
}

const results = []
let failures = 0
const fail = (msg) => { failures++; return msg }

// ---------- режим редиректов продаж: только файлы ----------
function verifyRedirects() {
  console.log('== Адреса продаж по файлам сборки и правилам nginx (без браузера)')
  const salesSrc = fs.readFileSync(path.join(ROOT, 'app/data/sales.ts'), 'utf8')
  const open = /SALES_OPEN\s*=\s*true/.test(salesSrc) || /SALES_OPEN\s*:\s*boolean\s*=\s*true/.test(salesSrc)
  console.log(`SALES_OPEN в app/data/sales.ts: ${open}`)
  const pub = path.join(ROOT, '.output/public')
  if (!fs.existsSync(pub)) { console.log(fail('НЕТ .output/public — сначала npm run build')); return }
  const has = (p) => fs.existsSync(path.join(pub, p))
  const marker = has('sales-open/index.html')
  const check = (ok, text) => console.log(`${ok ? 'ок    ' : fail('ОШИБКА') + ' '} ${text}`)
  const metadata = Object.values(JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/meta.json'), 'utf8')))
  check(marker === open, `маркер sales-open/index.html ${marker ? 'есть' : 'нет'} (ожидается ${open ? 'есть' : 'нет'})`)
  const wantTo = { pred: '/', predcor: '/course_correction', predpow: '/course_power' }
  for (const u of ['pred', 'predcor', 'predpow']) {
    const f = path.join(pub, u, 'index.html'); const html = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''
    const stub = html.match(/http-equiv="refresh" content="0; url=([^"]+)"/)
    if (open) check(!!html && !stub, `пререндер /${u}/index.html — настоящая страница (${html.length} байт), не заглушка`)
    // Статический HTML перехватывается до middleware Nitro и теряет параметры прямого захода.
    else check(!html, `пререндер /${u}/index.html ${html ? 'найден, перекрывает 302' : `нет, сервер перенаправит на ${wantTo[u]}`}`)
  }
  const smap = fs.existsSync(path.join(pub, 'sitemap.xml')) ? fs.readFileSync(path.join(pub, 'sitemap.xml'), 'utf8') : null
  if (smap !== null) for (const u of Object.keys(wantTo)) {
    const url = '/' + u
    const page = metadata.find(entry => entry.url === url)
    const included = smap.includes(url + '</loc>')
    const expected = open && !page?.noindex && page?.published !== false
    check(included === expected, `sitemap.xml ${included ? 'содержит' : 'не содержит'} ${url} (ожидается ${expected ? 'содержит' : 'не содержит'})`)
  }
  else console.log('sitemap.xml в .output/public нет: он отдаётся node-маршрутом (server/routes/sitemap.xml.ts), пропущено')
  // nginx
  const conf = fs.readFileSync(path.join(ROOT, 'deploy/popovichfit.nginx.conf'), 'utf8')
  const map = {}
  const mm = conf.match(/map \$uri \$pf_sales_target \{([\s\S]*?)\}/)
  if (mm) for (const l of mm[1].split('\n')) { const m = l.trim().match(/^(\/\S+)\s+(\/\S*);$/); if (m) map[m[1]] = m[2] }
  const want = { '/pred': '/', '/predcor': '/course_correction', '/predpow': '/course_power' }
  for (const [k, v] of Object.entries(want)) check(map[k] === v, `nginx map: ${k} → ${map[k] ?? 'нет правила'} (ожидается ${v})`)
  const loc = conf.match(/location ~ \^\/\(pred\|predcor\|predpow\)\$ \{([\s\S]*?)\n\s*\}/)
  check(!!loc && /if \(!-f \$document_root\/sales-open\/index\.html\) \{ return 302 \$pf_sales_target\$is_args\$args; \}/.test(loc[1]), 'nginx location: без маркера sales-open → 302 на $pf_sales_target с сохранением query ($is_args$args)')
  // эмуляция правила nginx
  for (const [k, v] of Object.entries(want)) {
    const res = marker ? `200 (страница ${k})` : `302 → ${map[k]}?r=x&utm_source=y`
    console.log(`расчёт: GET ${k}?r=x&utm_source=y при ${marker ? 'открытых' : 'закрытых'} продажах → ${res}`)
  }
  // внутри сайта (клиентская/серверная переадресация)
  const mw = path.join(ROOT, 'app/middleware/sales.global.ts')
  if (fs.existsSync(mw)) {
    const t = fs.readFileSync(mw, 'utf8')
    check(/predcor/.test(t) || /SALES_REDIRECTS|SALES_PAGES/.test(t), 'app/middleware/sales.global.ts обрабатывает адреса продаж')
  }
}

if (flag('redirects')) {
  verifyRedirects()
  console.log(failures ? `\nИТОГ: ОШИБОК ${failures}` : '\nИТОГ: всё в порядке')
  process.exit(failures ? 1 : 0)
}

// ---------- сервер ----------
const freePort = () => new Promise((res) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)) }) })
let child = null
let base = opt('base')
if (!base) {
  if (!fs.existsSync(path.join(ROOT, '.output/server/index.mjs'))) { console.error('НЕТ .output — сначала npm run build'); process.exit(2) }
  const port = await freePort()
  child = spawn('node', ['.output/server/index.mjs'], { cwd: ROOT, env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', NITRO_PORT: String(port) }, stdio: 'ignore' })
  base = `http://127.0.0.1:${port}`
  let ok = false
  for (let i = 0; i < 60 && !ok; i++) { await new Promise((r) => setTimeout(r, 500)); try { ok = (await fetch(base + '/robots.txt')).status < 500 } catch {} }
  if (!ok) { console.error('сервер .output не поднялся'); child.kill(); process.exit(2) }
}
const stop = () => { if (child) child.kill() }
process.on('exit', stop)

let browser
try { browser = await (await import('playwright'))[browserName].launch() }
catch (error) { console.error(`Не запустился ${browserName}: ${error.message}`); stop(); process.exit(2) }
const origin = new URL(base).origin
const t0 = Date.now()
console.log(`== verify:priority  ${browserName}  сервер ${base}  страниц ${pages.length} × ширин ${widths.length}`)

for (const url of pages) {
  for (const w of widths) {
    const phone = w < 600
    // Playwright Firefox не поддерживает isMobile, но применяет viewport, touch и DPR.
    const ctx = await browser.newContext({ viewport: { width: w, height: phone ? 844 : 900 }, deviceScaleFactor: phone ? 3 : 1,
      hasTouch: phone, isMobile: phone && browserName !== 'firefox', locale: 'ru-RU' })
    const page = await ctx.newPage()
    const consoleErr = [], bad = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErr.push(m.text().slice(0, 160)) })
    page.on('pageerror', (e) => consoleErr.push('pageerror: ' + String(e).slice(0, 160)))
    page.on('response', (r) => { if (r.url().startsWith(origin) && r.status() >= 400) bad.push(`${r.status()} ${r.url().replace(origin, '').slice(0, 120)}`) })
    const problems = []
    let info = {}
    try {
      const r = await page.goto(base + url, { waitUntil: 'load', timeout: 60000 })
      const status = r ? r.status() : 0
      if (status !== 200) problems.push(`ответ ${status}`)
      await page.waitForTimeout(800)
      await page.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)) } window.scrollTo(0, 0) })
      await page.waitForTimeout(1200)
      info = await page.evaluate(() => {
        const imgs = [...document.images]
        // картинка считается видимой, если она в границах страницы: элементы Zero, вынесенные за край артборда (left 2351 px, top −302 px), не грузятся lazy и не видны
        const vis = (el) => { const r = el.getBoundingClientRect(); return !!(el.offsetWidth || el.offsetHeight) && r.right > 0 && r.left < document.documentElement.clientWidth && r.bottom + scrollY > 0 }
        return {
          headers: document.querySelectorAll('header.hdr').length, footers: document.querySelectorAll('footer.foot').length,
          sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, height: document.documentElement.scrollHeight,
          broken: imgs.filter((i) => vis(i) && (i.currentSrc || i.src) && ((i.complete && i.naturalWidth === 0) || !i.complete)).map((i) => (i.currentSrc || i.src).slice(0, 120)),
          tilda: (document.documentElement.outerHTML.match(/https?:\/\/[^"'\s)]*(?:tilda\.cc|tildacdn\.com|tilda\.ws)[^"'\s)]*/g) || []).slice(0, 3),
          imgs: imgs.length,
        }
      })
      if (info.headers !== 1) problems.push(`шапок ${info.headers}`)
      if (info.footers !== 1) problems.push(`подвалов ${info.footers}`)
      if (info.sw > info.cw + 1) problems.push(`горизонтальная прокрутка (${info.sw} > ${info.cw})`)
      if (consoleErr.length) problems.push(`console.error ×${consoleErr.length}: ${consoleErr[0]}`)
      if (bad.length) problems.push(`ответы ≥400 ×${bad.length}: ${bad.slice(0, 3).join('; ')}`)
      if (info.broken.length) problems.push(`битых картинок ${info.broken.length}: ${info.broken.slice(0, 2).join(' ; ')}`)
      if (info.tilda.length) problems.push(`ссылки на Тильду: ${info.tilda[0]}`)
    } catch (e) { problems.push('сбой загрузки: ' + String(e).slice(0, 120)) }
    await ctx.close()
    // единичный сбой — один повтор перед выводом (кроме явных дефектов структуры)
    results.push({ url, width: w, ok: problems.length === 0, problems, height: info.height ?? null })
    if (problems.length) failures++
    console.log(`${problems.length ? 'ОШИБКА' : 'ок    '} ${url.padEnd(20)} ${String(w).padStart(5)}  h=${String(info.height ?? '-').padStart(5)}  ${problems.join(' | ')}`)
  }
}
await browser.close()
stop()
// краткая таблица страница × ширина
console.log('\nСтраница × ширина (ок / ОШ):')
console.log('страница'.padEnd(20) + widths.map((w) => String(w).padStart(7)).join(''))
for (const url of pages) console.log(url.padEnd(20) + widths.map((w) => String(results.find((r) => r.url === url && r.width === w)?.ok ? 'ок' : 'ОШ').padStart(7)).join(''))
const outFile = opt('out')
if (outFile) { fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true }); fs.writeFileSync(path.resolve(outFile), JSON.stringify({ base, browser: browserName, date: new Date().toISOString(), results }, null, 1)) }
console.log(`\nИТОГ: проверок ${results.length}, с ошибками ${results.filter((r) => !r.ok).length}, время ${Math.round((Date.now() - t0) / 1000)} с`)
process.exit(results.some((r) => !r.ok) ? 1 : 0)
