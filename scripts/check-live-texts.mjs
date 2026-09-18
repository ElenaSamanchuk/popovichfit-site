import { chromium } from 'playwright'
import fs from 'node:fs'
/** Тексты Zero-элементов живого сайта vs наши данные — ловит правки, сделанные в Тильде после экспорта.
 *  node scripts/check-live-texts.mjs / /course_correction …   (живой сайт троттлит — по несколько страниц за раз)
 *  Найденное — в scripts/audit/fixups.json → texts (или свежий экспорт + пересборка данных). */
const meta = JSON.parse(fs.readFileSync('docs/meta.json', 'utf8'))
const pages = process.argv.slice(2)
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } })
for (const url of pages) {
  const file = Object.keys(meta).find((f) => meta[f].url === url)
  const data = JSON.parse(fs.readFileSync('app/data/tilda/' + file.replace('.html', '.json'), 'utf8'))
  const ours = new Map(); for (const bl of data.blocks) for (const e of bl.elems || []) if (e.type === 'text' || e.type === 'button') ours.set(bl.id + ':' + e.id, (e.text || '').replace(/\s+/g, ' ').trim())
  const r = await p.goto('https://popovichfit.ru' + url, { waitUntil: 'load', timeout: 60000 }); await p.waitForTimeout(2500)
  const live = await p.evaluate(() => [...document.querySelectorAll('.t-rec .tn-elem[data-elem-id]')].filter((e) => ['text', 'button'].includes(e.getAttribute('data-elem-type'))).map((e) => [e.closest('.t-rec').id + ':' + e.getAttribute('data-elem-id'), (e.textContent || '').replace(/\s+/g, ' ').trim()]))
  const norm = (t) => t.replace(/[^\p{L}\p{N}]+/gu, '').toLowerCase()
  const diffs = live.filter(([k, t]) => ours.has(k) && norm(ours.get(k)) !== norm(t) && !norm(ours.get(k)).startsWith(norm(t)) && !norm(t).startsWith(norm(ours.get(k))))
  console.log(url, 'status', r.status(), 'live text elems', live.length, 'ours', ours.size, 'diffs', diffs.length)
  for (const [k, t] of diffs.slice(0, 15)) console.log('  ', k, 'LIVE:', t.slice(0, 70), '| OURS:', ours.get(k).slice(0, 70))
}
await b.close()
