import { chromium } from 'playwright'
const url = process.argv[2]
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } })
await p.goto('http://localhost:3500' + url, { waitUntil: 'load' }); await p.waitForTimeout(1500)
const info = await p.evaluate(() => {
  const secs = [...document.querySelectorAll('.tilda-page > *')].slice(0, 4)
  return secs.map((s) => {
    const r = s.getBoundingClientRect()
    const els = [...s.querySelectorAll('.tz__el')].slice(0, 6).map((e) => { const cs = getComputedStyle(e); const rr = e.getBoundingClientRect(); return { cls: e.className.slice(0, 60), x: Math.round(rr.x), y: Math.round(rr.y + scrollY), w: Math.round(rr.width), h: Math.round(rr.height), op: cs.opacity, vis: cs.visibility, disp: cs.display, tr: cs.transform } })
    return { id: s.id, cls: s.className.slice(0, 80), y: Math.round(r.y + scrollY), h: Math.round(r.height), n: s.querySelectorAll('.tz__el').length, els }
  })
})
console.log(JSON.stringify(info, null, 1))
await b.close()
