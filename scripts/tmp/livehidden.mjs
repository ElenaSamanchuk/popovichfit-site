import { chromium } from 'playwright'
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } })
await p.goto('https://popovichfit.ru/lk_cor_end', { waitUntil: 'load', timeout: 60000 }); await p.waitForTimeout(3000)
console.log(JSON.stringify(await p.evaluate(() => ['rec954298596', 'rec954298606', 'rec954298631', 'rec954298581'].map((id) => { const el = document.getElementById(id); if (!el) return id + ': нет'; const cs = getComputedStyle(el); return { id, display: cs.display, h: el.getBoundingClientRect().height, style: el.getAttribute('style'), cls: el.className, parent: el.parentElement.id + '.' + el.parentElement.className.slice(0, 40), artDisplay: el.querySelector('.t396__artboard') && getComputedStyle(el.querySelector('.t396__artboard')).display } })), null, 1))
await b.close()
