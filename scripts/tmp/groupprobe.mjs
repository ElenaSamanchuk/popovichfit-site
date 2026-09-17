import { chromium } from 'playwright'
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } })
await p.goto('http://localhost:3500/new-course', { waitUntil: 'load' }); await p.waitForTimeout(1500)
console.log(await p.evaluate(() => { const g = document.querySelector('.g1784206216248000002'); const m = g?.querySelector(':scope > .tz__mol'); return { g: g && getComputedStyle(g).backgroundColor, mol: m && [getComputedStyle(m).backgroundColor, getComputedStyle(m).borderRadius, getComputedStyle(m).padding] } }))
await b.close()
