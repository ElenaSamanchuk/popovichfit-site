#!/usr/bin/env node
/**
 * Сверка геометрии: живые замеры (docs/specs/measured/<slug>-<width>.json, scripts/measure-live.mjs)
 * против локальной страницы — по каждому элементу Zero Block (.e<id>) и группе (.g<id>).
 *   node scripts/measure-diff.mjs /course_correction [1200] [порог px=3] [--no-styles]
 * Кроме геометрии сверяет шрифт (размер/интерлиньяж/вес/семейство), цвет, фон, скругление, выравнивание.
 * Печатает блоки с расхождениями: смещение (dx,dy) и размер (dw,dh) элементов, текст для ориентира.
 */
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const ROOT = path.resolve(import.meta.dirname, '..')
const styles = !process.argv.includes('--no-styles')
const [url, wArg, tolArg] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const parseFont = (f) => { const m = /^([\d.]+)px\/([\d.]+|normal)(?:px)? (\d+) (.*)$/.exec(f || ''); return m ? { size: +m[1], lh: m[2] === 'normal' ? 0 : +m[2], weight: m[3], family: m[4].trim() } : null }
const isTransparent = (c) => !c || c === 'rgba(0, 0, 0, 0)' || c === 'transparent'
/** имя файла картинки без tilda-хеша/расширения: tild…__name.png ↔ t…-name.webp */
const baseName = (v) => (v === 'none' ? '' : v || '').replace(/^.*__/, '').replace(/^t[0-9a-f]{8}-/, '').replace(/(\.(png|jpe?g|webp|svg|ico))+$/i, '').replace(/[^a-zа-я0-9]+/gi, '').toLowerCase()
if (!url) { console.error('node scripts/measure-diff.mjs /url [width] [tol]'); process.exit(1) }
const w = +(wArg || 1200), tol = +(tolArg || 3)
const slug = url === '/' ? 'index' : url.replace(/^\//, '').replace(/[\/.]/g, '_')
const specFile = path.join(ROOT, 'docs/specs/measured', `${slug}-${w}.json`)
if (!fs.existsSync(specFile)) { console.error('нет замера: ' + specFile + ' (node scripts/measure-live.mjs ' + url + ' ' + w + ')'); process.exit(1) }
const live = JSON.parse(fs.readFileSync(specFile, 'utf8'))

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: w, height: 900 } })
await page.goto((process.env.BASE || 'http://localhost:3500') + (process.env.LOCAL_URL || url), { waitUntil: 'load', timeout: 60000 })
await page.waitForTimeout(1500)
await page.evaluate(async () => { const h = document.body.scrollHeight; for (let y = 0; y < h; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)) } scrollTo(0, 0) })
await page.waitForTimeout(500)
/** блоки, которые заменены общими компонентами layout (шапка/cookie/меню/футер/плашка ВК) — не сверяем */
const SHARED = new Set(['rec1120433846', 'rec2019524321', 'rec592229670', 'rec1120448561', 'rec2322627601', 'rec2322644301'])
const local = await page.evaluate((recs) => {
  const rect = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y + scrollY), Math.round(b.width), Math.round(b.height)] }
  const out = { recs: {}, elems: {}, height: document.documentElement.scrollHeight }
  for (const r of recs) {
    const root = document.getElementById(r.id)
    if (!root) continue
    out.recs[r.id] = rect(root)
    // блок скрыт локально (табы из блоков, «показать ещё») — элементы не сверяем
    if (getComputedStyle(root).display === 'none' || root.classList.contains('tabshide')) { out.hiddenRecs = [...(out.hiddenRecs || []), r.id]; continue }
    for (const id of r.elems) {
      // ищем внутри блока: одинаковые id элементов встречаются в скопированных блоках
      const el = root.querySelector(id.startsWith('G') ? '.g' + id.slice(1) : '.e' + id)
      if (el) {
        // у групп фон/скругление — на молекуле (.tz__mol), как у Тильды на #molecule-…
        const cs = getComputedStyle(id.startsWith('G') ? el.querySelector(':scope > .tz__mol') || el : el)
        const atom = el.querySelector('.tz__atom, .tz__btn-text') || el
        const c = getComputedStyle(atom)
        out.elems[r.id + ':' + id] = { rect: rect(el), opacity: cs.opacity, visible: cs.display !== 'none' && cs.visibility !== 'hidden',
          text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 160),
          font: `${c.fontSize}/${c.lineHeight} ${c.fontWeight} ${c.fontFamily.split(',')[0].replace(/"/g, '')}`,
          color: c.color, bg: cs.backgroundColor, radius: cs.borderRadius, align: c.textAlign, transform: c.textTransform,
          bgImage: cs.backgroundImage === 'none' ? '' : cs.backgroundImage.replace(/.*\/([^/)"']+)["']?\)/, '$1') }
      }
    }
  }
  return out
}, live.recs.filter((r) => !SHARED.has(r.id)).map((r) => ({ id: r.id, elems: (r.elems || []).map((e) => e.id) })))
// у типовых блоков локально id стоит на .tb (T-блок) — тот же rec-id
await browser.close()

// общий вертикальный сдвиг страницы (например, 54px мусорного текста Collabza над контентом на живом сайте):
// если ≥ 60 % элементов сдвинуты на одну и ту же величину — вычитаем её и сообщаем один раз
const dys = []
for (const rec of live.recs) for (const e of rec.elems || []) { const l = local.elems[rec.id + ':' + e.id]; if (e.visible && l) dys.push(l.rect[1] - e.rect[1]) }
const freq = new Map(); for (const v of dys) freq.set(v, (freq.get(v) || 0) + 1)
const [modeDy, modeN] = [...freq.entries()].sort((a, b) => b[1] - a[1])[0] || [0, 0]
const globalDy = Math.abs(modeDy) > tol && modeN >= dys.length * 0.6 ? modeDy : 0
console.log(`${url} @${w}: высота live ${live.height} / local ${local.height}${globalDy ? `  (общий сдвиг по вертикали ${globalDy}px — вычтен)` : ''}`)
let total = 0, bad = 0
for (const rec of live.recs) {
  if (SHARED.has(rec.id)) continue
  const lr = local.recs[rec.id]
  // блок той же высоты, но сдвинут по y (выше пропущен мусорный/лишний блок) — элементы сверяем относительно блока
  const blockDy = lr && Math.abs(lr[3] - rec.rect[3]) <= tol && Math.abs(lr[1] - globalDy - rec.rect[1]) > tol ? lr[1] - globalDy - rec.rect[1] : 0
  if (!(rec.elems || []).length) {
    // типовой блок: только прямоугольник (y и высота); блоки нулевой высоты на живом (скрипты, попапы) — пропускаем,
    // но если локально такой блок получил высоту — это лишний блок (сообщаем)
    if (rec.rect[3] > 0 && (!lr || Math.abs(lr[1] - globalDy - rec.rect[1]) > tol || Math.abs(lr[3] - rec.rect[3]) > tol)) console.log(`\n## ${rec.id} T${rec.type}  блок: live y=${rec.rect[1]} h=${rec.rect[3]} / local ${lr ? `y=${lr[1] - globalDy} h=${lr[3]}` : 'отсутствует'}`)
    else if (rec.rect[3] === 0 && lr && lr[3] > tol) console.log(`\n## ${rec.id} T${rec.type}  лишний блок локально: на живом h=0, local h=${lr[3]}`)
    continue
  }
  // zero-попапы (контент T1093): на живом все элементы невидимы → локально живут в модалке (в DOM их нет), не сверяем;
  // но если такой «невидимый на живом» блок локально отрисован в потоке с высотой — это лишний блок
  if ((local.hiddenRecs || []).includes(rec.id)) { if (rec.rect[3] > tol) console.log(`\n## ${rec.id} T${rec.type}  скрыт локально, а на живом виден: live h=${rec.rect[3]}`); continue }
  if (!(rec.elems || []).some((e) => e.visible && !(e.type === 'group' && !(e.rect[2] > 0 && e.rect[3] > 0)))) {
    if (lr && lr[3] > tol) console.log(`\n## ${rec.id} T${rec.type}  скрытый на живом блок отрисован локально: h=${lr[3]} (live y=${rec.rect[1]} h=${rec.rect[3]})`)
    continue
  }
  const rows = []
  for (const e of rec.elems) {
    if (!e.visible || (e.type === 'group' && !(e.rect[2] > 0 && e.rect[3] > 0))) continue
    const l = local.elems[rec.id + ':' + e.id]
    total++
    if (!l) { rows.push(`  ✗ #${e.id} [${e.type}] нет на локальной  live@${e.rect.join(',')} ${(e.text || '').slice(0, 40)}`); bad++; continue }
    if (!l.visible) { rows.push(`  ✗ #${e.id} [${e.type}] скрыт локально  live@${e.rect.join(',')} ${(e.text || '').slice(0, 40)}`); bad++; continue }
    const d = e.rect.map((v, i) => l.rect[i] - v); d[1] -= globalDy + blockDy
    if (e.opacity != null && l.opacity !== e.opacity && Math.abs(+l.opacity - +e.opacity) > 0.05) { rows.push(`  ✗ #${e.id} [${e.type}] opacity live ${e.opacity} / local ${l.opacity}  ${(e.text || '').slice(0, 40)}`); bad++; continue }
    const notes = []
    if (d.some((v) => Math.abs(v) > tol)) notes.push(`dx=${d[0]} dy=${d[1]} dw=${d[2]} dh=${d[3]}`)
    // стили: шрифт (размер ±0.5, интерлиньяж ±1, вес, семейство), цвет, выравнивание, регистр; фон, скругление, картинка фона
    // тексты дословно (нормализуем пробелы/nbsp; live обрезан до 160 символов)
    const norm = (t) => (t || '').replace(/[\s\u00a0]+/g, ' ').trim()
    if ((e.type === 'text' || e.type === 'button') && e.text && norm(e.text) !== norm(l.text)) notes.push(`текст live «${norm(e.text).slice(0, 60)}» / local «${norm(l.text).slice(0, 60)}»`)
    if (styles && (e.type === 'text' || e.type === 'button')) {
      const pf = parseFont(e.font), lf = parseFont(l.font)
      if (pf && lf && (Math.abs(pf.size - lf.size) > 0.5 || Math.abs(pf.lh - lf.lh) > 1 || pf.weight !== lf.weight || pf.family !== lf.family)) notes.push(`шрифт live ${e.font} / local ${l.font}`)
      if (e.color !== l.color) notes.push(`цвет live ${e.color} / local ${l.color}`)
      if (e.align !== l.align && !(e.align === 'start' && l.align === 'left')) notes.push(`align live ${e.align} / local ${l.align}`)
      if (e.transform !== l.transform) notes.push(`text-transform live ${e.transform} / local ${l.transform}`)
    }
    if (styles && e.type !== 'image' && e.type !== 'vector') {
      // полупрозрачный «кружок» с backdrop-filter: Тильда (chrome-fix для sbs-анимаций) переносит rgba-фон с атома на элемент,
      // замер live видит прозрачный атом — у нас тот же rgba на элементе, визуально одно и то же
      const faint = /^rgba\([^)]*,\s*0?\.[0-3]\d*\)$/.test(l.bg || '')
      if (e.bg !== l.bg && !(isTransparent(e.bg) && (isTransparent(l.bg) || faint))) notes.push(`фон live ${e.bg} / local ${l.bg}`)
      if (e.radius !== l.radius && e.type !== 'text') notes.push(`radius live ${e.radius} / local ${l.radius}`)
      if ((e.bgImage || '') !== (l.bgImage || '') && baseName(e.bgImage) !== baseName(l.bgImage)) notes.push(`bg-image live ${e.bgImage || '—'} / local ${l.bgImage || '—'}`)
    }
    if (notes.length) { bad++; rows.push(`  Δ #${e.id} [${e.type}] ${notes.join(' | ')}  live@${e.rect.join(',')}  ${(e.text || '').slice(0, 40)}`) }
  }
  const recNote = lr ? (Math.abs(lr[1] - globalDy - rec.rect[1]) > tol || Math.abs(lr[3] - rec.rect[3]) > tol ? `  блок: live y=${rec.rect[1]} h=${rec.rect[3]} / local y=${lr[1] - globalDy} h=${lr[3]}${blockDy ? ' (сдвиг блока целиком на ' + blockDy + 'px — элементы сверены относительно блока)' : ''}` : '') : '  блок отсутствует локально'
  if (rows.length || recNote) { console.log(`\n## ${rec.id} T${rec.type}${recNote}`); rows.slice(0, 25).forEach((r) => console.log(r)); if (rows.length > 25) console.log(`  … ещё ${rows.length - 25}`) }
}
console.log(`\nэлементов: ${total}, с расхождениями > ${tol}px: ${bad}`)
