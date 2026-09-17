import { chromium } from 'playwright'
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } })
await p.goto('https://popovichfit.ru/before', { waitUntil: 'load', timeout: 60000 }); await p.waitForTimeout(2500)
console.log(await p.evaluate(() => { const a = document.querySelector('#rec773176188 .t396__artboard'); return { sw: a?.scrollWidth, cw: a?.clientWidth, ox: a && getComputedStyle(a).overflowX, arrows: [...document.querySelectorAll('#rec773176187 .arrow-left, #rec773176187 .arrow-right')].map((e) => e.className.slice(0, 60)) } }))
await b.close()
