import { chromium } from 'playwright'
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } })
const msgs = []; p.on('console', (m) => msgs.push(m.type() + ': ' + m.text().slice(0, 500)))
await p.goto('http://localhost:3500' + process.argv[2], { waitUntil: 'load' }); await p.waitForTimeout(2500)
console.log(msgs.filter((m) => !/Failed to load resource|\[vite\]|Download the Vue Devtools|Nuxt DevTools/.test(m)).join('\n---\n'))
await b.close()
