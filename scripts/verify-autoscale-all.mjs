// Автоскейл только там, где он был в Тильде: все Zero-блоки всех страниц сверяются с настройкой блока из экспорта.
// window: блок масштабируется на ширину экрана. grid: размеры макета, без масштаба.
// Запуск: node scripts/verify-autoscale-all.mjs http://127.0.0.1:3100 [--report файл] [--pages /a,/b]
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const opt = (name) => { const i = argv.indexOf('--' + name); return i >= 0 ? argv[i + 1] : null }
const base = new URL(argv[0] ?? 'http://127.0.0.1:3100')
if (!['127.0.0.1', 'localhost'].includes(base.hostname)) throw new Error('Для этой проверки нужен локальный сервер')

const WIDTHS = [320, 360, 390, 412, 479, 480, 600, 640, 768, 960, 1100]
const source = await fs.readFile(path.join(ROOT, 'app/data/pages.ts'), 'utf8')
let pages = [...source.matchAll(/"page(\d+)\.html":\s*\{\s*url:\s*"([^"]+)"/g)].map((m) => ({ file: m[1], route: m[2] }))
const only = opt('pages')?.split(',')
if (only) pages = pages.filter((p) => only.includes(p.route))

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 })
await context.route('**/*', (route) => {
  const req = route.request()
  if (new URL(req.url()).origin !== base.origin || ['image', 'media'].includes(req.resourceType())) return route.abort()
  return route.continue()
})
const page = await context.newPage()
const stat = { pages: 0, skipped: [], blocks: 0, checks: 0, window: 0, grid: 0, hidden: 0 }
const bad = []
const overflow = []

for (const { file, route } of pages) {
  let blocks
  try { blocks = JSON.parse(await fs.readFile(path.join(ROOT, `app/data/tilda/page${file}.json`), 'utf8')).blocks.filter((b) => b.artboards) } catch { stat.skipped.push(`${route}: нет данных`); continue }
  if (!blocks.length) continue
  let response
  try { response = await page.goto(new URL(route, base).href, { waitUntil: 'domcontentloaded', timeout: 30000 }) } catch (e) { stat.skipped.push(`${route}: ${String(e).split('\n')[0]}`); continue }
  if (response?.status() !== 200) { stat.skipped.push(`${route}: HTTP ${response?.status()}`); continue }
  if (new URL(page.url()).pathname.replace(/\/$/, '') !== route.replace(/\/$/, '')) { stat.skipped.push(`${route}: переход на ${new URL(page.url()).pathname}`); continue }
  await page.waitForTimeout(250)
  stat.pages++
  stat.blocks += blocks.length
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 844 })
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    const seen = await page.evaluate((ids) => Object.fromEntries(ids.map((id) => {
      const section = document.getElementById(id)
      const art = section?.querySelector('.tz__art')
      if (!art) return [id, null]
      const b = art.getBoundingClientRect()
      return [id, { u: getComputedStyle(section).getPropertyValue('--u').trim(), h: b.height, shown: b.height > 0 && b.width > 0, zoom: getComputedStyle(art).zoom }]
    })), blocks.map((b) => b.id))
    // Ширина экрана задана явно: при горизонтальном переполнении телефонный innerWidth раздувается, а медиазапросы и 100vw остаются по экрану.
    const vw = width
    const wide = await page.evaluate(() => Math.max(window.innerWidth, document.documentElement.scrollWidth))
    if (wide - width > 1) overflow.push({ route, width, wide })
    for (const block of blocks) {
      const screens = Object.keys(block.artboards).map(Number).filter((s) => s < 1200 && s <= vw).sort((a, b) => b - a)
      const artW = screens[0]
      const found = seen[block.id]
      if (!artW || !found || !found.shown) { stat.hidden++; continue }
      const { h, upscale, hug } = block.artboards[artW]
      stat.checks++
      stat[upscale === 'window' ? 'window' : 'grid']++
      const has = Boolean(found.u)
      const fail = (what) => bad.push({ route, block: block.id, width: vw, artW, upscale, what, u: found.u, actual: Math.round(found.h * 10) / 10, h })
      if (upscale === 'window' && !has) fail('в Тильде масштаб по окну, у нас его нет')
      if (upscale !== 'window' && has) fail('в Тильде сетка, у нас масштаб')
      if (found.zoom && found.zoom !== '1' && found.zoom !== 'normal') fail(`лишний zoom ${found.zoom}`)
      if (h && !hug) {
        const expected = upscale === 'window' ? h * vw / artW : h
        if (Math.abs(found.h - expected) > 1.5) fail(`высота ${Math.round(found.h)}, по Тильде ${Math.round(expected)}`)
      }
    }
  }
}
await browser.close()

const report = { base: base.href, widths: WIDTHS, ...stat, errors: bad.length, bad, overflow }
if (opt('report')) await fs.writeFile(opt('report'), JSON.stringify(report, null, 1))
console.log(`страниц ${stat.pages}, блоков ${stat.blocks}, сверок ${stat.checks} (по окну ${stat.window}, сетка ${stat.grid}), скрыто ${stat.hidden}, пропущено страниц ${stat.skipped.length}, ошибок ${bad.length}`)
for (const s of stat.skipped.slice(0, 40)) console.log('пропуск', s)
for (const b of bad.slice(0, 60)) console.log('ОШИБКА', b.route, b.block, b.width, `артборд ${b.artW}`, b.upscale, b.what)
const wideRoutes = [...new Set(overflow.map((o) => o.route))]
console.log(`горизонтальная прокрутка: ${wideRoutes.length} страниц`)
for (const r of wideRoutes) console.log('ПРОКРУТКА', r, overflow.filter((o) => o.route === r).map((o) => `${o.width}→${o.wide}`).join(' '))
process.exitCode = bad.length ? 1 : 0
