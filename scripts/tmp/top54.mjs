import { chromium } from 'playwright'
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } })
await p.goto('https://popovichfit.ru/20cor6', { waitUntil: 'load', timeout: 60000 }); await p.waitForTimeout(2500)
const info = await p.evaluate(() => {
  const at = (x, y) => document.elementsFromPoint(x, y).slice(0, 5).map((e) => `${e.tagName.toLowerCase()}#${e.id}.${String(e.className).slice(0, 40)} h=${Math.round(e.getBoundingClientRect().height)} pos=${getComputedStyle(e).position}`)
  const first = document.getElementById('rec779138067')
  const before = []; let n = first.previousElementSibling
  while (n) { const r = n.getBoundingClientRect(); if (r.height > 0) before.push(`${n.tagName}#${n.id}.${String(n.className).slice(0, 30)} y=${Math.round(r.y + scrollY)} h=${Math.round(r.height)} pos=${getComputedStyle(n).position}`); n = n.previousElementSibling }
  const all = document.getElementById('allrecords')
  return { at30: at(600, 30), firstTop: Math.round(first.getBoundingClientRect().y + scrollY), before, allrecordsPad: getComputedStyle(all).paddingTop, bodyPad: getComputedStyle(document.body).paddingTop, bodyMargin: getComputedStyle(document.body).marginTop, firstMarginTop: getComputedStyle(first).marginTop, firstPadTop: getComputedStyle(first).paddingTop }
})
console.log(JSON.stringify(info, null, 1)); await b.close()
