#!/usr/bin/env node
/**
 * Скриншоты локальной версии для сверки с живым сайтом.
 *   node scripts/shoot-local.mjs / /about            → 1200 и 390 (full page + viewport)
 *   node scripts/shoot-local.mjs --wide /             → + 1440/960/640/480/360
 *   BASE=http://localhost:3501 node scripts/shoot-local.mjs /   (например, статическая сборка)
 * Результат: docs/screens/local/<slug>/<width>.png — те же имена, что у scripts/shoot-live.mjs.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'docs/screens/local')
const args = process.argv.slice(2)
const wide = args.includes('--wide')
const urls = args.filter((a) => a.startsWith('/'))
if (!urls.length) { console.error('Укажите URL: node scripts/shoot-local.mjs / /about'); process.exit(1) }
const BASE = process.env.BASE || 'http://localhost:3500'
const WIDTHS = wide ? [1440, 1200, 960, 640, 480, 390, 360] : [1200, 390]
const slugOf = (u) => (u === '/' ? 'index' : u.replace(/^\//, '').replace(/[\/.]/g, '_'))

const browser = await chromium.launch()
for (const url of urls) {
  const dir = path.join(OUT, slugOf(url))
  fs.mkdirSync(dir, { recursive: true })
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1, locale: 'ru-RU' })
    const page = await ctx.newPage()
    // cookie-баннер уже принят, плашка ВК не закрыта — как на живых скриншотах (там баннер виден) → не трогаем
    await page.goto(BASE + url, { waitUntil: 'load', timeout: 60000 })
    // для замера/скриншота ленивые картинки грузим сразу (иначе далёкие от вьюпорта остаются высотой 0)
    await page.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager' }))
    await page.waitForTimeout(1500)
    await page.evaluate(async () => {
      const h = document.body.scrollHeight
      for (let y = 0; y < h; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)) }
      window.scrollTo(0, 0)
    })
    // дожидаемся ленивых картинок (после прокрутки они начинают грузиться)
    await page.evaluate(() => Promise.race([Promise.all([...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r }))), new Promise((r) => setTimeout(r, 6000))]))
    await page.waitForTimeout(800)
    await page.screenshot({ path: path.join(dir, `${w}.viewport.png`) })
    await page.screenshot({ path: path.join(dir, `${w}.png`), fullPage: true })
    await ctx.close()
    console.log(url, w, 'ok')
  }
}
await browser.close()
