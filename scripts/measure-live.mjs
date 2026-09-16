#!/usr/bin/env node
/**
 * «Измеренная спека» живой страницы: фактические координаты всех блоков (.t-rec) и элементов Zero Block
 * (tn-elem) на заданной ширине, после загрузки и прокрутки (анимации появления учтены).
 *   node scripts/measure-live.mjs /course_correction 1200 390
 * Результат: docs/specs/measured/<slug>-<width>.json и <slug>-<width>.txt (читаемая сводка).
 * Координаты — от верха страницы (page y), px. Для элементов: rect, текст, шрифт, цвет, фон.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'docs/specs/measured')
fs.mkdirSync(OUT, { recursive: true })
const [url, ...ws] = process.argv.slice(2)
const widths = ws.length ? ws.map(Number) : [1200, 390]
const BASE = process.env.BASE || 'https://popovichfit.ru'
const slugOf = (u) => (u === '/' ? 'index' : u.replace(/^\//, '').replace(/[\/.]/g, '_'))

const browser = await chromium.launch()
for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1, locale: 'ru-RU' })
  const page = await ctx.newPage()
  await page.goto(BASE + url, { waitUntil: 'load', timeout: 90000 })
  await page.waitForTimeout(2000)
  await page.evaluate(async () => {
    const h = document.body.scrollHeight
    for (let y = 0; y < h; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 150)) }
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(2500)
  const data = await page.evaluate(() => {
    const sy = window.scrollY
    const rect = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y + sy), Math.round(b.width), Math.round(b.height)] }
    const recs = []
    document.querySelectorAll('#allrecords .t-rec').forEach((rec) => {
      const r = rect(rec)
      const type = rec.getAttribute('data-record-type')
      const vis = rec.getAttribute('data-screen-min') || rec.getAttribute('data-screen-max') ? `${rec.getAttribute('data-screen-min') ? 'min ' + rec.getAttribute('data-screen-min') : ''}${rec.getAttribute('data-screen-max') ? 'max ' + rec.getAttribute('data-screen-max') : ''}` : ''
      const cs = getComputedStyle(rec)
      const entry = { id: rec.id, type, rect: r, vis, display: cs.display, elems: [] }
      if (type === '396') {
        const art = rec.querySelector('.t396__artboard')
        if (art) { const a = getComputedStyle(art); entry.artboard = { rect: rect(art), bg: a.backgroundColor, bgImage: a.backgroundImage.slice(0, 120), position: a.position } }
        rec.querySelectorAll('.tn-elem').forEach((el) => {
          const atom = el.querySelector('.tn-atom') || el
          const c = getComputedStyle(atom)
          const er = rect(el)
          const type = el.getAttribute('data-elem-type')
          let text = ''
          if (type === 'text' || type === 'button') text = (atom.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 160)
          const link = (el.querySelector('a') || (atom.tagName === 'A' ? atom : null))
          entry.elems.push({
            id: el.getAttribute('data-elem-id'), type, rect: er, text,
            href: link ? link.getAttribute('href') : '',
            font: `${c.fontSize}/${c.lineHeight} ${c.fontWeight} ${c.fontFamily.split(',')[0].replace(/"/g, '')}`,
            color: c.color, bg: c.backgroundColor, bgImage: c.backgroundImage === 'none' ? '' : c.backgroundImage.replace(/.*\/([^/)"']+)["']?\)/, '$1'),
            bgSize: c.backgroundSize, bgPos: c.backgroundPosition, radius: c.borderRadius, opacity: c.opacity,
            align: c.textAlign, transform: c.textTransform, visible: er[2] > 0 && er[3] > 0 && c.visibility !== 'hidden' && c.display !== 'none' && getComputedStyle(el).opacity !== '0',
          })
        })
        rec.querySelectorAll('.tn-group').forEach((g) => {
          const mol = g.querySelector('[id^="molecule-"]')
          const c = mol ? getComputedStyle(mol) : null
          entry.elems.push({ id: 'G' + g.getAttribute('data-group-id'), type: 'group', rect: rect(g), text: '', bg: c?.backgroundColor, bgImage: c?.backgroundImage?.slice(0, 80), radius: c?.borderRadius, display: c?.display, flex: c ? `${c.flexDirection} gap:${c.gap} align:${c.alignItems} justify:${c.justifyContent} pad:${c.padding}` : '', visible: true })
        })
      } else {
        // не-Zero блоки: краткий текст
        entry.text = (rec.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 200)
      }
      recs.push(entry)
    })
    return { width: innerWidth, height: document.body.scrollHeight, recs }
  })
  const slug = slugOf(url)
  fs.writeFileSync(path.join(OUT, `${slug}-${w}.json`), JSON.stringify(data, null, 1))
  // читаемая сводка
  const lines = [`# ${url} @${w} — высота ${data.height}`]
  for (const rec of data.recs) {
    if (rec.rect[3] === 0 && rec.type !== '396') continue
    lines.push(`\n## ${rec.id} T${rec.type} rect=${rec.rect.join(',')} ${rec.vis ? 'VIS:' + rec.vis : ''} ${rec.display === 'none' ? 'HIDDEN' : ''}`)
    if (rec.text) lines.push(`   text: ${rec.text}`)
    if (rec.artboard) lines.push(`   artboard: ${rec.artboard.rect.join(',')} bg=${rec.artboard.bg} ${rec.artboard.bgImage ? 'img=' + rec.artboard.bgImage : ''} pos=${rec.artboard.position}`)
    const els = rec.elems.filter((e) => e.visible).sort((a, b) => a.rect[1] - b.rect[1] || a.rect[0] - b.rect[0])
    for (const e of els) {
      let s = `- [${e.type}] #${e.id} @${e.rect.join(',')}`
      if (e.text) s += ` «${e.text}»`
      if (e.href) s += ` → ${e.href}`
      if (e.type === 'text' || e.type === 'button') s += ` | ${e.font} ${e.color}${e.transform !== 'none' ? ' ' + e.transform : ''}${e.align !== 'start' && e.align !== 'left' ? ' align:' + e.align : ''}`
      if (e.bg && e.bg !== 'rgba(0, 0, 0, 0)') s += ` bg:${e.bg}`
      if (e.bgImage) s += ` img:${e.bgImage} size:${e.bgSize} pos:${e.bgPos}`
      if (e.radius && e.radius !== '0px') s += ` r:${e.radius}`
      if (e.opacity && e.opacity !== '1') s += ` op:${e.opacity}`
      if (e.type === 'group') s += ` ${e.display} ${e.flex} bg:${e.bg} r:${e.radius}`
      lines.push(s)
    }
  }
  fs.writeFileSync(path.join(OUT, `${slug}-${w}.txt`), lines.join('\n'))
  console.log(`${url} @${w}: ${data.recs.length} блоков, высота ${data.height} → docs/specs/measured/${slug}-${w}.txt`)
  await ctx.close()
}
await browser.close()
