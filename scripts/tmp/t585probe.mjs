import { chromium } from 'playwright'
const b = await chromium.launch()
for (const base of ['https://popovichfit.ru', 'http://localhost:3500']) {
  const p = await b.newPage({ viewport: { width: 1200, height: 900 } })
  await p.goto(base + '/course_correction', { waitUntil: 'load', timeout: 60000 }); await p.waitForTimeout(2000)
  const info = await p.evaluate(() => {
    const rec = document.getElementById('rec1120283681')
    const cs = getComputedStyle(rec)
    const r = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y + scrollY), Math.round(b.width), Math.round(b.height)] }
    const kids = [...rec.querySelectorAll('.t585__title, .t585__col, .t585__header, .t585__content, .t585__lines, .t585__accordion, .t-container, .t-section__title, .t-section__container')].slice(0, 14).map((k) => `${k.className.split(' ').slice(0, 2).join('.')} ${r(k).join(',')} pad=${getComputedStyle(k).paddingTop}/${getComputedStyle(k).paddingBottom} mb=${getComputedStyle(k).marginBottom} lh=${getComputedStyle(k).lineHeight} fs=${getComputedStyle(k).fontSize} bs=${getComputedStyle(k).boxSizing} disp=${getComputedStyle(k).display}`)
    return { rect: r(rec), pad: cs.paddingTop + '/' + cs.paddingBottom, kids }
  })
  console.log(base, JSON.stringify(info, null, 1)); await p.close()
}
await b.close()
