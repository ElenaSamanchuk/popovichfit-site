import { chromium } from 'playwright'
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } })
await p.goto('http://localhost:3500/analys-lk', { waitUntil: 'load' }); await p.waitForTimeout(1500)
console.log(await p.evaluate(() => {
  const el = document.querySelector('#rec1035393091 img'); const out = []
  for (const ss of document.styleSheets) { let rules; try { rules = ss.cssRules } catch { continue }
    const walk = (list, media) => { for (const r of list) { if (r.cssRules && r.media) walk(r.cssRules, r.media.mediaText); else if (r.selectorText && r.style && (r.style.maxWidth || r.style.width) && el.matches(r.selectorText)) out.push(`${media ? '@' + media + ' ' : ''}${r.selectorText} {max-width:${r.style.maxWidth}; width:${r.style.width}} layer=${r.parentRule?.name || ''}`) } }
    walk(rules, '') }
  return out
}))
await b.close()
