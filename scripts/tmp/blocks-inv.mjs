import fs from 'node:fs'
import { chromium } from 'playwright'
const url = process.argv[2]; const slug = url.replace(/^\//, '').replace(/[\/.]/g, '_')
const live = JSON.parse(fs.readFileSync(`docs/specs/measured/${slug}-1200.json`, 'utf8'))
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } })
await p.goto('http://localhost:3500' + url, { waitUntil: 'load' }); await p.waitForTimeout(1500)
const local = await p.evaluate(() => [...document.querySelectorAll('.tilda-page > *')].map((s) => ({ id: s.id || s.getAttribute('data-tilda-rec') || s.className.slice(0, 30), h: Math.round(s.getBoundingClientRect().height), y: Math.round(s.getBoundingClientRect().y + scrollY) })))
const liveMap = Object.fromEntries(live.recs.map((r) => [r.id, r.rect]))
console.log('LOCAL блоки с высотой > 0, которых нет/0 на живом:')
for (const s of local) if (s.h > 3 && (!liveMap[s.id] || liveMap[s.id][3] === 0)) console.log(`  ${s.id} local h=${s.h} y=${s.y}  live=${liveMap[s.id] ? liveMap[s.id].join(',') : '—'}`)
console.log('LIVE блоки с высотой > 0, которых нет локально:')
for (const r of live.recs) if (r.rect[3] > 0 && !local.find((s) => s.id === r.id)) console.log(`  ${r.id} T${r.type} live h=${r.rect[3]} y=${r.rect[1]}`)
await b.close()
