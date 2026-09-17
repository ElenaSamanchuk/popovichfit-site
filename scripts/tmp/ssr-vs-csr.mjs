// Сравнение SSR-разметки страницы с клиентским рендером (переход из другой страницы) — ищем первое расхождение
import { chromium } from 'playwright'
const url = process.argv[2]
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } })
await p.goto('http://localhost:3500/about', { waitUntil: 'load' }); await p.waitForTimeout(1000)
await p.evaluate((u) => window.useNuxtApp().$router.push(u), url); await p.waitForTimeout(2500)
const csr = await p.evaluate(() => document.querySelector('.tilda-page')?.outerHTML || '')
const res = await fetch('http://localhost:3500' + url); const html = await res.text()
const i = html.indexOf('<div class="tilda-page">'); const ssr = html.slice(i)
const tokens = (s) => [...s.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<\/?[a-z][^>]*>|[^<]+/gi)].map((m) => m[0].replace(/\s+/g, ' ').trim()).filter(Boolean)
const a = tokens(ssr), c = tokens(csr)
let k = 0; while (k < a.length && k < c.length && a[k] === c[k]) k++
console.log('tokens ssr', a.length, 'csr', c.length, 'first diff at', k)
console.log('SSR:', a.slice(Math.max(0, k - 2), k + 3).map((t) => t.slice(0, 200)).join('\n     '))
console.log('CSR:', c.slice(Math.max(0, k - 2), k + 3).map((t) => t.slice(0, 200)).join('\n     '))
await b.close()
