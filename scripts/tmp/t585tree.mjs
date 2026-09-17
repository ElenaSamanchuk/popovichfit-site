import { chromium } from 'playwright'
const b = await chromium.launch()
for (const base of ['https://popovichfit.ru', 'http://localhost:3500']) {
  const p = await b.newPage({ viewport: { width: 1200, height: 900 } })
  await p.goto(base + '/course_correction', { waitUntil: 'load', timeout: 60000 }); await p.waitForTimeout(2000)
  const info = await p.evaluate(() => {
    const rec = document.getElementById('rec1120283681')
    const r = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y + scrollY), Math.round(b.width), Math.round(b.height)] }
    const out = []
    const walk = (el, d) => { if (d > 4) return; for (const k of el.children) { const cs = getComputedStyle(k); out.push(`${'  '.repeat(d)}${k.tagName.toLowerCase()}.${k.className.toString().split(' ').slice(0, 2).join('.')} ${r(k).join(',')} m=${cs.marginTop}/${cs.marginBottom} p=${cs.paddingTop}/${cs.paddingBottom} ${cs.display}`); if (out.length < 40) walk(k, d + 1) } }
    walk(rec, 0)
    return out.slice(0, 40)
  })
  console.log(base); console.log(info.join('\n')); await p.close()
}
await b.close()
