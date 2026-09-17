import { chromium } from 'playwright'
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } })
await p.goto('http://localhost:3500/lk_cor_end', { waitUntil: 'load' }); await p.waitForTimeout(1500)
const vis = (id) => p.evaluate((id) => { const e = document.getElementById(id); return e ? getComputedStyle(e).display : 'none-el' }, id)
console.log('before: week1', await vis('rec954298581'), 'week2', await vis('rec954298596'))
await p.click('.t395__tab:nth-child(2) button'); await p.waitForTimeout(300)
console.log('after click tab 2: week1', await vis('rec954298581'), 'week2', await vis('rec954298596'), 'active tab:', await p.$eval('.t395__tab_active button', (b) => b.textContent.trim()))
await b.close()
