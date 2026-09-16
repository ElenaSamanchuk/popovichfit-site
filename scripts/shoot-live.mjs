#!/usr/bin/env node
/**
 * Скриншоты живого сайта (эталон) для визуальной сверки.
 *   node scripts/shoot-live.mjs                → все страницы из docs/meta.json на 1200 и 390 (full page)
 *   node scripts/shoot-live.mjs --wide         → + 1440/960/640/480/360 (для ядра — категория A)
 *   node scripts/shoot-live.mjs /about /media  → только указанные URL
 * Результат: docs/screens/live/<slug>/<width>.png (полная страница) + <width>.viewport.png (первый экран).
 * Зависит от Playwright (chromium). Живой сайт за DDoS-Guard — параллельность 2, паузы.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'docs/screens/live')
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/meta.json'), 'utf8'))
const args = process.argv.slice(2)
const wide = args.includes('--wide')
const only = args.filter((a) => a.startsWith('/'))
const BASE = 'https://popovichfit.ru'
const WIDTHS = wide ? [1440, 1200, 960, 640, 480, 390, 360] : [1200, 390]

const urls = only.length ? only : Object.values(meta).map((p) => p.url)
const slugOf = (u) => (u === '/' ? 'index' : u.replace(/^\//, '').replace(/[\/.]/g, '_'))

const browser = await chromium.launch()
const queue = [...urls]
let done = 0
async function worker() {
  while (queue.length) {
    const url = queue.shift()
    const dir = path.join(OUT, slugOf(url))
    fs.mkdirSync(dir, { recursive: true })
    for (const w of WIDTHS) {
      const file = path.join(dir, `${w}.png`)
      if (fs.existsSync(file)) continue
      const errFile = path.join(dir, `${w}.error.txt`)
      if (fs.existsSync(errFile)) fs.unlinkSync(errFile)
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1, locale: 'ru-RU' })
      const page = await ctx.newPage()
      try {
        await page.goto(BASE + url, { waitUntil: 'load', timeout: 90000 })
        await page.waitForTimeout(2500)
        // прокрутить до низа, чтобы сработали lazyload и появление блоков, и вернуться
        await page.evaluate(async () => {
          const h = document.body.scrollHeight
          for (let y = 0; y < h; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)) }
          window.scrollTo(0, 0)
        })
        await page.waitForTimeout(1500)
        await page.screenshot({ path: path.join(dir, `${w}.viewport.png`) })
        await page.screenshot({ path: file, fullPage: true })
      } catch (e) {
        fs.writeFileSync(errFile, String(e))
      } finally {
        await ctx.close()
      }
    }
    done++
    process.stdout.write(`\r${done}/${urls.length} ${url}        `)
    await new Promise((r) => setTimeout(r, 500))
  }
}
await Promise.all([worker(), worker()])
await browser.close()
console.log('\ndone')
