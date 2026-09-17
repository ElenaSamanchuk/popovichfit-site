import { chromium } from 'playwright'
const b = await chromium.launch()
for (const u of ['/20cor6', '/course_correction', '/about', '/gift1']) {
  const p = await b.newPage({ viewport: { width: 1200, height: 900 } })
  await p.goto('https://popovichfit.ru' + u, { waitUntil: 'load', timeout: 60000 }); await p.waitForTimeout(2000)
  const info = await p.evaluate(() => {
    const h = document.getElementById('t-header')
    const r = (el) => { const b = el.getBoundingClientRect(); return `y=${Math.round(b.y + scrollY)} h=${Math.round(b.height)}` }
    const kids = h ? [...h.children].map((k) => `${k.id}.${String(k.className).slice(0, 25)} ${r(k)} pos=${getComputedStyle(k).position} disp=${getComputedStyle(k).display}`) : []
    const first = [...document.querySelectorAll('#allrecords > .r, #allrecords > div')].find((e) => e.getBoundingClientRect().height > 0)
    return { header: h ? r(h) : null, kids, firstRec: first ? first.id + ' ' + r(first) : null }
  })
  console.log(u, JSON.stringify(info, null, 1)); await p.close()
}
await b.close()
