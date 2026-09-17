import { chromium } from 'playwright'
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } })
await p.goto('https://popovichfit.ru/course_correction', { waitUntil: 'load', timeout: 60000 }); await p.waitForTimeout(2500)
const info = await p.evaluate(() => {
  const el = document.querySelector('.tn-elem[data-elem-id="1749593975317"]')
  const ul = el.querySelector('ul'), li = el.querySelector('li')
  const pick = (e, keys) => Object.fromEntries(keys.map((k) => [k, getComputedStyle(e)[k]]))
  return { ul: pick(ul, ['paddingLeft', 'marginTop', 'marginBottom', 'listStyleType', 'listStylePosition']), li: pick(li, ['paddingLeft', 'marginLeft', 'display', 'listStyleType']), liBefore: getComputedStyle(li, '::before').content, elH: el.getBoundingClientRect().height, lines: [...el.querySelectorAll('li')].map((l) => Math.round(l.getBoundingClientRect().height)) }
})
console.log(JSON.stringify(info)); await b.close()
