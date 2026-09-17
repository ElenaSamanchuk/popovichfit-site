import { chromium } from 'playwright'
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } })
await p.goto('http://localhost:3500/analys-lk', { waitUntil: 'load' }); await p.waitForTimeout(1500)
console.log(await p.evaluate(() => { const el = document.querySelector('#rec1035393091 img'); const cs = getComputedStyle(el); return { w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height, nat: el.naturalWidth + 'x' + el.naturalHeight, width: cs.width, maxWidth: cs.maxWidth, display: cs.display, cls: el.className, parentW: el.parentElement.getBoundingClientRect().width, blockH: document.getElementById('rec1035393091').getBoundingClientRect().height } }))
await b.close()
