#!/usr/bin/env node
/**
 * Кроссбраузерность: скриншоты локальных страниц в WebKit (Safari) и Firefox против Chromium (pixelmatch) + ошибки консоли.
 *   node scripts/check-browsers.mjs / /course_correction /gift1   → docs/screens/browsers/<slug>-<browser>.png, сводка в консоль
 */
import fs from 'node:fs'
import path from 'node:path'
import { chromium, webkit, firefox } from 'playwright'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

const ROOT = path.resolve(import.meta.dirname, '..')
const urls = process.argv.slice(2).filter((a) => a.startsWith('/'))
if (!urls.length) { console.error('укажите URL'); process.exit(1) }
const OUT = path.join(ROOT, 'docs/screens/browsers'); fs.mkdirSync(OUT, { recursive: true })
const slugOf = (u) => (u === '/' ? 'index' : u.replace(/^\//, '').replace(/[\/.]/g, '_'))
const BASE = process.env.BASE || 'http://localhost:3500'
const shots = {}
for (const [name, type] of [['chromium', chromium], ['webkit', webkit], ['firefox', firefox]]) {
  const b = await type.launch()
  for (const url of urls) {
    const p = await b.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 })
    const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 120))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)) })
    await p.goto(BASE + url, { waitUntil: 'load', timeout: 60000 }); await p.waitForTimeout(1500)
    await p.evaluate(async () => { const h = document.body.scrollHeight; for (let y = 0; y < h; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)) } scrollTo(0, 0) }); await p.waitForTimeout(500)
    const file = path.join(OUT, `${slugOf(url)}-${name}.png`)
    await p.screenshot({ path: file, fullPage: true })
    ;(shots[url] ||= {})[name] = { file, errs, h: await p.evaluate(() => document.documentElement.scrollHeight) }
    await p.close()
  }
  await b.close()
}
for (const url of urls) {
  const ref = PNG.sync.read(fs.readFileSync(shots[url].chromium.file))
  for (const name of ['webkit', 'firefox']) {
    const img = PNG.sync.read(fs.readFileSync(shots[url][name].file))
    const W = Math.min(ref.width, img.width), H = Math.min(ref.height, img.height)
    const crop = (p) => { const o = new PNG({ width: W, height: H }); PNG.bitblt(p, o, 0, 0, W, H, 0, 0); return o }
    const n = pixelmatch(crop(ref).data, crop(img).data, null, W, H, { threshold: 0.2, includeAA: true })
    const s = shots[url][name]
    console.log(`${url} ${name}: diff ${((n / (W * H)) * 100).toFixed(1)}% vs chromium, высота ${s.h} (chromium ${shots[url].chromium.h})${s.errs.length ? ', ошибки: ' + s.errs.slice(0, 3).join(' | ') : ''}`)
  }
}
