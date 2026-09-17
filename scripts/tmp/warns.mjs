import { chromium } from 'playwright'
const url = process.argv[2]
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } })
const msgs = []
p.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') msgs.push(m.type() + ': ' + m.text().slice(0, 600)) })
await p.goto('http://localhost:3500' + url, { waitUntil: 'load' }); await p.waitForTimeout(2000)
console.log(msgs.join('\n---\n')); await b.close()
