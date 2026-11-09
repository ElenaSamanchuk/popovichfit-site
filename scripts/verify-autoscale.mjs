// Запуск на локальной сборке: node scripts/verify-autoscale.mjs http://127.0.0.1:3100
import fs from 'node:fs/promises'
import { chromium } from 'playwright'

const base = new URL(process.argv[2] ?? 'http://127.0.0.1:3100')
if (base.hostname !== '127.0.0.1' && base.hostname !== 'localhost') {
  throw new Error('Для этой проверки нужен локальный сервер')
}

const widths = [320, 360, 390, 412, 430, 480, 768, 1100]
const cases = [
  { route: '/community', file: '33365599', record: 'rec539331578' },
  { route: '/course_correction', file: '41085668', record: 'rec1575798931' },
  { route: '/course_power', file: '41126306', record: 'rec1575800441' },
  { route: '/about', file: '24828209', record: 'rec1120316286' },
  { route: '/', file: '36666832', record: 'rec2019524321' },
]
const browser = await chromium.launch()
const results = []

try {
  for (const { route, file, record } of cases) {
    const source = new URL(`../app/data/tilda/page${file}.json`, import.meta.url)
    const { blocks } = JSON.parse(await fs.readFile(source, 'utf8'))
    const { artboards } = blocks.find(block => block.id === record)
    for (const width of widths) {
      const artW = [960, 640, 480, 320].find(screen => width >= screen)
      const { h, upscale: mode } = artboards[artW]
      // Коэффициент оригинального t396__setGlobalScaleVariables.
      const zoom = mode === 'window' ? Number((width / artW).toFixed(3)) : 1
      const expected = h * zoom
      const phone = width < 600
      const context = await browser.newContext({
        viewport: { width, height: 844 },
        isMobile: phone,
        hasTouch: phone,
        deviceScaleFactor: phone ? 3 : 1,
      })
      try {
        await context.route('**/*', request => new URL(request.request().url()).origin === base.origin
          ? request.continue() : request.abort())
        const page = await context.newPage()
        const response = await page.goto(new URL(route, base).href, { waitUntil: 'load', timeout: 30000 })
        if (response?.status() !== 200) throw new Error(`HTTP ${response?.status()}`)
        const art = page.locator(`#${record} .tz__art`).first()
        await art.waitFor({ state: 'visible', timeout: 5000 })
        await page.evaluate(() => document.fonts.ready.then(() => new Promise(resolve => {
          requestAnimationFrame(() => requestAnimationFrame(resolve))
        })))
        const actual = await art.evaluate(element => element.getBoundingClientRect().height)
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        results.push({ route, width, record, artW, mode, expected, actual, overflow,
          ok: Math.abs(actual - expected) <= 1 && overflow <= 1 })
      } catch (error) {
        results.push({ route, width, record, ok: false, error: String(error).split('\n')[0] })
      } finally {
        await context.close()
      }
    }
  }
} finally {
  await browser.close()
}
console.log(JSON.stringify(results, null, 2))
process.exitCode = Number(results.some(result => !result.ok))
