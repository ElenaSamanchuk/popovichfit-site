#!/usr/bin/env node
/**
 * Аудит числа строк текста в элементах Zero Block: живой сайт ↔ код. Лишняя строка = неразрывные пробелы/типограф сузили строку.
 *   node scripts/audit-lines.mjs collect --base https://popovichfit.ru --tag live --pause 25 /about /results   → <out>/lines/<tag>/<slug>-<w>.json
 *   node scripts/audit-lines.mjs collect --base http://127.0.0.1:3100 --tag local /about /results
 *   node scripts/audit-lines.mjs compare /about /results                                                    → сводка расхождений (код выхода 1, если есть)
 * Ширины: --widths 1440,390. Кэш: файл есть и непустой — страница не запрашивается повторно (--force).
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const argv = process.argv.slice(2)
const cmd = argv[0]
const VAL = new Set(['--base', '--tag', '--out', '--pause', '--widths'])
const opt = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : d }
const urls = argv.filter((a, i) => a.startsWith('/') && !VAL.has(argv[i - 1]))
const out = path.resolve(opt('out', 'docs/screens/2026-11-09-final'), 'lines')
const widths = opt('widths', '1440,390').split(',').map(Number)
const slugOf = (u) => (u === '/' ? 'index' : u.replace(/^\//, '').replace(/[\/.?#=&]/g, '_'))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

if (cmd === 'collect') {
  const tag = opt('tag', 'local'), base = opt('base', 'http://127.0.0.1:3100'), pause = Number(opt('pause', tag === 'live' ? 25 : 0)) * 1000
  fs.mkdirSync(path.join(out, tag), { recursive: true })
  const browser = await chromium.launch()
  let first = true
  for (const url of urls) {
    const need = widths.filter((w) => argv.includes('--force') || !fs.existsSync(path.join(out, tag, `${slugOf(url)}-${w}.json`)))
    if (!need.length) { console.log('кэш', url); continue }
    if (!first && pause) await sleep(pause); first = false
    const ctx = await browser.newContext({ viewport: { width: need[0], height: 900 }, deviceScaleFactor: 1, locale: 'ru-RU' })
    const page = await ctx.newPage()
    for (const w of need) {
      try {
        await page.setViewportSize({ width: w, height: 900 })
        const r = await page.goto(base + url, { waitUntil: 'load', timeout: 90000 })
        const status = r ? r.status() : 0
        if (status !== 200) { fs.writeFileSync(path.join(out, tag, `${slugOf(url)}-${w}.json`), JSON.stringify({ url, w, status, items: [] })); console.log('статус', status, url, w); continue }
        await page.waitForTimeout(1500)
        await page.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 450) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 100)) } window.scrollTo(0, 0) })
        await page.waitForTimeout(1500)
        const items = await page.evaluate(() => {
          const res = []
          for (const el of document.querySelectorAll('.t396__elem, .tn-elem, [data-elem-type="text"], [data-elem-type="button"], .tz__el')) {
            const at = el.querySelector('.tn-atom, .tz__atom, .tz__txt') || el
            const text = (at.innerText || '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim()
            if (!text || at.getClientRects().length === 0) continue
            const b = at.getBoundingClientRect(); if (b.width < 2 || b.height < 2) continue
            const cs = getComputedStyle(at); if (cs.visibility === 'hidden' || +cs.opacity === 0 && !at.closest('[class*=anim]')) { /* прозрачные до анимации учитываем */ }
            const tops = new Set(); const rg = document.createRange(); rg.selectNodeContents(at)
            for (const rc of rg.getClientRects()) if (rc.width > 0 && rc.height > 0) tops.add(Math.round(rc.top / 3))
            // строки считаем по вертикальным позициям фрагментов текста; сворачиваем близкие (inline-фрагменты на одной строке)
            const arr = [...tops].sort((a, b) => a - b); let lines = 0, last = -99
            const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2
            for (const t of arr) { if (t * 3 - last > lh * 0.5) { lines++; last = t * 3 } }
            res.push({ t: text.slice(0, 80), lines, w: Math.round(b.width), x: Math.round(b.left), y: Math.round(b.top + scrollY), fs: cs.fontSize })
          }
          // cookie-плашка: ближайший fixed/absolute предок текста про куки — её размер на данной ширине
          let cookie = null
          const walker = [...document.querySelectorAll('body *')].filter((e) => /использует куки/.test(e.textContent || '')).pop()
          if (walker) { let e = walker; while (e && e !== document.body) { const p = getComputedStyle(e).position; if (p === 'fixed') break; e = e.parentElement } const q = (e && e !== document.body ? e : walker).getBoundingClientRect(); cookie = { h: Math.round(q.height), w: Math.round(q.width), fixed: !!(e && e !== document.body) } }
          return { items: res, cookie, height: document.documentElement.scrollHeight }
        })
        fs.writeFileSync(path.join(out, tag, `${slugOf(url)}-${w}.json`), JSON.stringify({ url, w, status, ...items }))
        console.log('ок', tag, url, w, items.length, 'элементов')
      } catch (e) { console.log('сбой', url, w, String(e).slice(0, 100)) }
      if (tag === 'live') await sleep(4000)
    }
    await ctx.close()
  }
  await browser.close()
} else if (cmd === 'compare') {
  let bad = 0
  for (const url of urls) for (const w of widths) {
    const f = (t) => { const p = path.join(out, t, `${slugOf(url)}-${w}.json`); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null }
    const L = f('live'), C = f('local')
    if (!L || !C || L.status !== 200) { console.log(`пропуск ${url} ${w}: ${!L ? 'нет снимка живого' : L.status !== 200 ? 'живой не отдал (' + L.status + ')' : 'нет локального'}`); continue }
    // сопоставление по тексту (в порядке появления)
    const pool = new Map(); for (const it of C.items) { const a = pool.get(it.t) || []; a.push(it); pool.set(it.t, a) }
    let diff = 0, matched = 0, onlyLive = 0, xd = 0; const fsd = [], yd = []
    const rows = []
    for (const it of L.items) {
      const a = pool.get(it.t); if (!a || !a.length) { onlyLive++; continue }
      const c = a.shift(); matched++
      if (c.fs !== it.fs && it.fs) fsd.push(`   шрифт «${it.t.slice(0, 40)}» живой ${it.fs}, код ${c.fs}`)
      if (c.x !== it.x && Math.abs(c.x - it.x) > 4) xd++
      if (Math.abs(c.y - it.y) > 8) yd.push(`   положение по Y «${it.t.slice(0, 40)}» живой ${it.y}, код ${c.y}`)
      if (c.lines !== it.lines) { diff++; rows.push(`   «${it.t.slice(0, 50)}» живой ${it.lines} стр., код ${c.lines} стр. (ширина ${it.w}/${c.w})`) }
    }
    console.log(`${diff ? 'РАЗНИЦА' : 'ок     '} ${url} ${w}: сопоставлено ${matched}, расходится по числу строк ${diff}, текстов только на живом ${onlyLive}`)
    console.log(`   положение по X расходится (>4 px): ${xd}; размер шрифта расходится: ${fsd.length}; высота страницы живой ${L.height} / код ${C.height}; cookie живой ${JSON.stringify(L.cookie)} / код ${JSON.stringify(C.cookie)}`)
    console.log(`   положение по Y расходится (>8 px): ${yd.length}`)
    for (const r of yd.slice(0, 6)) console.log(r)
    for (const r of rows.slice(0, 15)) console.log(r)
    bad += diff
  }
  process.exit(bad ? 1 : 0)
}
