import { chromium } from 'playwright'
const url = process.argv[2]
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } })
const msgs = []
p.on('console', (m) => { if (/mismatch|Hydration/i.test(m.text())) msgs.push(m.text().slice(0, 400)) })
await p.goto('http://localhost:3500' + url, { waitUntil: 'load' }); await p.waitForTimeout(2000)
console.log(msgs.slice(0, 8).join('\n---\n')); console.log('total', msgs.length)
const secs = await p.evaluate(() => [...document.querySelectorAll('.tilda-page > *')].map((s) => `${s.tagName}#${s.id}.${String(s.className).slice(0, 30)} h=${Math.round(s.getBoundingClientRect().height)}`))
console.log(secs.join('\n')); await b.close()
