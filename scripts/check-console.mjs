#!/usr/bin/env node
/**
 * Загружает страницы локальной версии в Playwright и печатает предупреждения/ошибки консоли и 404.
 *   node scripts/check-console.mjs / /about   (BASE=http://localhost:3500 по умолчанию)
 */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:3500'
const urls = process.argv.slice(2).filter((a) => a.startsWith('/'))
const browser = await chromium.launch()
let bad = 0
for (const url of urls) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } })
  const msgs = []
  page.on('console', (m) => { if (['warning', 'error'].includes(m.type())) msgs.push(`${m.type()}: ${m.text().slice(0, 300)}`) })
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('vue&type=style')) msgs.push(`HTTP ${r.status()} ${r.url()}`) })
  page.on('pageerror', (e) => msgs.push(`pageerror: ${e.message} ${(e.stack || '').split('\n').slice(1, 3).join(' | ').slice(0, 300)}`))
  await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => msgs.push('goto: ' + e.message))
  await page.waitForTimeout(1500)
  const filtered = msgs.filter((m) => !/\[Vue Router warn\]|devtools|sourcemap/i.test(m))
  console.log(`${url}: ${filtered.length ? filtered.length + ' сообщений' : 'чисто'}`)
  for (const m of filtered) console.log('  ' + m)
  bad += filtered.length
  await page.close()
}
await browser.close()
process.exit(bad ? 1 : 0)
