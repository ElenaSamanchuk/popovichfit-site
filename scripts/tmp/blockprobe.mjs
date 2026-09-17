import { chromium } from 'playwright'
const [url, id] = process.argv.slice(2)
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } })
await p.goto('http://localhost:3500' + url, { waitUntil: 'load' }); await p.waitForTimeout(1500)
console.log(JSON.stringify(await p.evaluate((id) => {
  const s = document.getElementById(id); if (!s) return 'no block'
  const r = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y + scrollY), Math.round(b.width), Math.round(b.height)] }
  const cs = getComputedStyle(s)
  return { cls: s.className, style: s.getAttribute('style'), rect: r(s), pos: cs.position, disp: cs.display, art: r(s.querySelector('.tz__art')), artStyle: getComputedStyle(s.querySelector('.tz__art')).height, els: [...s.querySelectorAll('.tz__el')].slice(0, 3).map((e) => ({ cls: e.className.slice(0, 50), rect: r(e), disp: getComputedStyle(e).display, w: getComputedStyle(e).width, u: getComputedStyle(s).getPropertyValue('--u') })) }
}, id), null, 1))
await b.close()
