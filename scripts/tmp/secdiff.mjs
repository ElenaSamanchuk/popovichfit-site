import { chromium } from 'playwright'
const [url, id] = process.argv.slice(2)
const html = await (await fetch('http://localhost:3500' + url)).text()
const i = html.indexOf(`<section id="${id}"`); const j = html.indexOf('</section>', i); const ssr = html.slice(i, j + 10)
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } })
await p.goto('http://localhost:3500' + url, { waitUntil: 'load' }); await p.waitForTimeout(2000)
const dom = await p.evaluate((id) => document.getElementById(id)?.outerHTML || '', id)
const norm = (s) => s.replace(/<!--[\s\S]*?-->/g, '').replace(/&#39;|&quot;|"/g, "'").replace(/\s+/g, ' ').replace(/> </g, '><').trim()
const a = norm(ssr), c = norm(dom)
let k = 0; while (k < a.length && k < c.length && a[k] === c[k]) k++
console.log('len ssr', a.length, 'dom', c.length, 'first diff at', k)
console.log('SSR: …' + a.slice(Math.max(0, k - 150), k + 250))
console.log('DOM: …' + c.slice(Math.max(0, k - 150), k + 250))
await b.close()
