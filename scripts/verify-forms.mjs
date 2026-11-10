// Формы Zero против архива Тильды: подписи, шрифт, размер, цвет, отступы, высоты, расстояния между полями, кнопка.
// Запуск: node scripts/verify-forms.mjs http://127.0.0.1:3100 [--widths 1440,390,320] [--report файл]
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const opt = (n) => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : null }
const ours = (argv[0] ?? 'http://127.0.0.1:3100').replace(/\/$/, '')
const widths = (opt('widths') ?? '1440,390,320').split(',').map(Number)
const PAGES = { '/brief': 62738625, '/draw': 62527967, '/money_draw': 60169819, '/ogin1': 63520191, '/m': 63520433, '/gift': 40474202, '/support': 38241744, '/delete': 38025015 }
const SITE = path.join(ROOT, 'old-site')
const server = http.createServer((q, r) => {
  const f = path.join(SITE, decodeURIComponent(new URL(q.url, 'http://x').pathname))
  if (!f.startsWith(SITE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.statusCode = 404; return r.end() }
  r.setHeader('content-type', { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript' }[path.extname(f)] ?? 'application/octet-stream')
  fs.createReadStream(f).pipe(r)
})
await new Promise((r) => server.listen(3197, '127.0.0.1', r))

const read = (sel) => {
  const shown = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 }
  // Тильда масштабирует блок через zoom: вычисленные значения приходят без него, приводим к экранным
  const st = (e) => { const c = getComputedStyle(e); const z = e.currentCSSZoom ?? 1; return { font: c.fontFamily.split(',')[0].replace(/["']/g, '').replace(/^Pfh/, ''), size: parseFloat(c.fontSize) * z, weight: c.fontWeight, color: c.color, pl: parseFloat(c.paddingLeft) * z, radius: parseFloat(c.borderTopLeftRadius) * z } }
  const box = (e) => { const r = e.getBoundingClientRect(); return { y: r.y + scrollY, w: r.width, h: r.height } }
  const fields = [...document.querySelectorAll(sel.input)].filter(shown).map((e) => ({ tag: e.tagName, ...box(e), ...st(e) }))
  const titles = [...document.querySelectorAll(sel.title)].filter((e) => shown(e) && e.textContent.trim()).map((e) => ({ text: e.textContent.trim(), ...box(e), ...st(e) }))
  const button = [...document.querySelectorAll(sel.button)].filter(shown).map((e) => ({ ...box(e), ...st(e) }))[0]
  return { fields, titles, button }
}
const SEL = {
  tilda: { input: '.t396 form input.t-input, .t396 form textarea.t-input', title: '.t396 form .t-input-title', button: '.t396 form .t-submit' },
  ours: { input: '.tz-form input.tz-form__input, .tz-form textarea.tz-form__input', title: '.tz-form__title', button: '.tz-form button[type=submit]' },
}
const browser = await chromium.launch()
const bad = []
let checks = 0
const skipped = []
for (const [route, id] of Object.entries(PAGES)) for (const width of widths) {
  const context = await browser.newContext({ viewport: { width, height: 900 } })
  await context.route('**/*', (r) => { const u = new URL(r.request().url()); return u.hostname === '127.0.0.1' && r.request().resourceType() !== 'image' ? r.continue() : r.abort() })
  const page = await context.newPage()
  const open = async (url, sel) => { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }); await page.waitForTimeout(1800); return page.evaluate(read, sel) }
  const a = await open(`http://127.0.0.1:3197/page${id}.html`, SEL.tilda)
  const b = await open(ours + route, SEL.ours)
  await context.close()
  const add = (what, x, y) => bad.push({ route, width, what, tilda: x, ours: y })
  // /m и /ogin1 в Тильде масштабируются и на компьютере, у нас макет 1200: известное отличие, вынесено в отчёт
  if (width >= 1200 && ['/m', '/ogin1'].includes(route)) { skipped.push(`${route} ${width}`); continue }
  const same = (what, x, y, tol = 1.5) => { checks++; if (typeof x === 'number' ? Math.abs(x - y) > tol : x !== y) add(what, x, y) }
  same('число полей', a.fields.length, b.fields.length, 0)
  same('число подписей', a.titles.length, b.titles.length, 0)
  a.titles.forEach((t, i) => { const o = b.titles[i]; if (!o) return; for (const k of ['text', 'font', 'size', 'color']) same(`подпись ${i + 1}: ${k}`, t[k], o[k]) })
  a.fields.forEach((f, i) => {
    const o = b.fields[i]; if (!o) return
    for (const k of ['tag', 'font', 'color', 'h', 'w', 'pl', 'radius']) same(`поле ${i + 1}: ${k}`, f[k], o[k])
    // на телефоне поле не мельче 16 px, иначе Safari увеличивает страницу при фокусе
    if (!(width < 960 && o.size >= 16 && f.size < 16)) same(`поле ${i + 1}: размер шрифта`, f.size, o.size)
    if (i) same(`поле ${i + 1}: расстояние от предыдущего`, f.y - a.fields[i - 1].y, o.y - b.fields[i - 1].y, 3.5)
  })
  if (a.button && b.button) {
    for (const k of ['font', 'size', 'h', 'w', 'radius']) same(`кнопка: ${k}`, a.button[k], b.button[k])
    if (a.fields.length && b.fields.length) same('кнопка: от последнего поля', a.button.y - a.fields.at(-1).y, b.button.y - b.fields.at(-1).y, 6.5)
  }
}
await browser.close(); server.close()
if (opt('report')) fs.writeFileSync(opt('report'), JSON.stringify({ ours, widths, checks, errors: bad.length, bad }, null, 1))
console.log(`сверок ${checks}, расхождений ${bad.length}, не сверялось как известное отличие: ${skipped.join(', ') || 'нет'}`)
for (const b of bad.slice(0, 80)) console.log('РАЗНИЦА', b.route, b.width, b.what, 'Тильда', b.tilda, 'у нас', b.ours)
process.exitCode = bad.length ? 1 : 0
