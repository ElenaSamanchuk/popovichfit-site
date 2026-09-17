#!/usr/bin/env node
/**
 * Расхождение экспорта с живым сайтом: у каких страниц набор блоков (recNNN) и элементов Zero Block (data-elem-id)
 * на живом сайте отличается от экспорта (страницу правили после выгрузки архива).
 *   node scripts/check-live-drift.mjs [/url …]   → docs/live-drift.json + сводка
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/meta.json'), 'utf8'))
const only = process.argv.slice(2).filter((a) => a.startsWith('/'))
const ids = (html) => ({
  recs: [...html.matchAll(/<div id="(rec\d+)"[^>]*data-record-type="(\d+)"/g)].map((m) => m[1] + ':' + m[2]),
  elems: [...html.matchAll(/data-elem-id=['"](\d+)['"]/g)].map((m) => m[1]),
})
const out = {}; let drift = 0, n = 0
for (const [file, p] of Object.entries(meta)) {
  if (p.url === '/404.html' || (only.length && !only.includes(p.url))) continue
  const exp = ids(fs.readFileSync(path.join(ROOT, 'old-site', file), 'utf8'))
  let live
  let r = null
  for (let attempt = 0; attempt < 4; attempt++) {
    try { r = await fetch('https://popovichfit.ru' + p.url, { headers: { 'user-agent': 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/128 Safari/537.36', 'accept-language': 'ru' } }) } catch (e) { r = null }
    if (r && r.status === 200) break
    await new Promise((res) => setTimeout(res, 60000)) // 403 от защиты Тильды — подождать минуту
  }
  if (!r || r.status !== 200) { out[p.url] = { status: r ? r.status : 'нет ответа' }; continue }
  live = ids(await r.text())
  n++
  await new Promise((r) => setTimeout(r, 2500)) // Тильда режет частые запросы (403)
  const setE = new Set(exp.elems), setL = new Set(live.elems)
  const recsAdded = live.recs.filter((r) => !exp.recs.includes(r)), recsRemoved = exp.recs.filter((r) => !live.recs.includes(r))
  const elemsAdded = [...setL].filter((x) => !setE.has(x)).length, elemsRemoved = [...setE].filter((x) => !setL.has(x)).length
  if (recsAdded.length || recsRemoved.length || elemsAdded || elemsRemoved) { drift++; out[p.url] = { recsAdded, recsRemoved, elemsAdded, elemsRemoved } }
  process.stdout.write(`\r${n} ${p.url}          `)
}
fs.writeFileSync(path.join(ROOT, 'docs/live-drift.json'), JSON.stringify(out, null, 1))
console.log(`\nстраниц проверено: ${n}, с расхождениями экспорта и живого сайта: ${drift} → docs/live-drift.json`)
for (const [u, d] of Object.entries(out)) if (d.recsAdded || d.elemsAdded) console.log(`  ${u}: блоки +${d.recsAdded.length}/−${d.recsRemoved.length}, элементы +${d.elemsAdded}/−${d.elemsRemoved}`)
