import { chromium } from 'playwright'
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } })
const bad = []; p.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()) })
await p.goto('http://localhost:3500/course_correction', { waitUntil: 'load' }); await p.waitForTimeout(1500)
const info = await p.evaluate(async () => {
  await document.fonts.ready
  const el = document.querySelector('#rec882189160 .e1750652718225')
  const cs = getComputedStyle(el)
  const r = document.createRange(); r.selectNodeContents(el); const tw = r.getBoundingClientRect().width
  return { family: cs.fontFamily, weight: cs.fontWeight, ws: cs.whiteSpace, ls: cs.letterSpacing, w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height, textWidth: tw, pad: cs.padding, box: cs.boxSizing,
    check600: document.fonts.check('600 16px Involve'), loaded: [...document.fonts].filter((f) => f.family.includes('Involve')).map((f) => f.weight + ':' + f.status).join(' ') }
})
console.log(JSON.stringify(info, null, 1)); console.log('bad responses:', bad)
await b.close()
