#!/usr/bin/env node
/**
 * Снимок страницы для сверки код ↔ живой сайт: статус, высота, блоки recNNN (id, высота), число картинок, текст, скрины.
 *   node scripts/capture-page.mjs --base https://popovichfit.ru --tag live --out docs/screens/2026-11-09-final --pause 25 /about /oferta
 *   node scripts/capture-page.mjs --base http://127.0.0.1:3100 --tag local --out ... /about
 * Ширины: --widths 1440,390 (по умолчанию). 390 снимается в DPR 3 (верх экрана) и DPR 1 (вся страница).
 * Кэш: если <out>/<tag>/<slug>-<w>.json уже есть и статус 200 — страница не запрашивается повторно (--force перезапрашивает).
 * 403/429 → один повтор через --retry-after секунд (по умолчанию 120), затем запись «не отдал».
 * Один браузер, один контекст за раз. Видео и трейсы не пишутся.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const argv = process.argv.slice(2)
const opt = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : d }
const VALOPTS = new Set(['--base', '--tag', '--out', '--pause', '--retry-after', '--widths'])
const urls = argv.filter((a, i) => a.startsWith('/') && !VALOPTS.has(argv[i - 1]))
const base = opt('base', 'http://127.0.0.1:3100')
const tag = opt('tag', 'local')
const outRoot = path.resolve(opt('out', 'docs/screens/2026-11-09-final'))
const pause = Number(opt('pause', tag === 'live' ? 25 : 0)) * 1000
const retryAfter = Number(opt('retry-after', 120)) * 1000
const widths = opt('widths', '1440,390').split(',').map(Number)
const force = argv.includes('--force')
const noShots = argv.includes('--no-shots')
const dir = path.join(outRoot, tag)
fs.mkdirSync(dir, { recursive: true })
const slugOf = (u) => (u === '/' ? 'index' : u.replace(/^\//, '').replace(/[\/.?#=&]/g, '_'))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await chromium.launch()
let first = true
for (const url of urls) {
  const need = widths.filter((w) => force || !fs.existsSync(path.join(dir, `${slugOf(url)}-${w}.json`)) || JSON.parse(fs.readFileSync(path.join(dir, `${slugOf(url)}-${w}.json`), 'utf8')).status !== 200)
  if (!need.length) { console.log(`кэш   ${url}`); continue }
  if (!first && pause) await sleep(pause)
  first = false
  for (const w of need) {
    const file = path.join(dir, `${slugOf(url)}-${w}`)
    let res = null
    for (let attempt = 0; attempt < 2; attempt++) {
      const ctx = await browser.newContext({ viewport: { width: w, height: w < 600 ? 844 : 900 }, deviceScaleFactor: w < 600 ? 3 : 1, locale: 'ru-RU', isMobile: false })
      const page = await ctx.newPage()
      const errors = [], bad = []
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)) })
      page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url().slice(0, 160)}`) })
      try {
        const r = await page.goto(base + url, { waitUntil: 'load', timeout: 90000 })
        const status = r ? r.status() : 0
        if (status === 403 || status === 429) { res = { url, width: w, status, note: attempt ? 'живой не отдал' : 'повтор' }; await ctx.close(); if (attempt === 0) { console.log(`  ${status} ${url} ${w}, повтор через ${retryAfter / 1000} с`); await sleep(retryAfter); continue } else break }
        await page.waitForTimeout(2000)
        await page.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)) } window.scrollTo(0, 0) })
        await page.waitForTimeout(2000)
        const data = await page.evaluate(() => {
          const sy = window.scrollY
          const recs = [...document.querySelectorAll('[id^="rec"]')].filter((e) => /^rec\d+$/.test(e.id)).map((e) => [e.id, Math.round(e.getBoundingClientRect().height)])
          const imgs = [...document.images]
          const broken = imgs.filter((i) => i.complete && i.naturalWidth === 0 && (i.currentSrc || i.src)).map((i) => (i.currentSrc || i.src).slice(0, 140))
          return {
            height: Math.round(document.documentElement.scrollHeight),
            scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth,
            title: document.title, recs, imgs: imgs.length, broken,
            text: document.body.innerText.replace(/ /g, ' ').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').slice(0, 60000),
          }
        })
        res = { url, width: w, status, ...data, errors, bad }
        if (!noShots) {
          await page.screenshot({ path: file + '-top.png', clip: { x: 0, y: 0, width: w, height: w < 600 ? 844 : 900 } })
          if (w >= 600 || data.height < 12000) { await ctx.setDefaultTimeout(60000) }
          try { await page.screenshot({ path: file + '-full.png', fullPage: true, scale: w < 600 ? 'css' : 'device' }) } catch (e) { res.shotErr = String(e).slice(0, 100) }
        }
        await ctx.close(); break
      } catch (e) { res = { url, width: w, status: 0, error: String(e).slice(0, 200) }; await ctx.close(); break }
    }
    fs.writeFileSync(file + '.json', JSON.stringify(res))
    console.log(`${res.status === 200 ? 'ок   ' : 'ОШИБ '} ${url} ${w}: status=${res.status} h=${res.height ?? '-'} ${res.note ?? res.error ?? ''}`)
    if (w !== need[need.length - 1]) await sleep(tag === 'live' ? 4000 : 0)
  }
}
await browser.close()
