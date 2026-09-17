import { chromium } from 'playwright'
const url = process.argv[2]
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } })
await p.goto('http://localhost:3500' + url, { waitUntil: 'load' }); await p.waitForTimeout(1500)
const info = await p.evaluate(() => {
  const at = (x, y) => document.elementsFromPoint(x, y).slice(0, 6).map((e) => `${e.tagName.toLowerCase()}#${e.id}.${String(e.className).slice(0, 50)} z=${getComputedStyle(e).zIndex} pos=${getComputedStyle(e).position} bg=${getComputedStyle(e).backgroundColor}`)
  return { p600_300: at(600, 300), p51_823: at(51, 823), p100_180: at(100, 180) }
})
console.log(JSON.stringify(info, null, 1))
await p.screenshot({ path: 'scripts/tmp/probe.png', clip: { x: 0, y: 0, width: 1200, height: 900 } })
await b.close()
