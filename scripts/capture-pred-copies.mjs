#!/usr/bin/env node
/** Снимки сохранённых копий /predcor и /predpow (sources/pred-2026-11-06/*.html, живой DOM от 06.11): десктопная копия — на 1440, мобильная — на 390 и 360.
 *  node scripts/capture-pred-copies.mjs [--out docs/screens/2026-11-09-final]   → <out>/copy/<name>-<w>.json/.png. Скрипты Тильды в копиях грузятся с её CDN (статика), сам popovichfit.ru не запрашивается. */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
const i = process.argv.indexOf('--out'); const out = path.resolve(i > 0 ? process.argv[i + 1] : 'docs/screens/2026-11-09-final', 'copy')
fs.mkdirSync(out, { recursive: true })
const src = path.resolve('sources/pred-2026-11-06')
const jobs = []
for (const n of ['predcor', 'predpow']) { jobs.push([n, 'desktop', 1440]); jobs.push([n, 'mobile', 390]); jobs.push([n, 'mobile', 360]) }
const b = await chromium.launch()
for (const [n, kind, w] of jobs) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 600 ? 844 : 900 }, deviceScaleFactor: w < 600 ? 3 : 1, locale: 'ru-RU' })
  const page = await ctx.newPage(); const errors = [], bad = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 140)) })
  page.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url().slice(0, 120)) })
  await page.goto('file://' + path.join(src, `${n}-${kind}.html`), { waitUntil: 'load', timeout: 90000 }).catch((e) => errors.push('goto ' + e))
  await page.waitForTimeout(3000)
  await page.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)) } window.scrollTo(0, 0) })
  await page.waitForTimeout(2500)
  const data = await page.evaluate(() => {
    const recs = [...document.querySelectorAll('[id^="rec"]')].filter((e) => /^rec\d+$/.test(e.id)).map((e) => [e.id, Math.round(e.getBoundingClientRect().height)])
    const imgs = [...document.images]
    return { height: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, recs, imgs: imgs.length, broken: imgs.filter((i) => i.complete && i.naturalWidth === 0 && (i.currentSrc || i.src)).map((i) => (i.currentSrc || i.src).slice(0, 120)) }
  })
  const f = path.join(out, `${n}-${w}`)
  fs.writeFileSync(f + '.json', JSON.stringify({ name: n, kind, width: w, ...data, errors, bad }))
  await page.screenshot({ path: f + '-top.png', clip: { x: 0, y: 0, width: w, height: w < 600 ? 844 : 900 } })
  try { await page.screenshot({ path: f + '-full.png', fullPage: true, scale: 'css' }) } catch {}
  console.log(n, kind, w, 'h=', data.height, 'recs', data.recs.length, 'imgs', data.imgs, 'broken', data.broken.length, 'errors', errors.length)
  await ctx.close()
}
await b.close()
