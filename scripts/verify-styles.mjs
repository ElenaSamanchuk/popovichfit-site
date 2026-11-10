// Сверка оформления с архивом Тильды: шрифт, размер, межстрочный, цвет, внутренние отступы элементов и блоков, расстояния между блоками.
// Эталон: old-site/ (экспорт 09.11) поднимается локальным сервером, запросов на боевой сайт нет.
// Запуск: node scripts/verify-styles.mjs http://127.0.0.1:3100 [--widths 1440,390,320] [--pages /about,/media] [--report файл]
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const opt = (name, d) => { const i = argv.indexOf('--' + name); return i >= 0 ? argv[i + 1] : d }
const ours = argv[0] ?? 'http://127.0.0.1:3100'
const widths = opt('widths', '1440,390,320').split(',').map(Number)
const SITE = path.join(ROOT, 'old-site')
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/meta.json'), 'utf8'))
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/audit/export-config.json'), 'utf8'))
const fileByUrl = Object.fromEntries(Object.entries(meta).map(([file, p]) => [p.url, file]))
const custom = new Set(cfg.customRoutes.files)
const prio = fs.readFileSync(path.join(ROOT, 'scripts/verify-priority.mjs'), 'utf8').match(/const PAGES = \[([\s\S]*?)\]/)[1]
let pages = opt('pages') ? opt('pages').split(',') : [...prio.matchAll(/'([^']+)'/g)].map((m) => m[1])
const skippedPages = pages.filter((u) => !fileByUrl[u] || custom.has(fileByUrl[u]))
pages = pages.filter((u) => !skippedPages.includes(u))

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.ico': 'image/x-icon' }
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const mapped = fileByUrl[u] ?? fileByUrl[u.replace(/\/$/, '')]
  const file = path.normalize(path.join(SITE, mapped ?? u))
  if (!file.startsWith(SITE) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end() }
  res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
})
await new Promise((r) => server.listen(3199, '127.0.0.1', r))
const archive = 'http://127.0.0.1:3199'

function collect() {
  const clean = (s) => s.replace(/[\s ]+/g, ' ').trim()
  const zoomOf = (el) => { let z = 1; for (let e = el; e; e = e.parentElement) z *= parseFloat(getComputedStyle(e).zoom) || 1; return z }
  const px = (v, z) => (v === 'normal' ? v : Math.round(parseFloat(v) * z * 10) / 10)
  const recs = {}
  document.querySelectorAll('[id^="rec"]').forEach((rec) => {
    if (!/^rec\d+$/.test(rec.id) || rec.parentElement.closest('[id^="rec"]')) return
    const rs = getComputedStyle(rec)
    const rb = rec.getBoundingClientRect()
    if (rs.display === 'none' || rb.height === 0) return
    const texts = []
    const walker = document.createTreeWalker(rec, NodeFilter.SHOW_TEXT)
    const seen = new Set()
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement
      if (seen.has(el) || !clean(n.textContent) || el.closest('script,style,noscript')) continue
      seen.add(el)
      const c = getComputedStyle(el)
      const b = el.getBoundingClientRect()
      if (b.width === 0 || b.height === 0 || c.visibility === 'hidden' || c.display === 'none' || Number(c.opacity) === 0) continue
      const z = zoomOf(el)
      const box = el.closest('a,button') ?? el
      const bc = getComputedStyle(box)
      const zb = zoomOf(box)
      texts.push({ t: clean(el.textContent).slice(0, 48), x: Math.round(b.x - rb.x), y: Math.round(b.y - rb.y), w: Math.round(b.width), h: Math.round(b.height), size: px(c.fontSize, z), lh: px(c.lineHeight, z), ls: px(c.letterSpacing, z), weight: c.fontWeight, family: c.fontFamily.split(',')[0].replace(/["']/g, ''), color: c.color, align: c.textAlign, up: c.textTransform,
        pad: ['Top', 'Right', 'Bottom', 'Left'].map((s) => px(bc['padding' + s], zb)).join(' '), bg: bc.backgroundColor, radius: px(bc.borderTopLeftRadius, zb) })
    }
    recs[rec.id] = { top: Math.round(rb.y + scrollY), h: Math.round(rb.height), pt: parseFloat(rs.paddingTop), pb: parseFloat(rs.paddingBottom), bg: rs.backgroundColor, texts }
  })
  return { w: innerWidth, recs }
}

async function measure(ctx, url) {
  const page = await ctx.newPage()
  try {
    const res = await page.goto(url, { waitUntil: 'load', timeout: 60000 })
    if (res?.status() !== 200) throw new Error('HTTP ' + res?.status())
    await page.waitForTimeout(1200)
    await page.evaluate(async () => { const h = document.body.scrollHeight; for (let y = 0; y < h; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 170)) } scrollTo(0, 0) })
    await page.waitForTimeout(2500)
    return await page.evaluate(collect)
  } finally { await page.close() }
}

const LIMIT = { x: 4, y: 4, w: 6, h: 4, size: 0.6, lh: 1.6, ls: 0.3, radius: 1.5 }
const near = (a, b, d) => (typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) <= d : a === b)
const padNear = (a, b) => a.split(' ').every((v, i) => near(parseFloat(v), parseFloat(b.split(' ')[i]), 1.5))
const transparent = (c) => !c || c === 'transparent' || c === 'rgba(0, 0, 0, 0)'

const browser = await chromium.launch()
const allow = (origin) => async (route) => {
  const u = new URL(route.request().url())
  if (u.origin === origin || /fonts\.(googleapis|gstatic)\.com|static\.tildacdn|neo\.tildacdn/.test(u.hostname)) return route.continue()
  return route.abort()
}
const issues = []
const stat = { pages: 0, runs: 0, blocks: 0, blocksOnlyArchive: 0, blocksOnlyOurs: 0, texts: 0, textsUnmatched: 0, failed: [] }
for (const url of pages) {
  stat.pages++
  for (const width of widths) {
    const phone = width < 600
    const make = async (origin) => {
      const ctx = await browser.newContext({ viewport: { width, height: 900 }, isMobile: phone, hasTouch: phone, deviceScaleFactor: 1, locale: 'ru-RU' })
      await ctx.route('**/*', allow(origin))
      return ctx
    }
    const c1 = await make(archive); const c2 = await make(new URL(ours).origin)
    let A, B
    try { A = await measure(c1, archive + url); B = await measure(c2, ours + url) } catch (e) { stat.failed.push(`${url} ${width}: ${String(e).split('\n')[0]}`); await c1.close(); await c2.close(); continue }
    await c1.close(); await c2.close()
    stat.runs++
    const add = (rec, kind, detail) => issues.push({ url, width, rec, kind, detail })
    let prevA, prevB
    const ids = Object.keys(A.recs).filter((id) => { if (B.recs[id]) return true; stat.blocksOnlyArchive++; return false }).sort((a, b) => A.recs[a].top - A.recs[b].top)
    stat.blocksOnlyOurs += Object.keys(B.recs).filter((id) => !A.recs[id]).length
    for (const id of ids) {
      const a = A.recs[id], b = B.recs[id]
      stat.blocks++
      if (Math.abs(a.h - b.h) > LIMIT.h) add(id, 'высота блока', `Тильда ${a.h}, у нас ${b.h}`)
      if (Math.abs(a.pt - b.pt) > 1.5 || Math.abs(a.pb - b.pb) > 1.5) add(id, 'отступ блока внутренний', `Тильда ${a.pt}/${a.pb}, у нас ${b.pt}/${b.pb}`)
      if (prevA) { const ga = a.top - (prevA.top + prevA.h), gb = b.top - (prevB.top + prevB.h); if (Math.abs(ga - gb) > LIMIT.y) add(id, 'расстояние до блока выше', `Тильда ${ga}, у нас ${gb}`) }
      prevA = a; prevB = b
      if (a.bg !== b.bg && !(transparent(a.bg) && transparent(b.bg))) add(id, 'фон блока', `Тильда ${a.bg}, у нас ${b.bg}`)
      const pool = [...b.texts]
      for (const x of a.texts) {
        stat.texts++
        let i = pool.findIndex((y) => y.t === x.t && Math.abs(y.y - x.y) < 60)
        if (i < 0) i = pool.findIndex((y) => y.t === x.t)
        if (i < 0) { stat.textsUnmatched++; continue }
        const y = pool.splice(i, 1)[0]
        const say = (kind, va, vb) => add(id, kind, `«${x.t}»: Тильда ${va}, у нас ${vb}`)
        if (!near(x.size, y.size, LIMIT.size)) say('размер шрифта', x.size, y.size)
        if (x.weight !== y.weight) say('насыщенность шрифта', x.weight, y.weight)
        if (x.family !== y.family) say('гарнитура', x.family, y.family)
        if (!near(x.lh, y.lh, LIMIT.lh) && x.lh !== 'normal' && y.lh !== 'normal') say('межстрочный', x.lh, y.lh)
        if (!near(x.ls, y.ls, LIMIT.ls) && !(x.ls === 'normal' && y.ls === 0) && !(x.ls === 0 && y.ls === 'normal')) say('межбуквенный', x.ls, y.ls)
        if (x.color !== y.color) say('цвет текста', x.color, y.color)
        if (x.up !== y.up) say('регистр', x.up, y.up)
        if (x.align !== y.align && !(['start', 'left'].includes(x.align) && ['start', 'left'].includes(y.align))) say('выравнивание', x.align, y.align)
        if (!padNear(x.pad, y.pad)) say('отступ внутри элемента', x.pad, y.pad)
        if (x.bg !== y.bg && !(transparent(x.bg) && transparent(y.bg))) say('фон элемента', x.bg, y.bg)
        if (!near(x.radius, y.radius, LIMIT.radius)) say('скругление', x.radius, y.radius)
        if (!near(x.x, y.x, LIMIT.x) || !near(x.y, y.y, LIMIT.y)) say('положение', `${x.x},${x.y}`, `${y.x},${y.y}`)
      }
    }
  }
}
await browser.close(); server.close()

const report = { ours, widths, skippedPages, ...stat, issues }
if (opt('report')) fs.writeFileSync(opt('report'), JSON.stringify(report, null, 1))
console.log(`страниц ${stat.pages}, прогонов ${stat.runs}, блоков ${stat.blocks}, текстов ${stat.texts}, текст не найден ${stat.textsUnmatched}, блоки только в архиве ${stat.blocksOnlyArchive}, только у нас ${stat.blocksOnlyOurs}, расхождений ${issues.length}`)
if (skippedPages.length) console.log('не сверялись (свои маршруты):', skippedPages.join(' '))
for (const f of stat.failed) console.log('СБОЙ', f)
const byKind = {}
for (const i of issues) byKind[i.kind] = (byKind[i.kind] ?? 0) + 1
console.log(JSON.stringify(byKind))
process.exitCode = issues.length || stat.failed.length ? 1 : 0
