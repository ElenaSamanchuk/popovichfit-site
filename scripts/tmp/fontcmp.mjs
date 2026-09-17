import { chromium } from 'playwright'
const b = await chromium.launch()
for (const base of ['https://popovichfit.ru', 'http://localhost:3500']) {
  const p = await b.newPage({ viewport: { width: 1200, height: 900 } })
  await p.goto(base + '/course_correction', { waitUntil: 'load', timeout: 60000 }); await p.waitForTimeout(2500)
  const info = await p.evaluate(async () => {
    await document.fonts.ready
    const el = document.querySelector('#rec882189160 .e1750652718225') || document.querySelector('.tn-elem[data-elem-id="1750652718225"] .tn-atom')
    const cs = getComputedStyle(el)
    const c = document.createElement('canvas').getContext('2d'); c.font = '600 16px Involve'
    const s = document.createElement('span'); s.textContent = 'Анастасия'; s.style.cssText = 'font:600 16px Involve;white-space:nowrap;position:absolute'; document.body.appendChild(s)
    const spanW = s.getBoundingClientRect().width; s.remove()
    return { url: location.host, canvas: c.measureText('Анастасия').width, spanW, elW: el.getBoundingClientRect().width, elH: el.getBoundingClientRect().height, ww: cs.wordWrap, ow: cs.overflowWrap, wb: cs.wordBreak, family: cs.fontFamily, smoothing: cs.webkitFontSmoothing, kerning: cs.fontKerning, fonts: [...document.fonts].filter((f) => f.family.replace(/"/g, '') === 'Involve' && f.weight === '600').map((f) => f.status + ' ' + (f.src || '').slice(0, 90)) }
  })
  console.log(JSON.stringify(info))
  await p.close()
}
await b.close()
