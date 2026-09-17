import { chromium } from 'playwright'
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } })
const errors = []; p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)) })
p.on('pageerror', (e) => errors.push('pageerror: ' + e.message.slice(0, 200)))
await p.goto('http://localhost:3500/gift1', { waitUntil: 'load' }); await p.waitForTimeout(2000)
const links = await p.$$eval('a[href*="#order:"]', (as) => as.slice(0, 3).map((a) => a.getAttribute('href')))
console.log('order links:', links.length ? links : 'none')
const hasQuiz = await p.$('.t806'); console.log('quiz rendered:', !!hasQuiz)
// клик по первой кнопке «1 поток»
const a = await p.$('a[href*="#order:"]')
if (a) {
  await a.scrollIntoViewIfNeeded(); await a.click(); await p.waitForTimeout(500)
  const open = await p.$('.pf-cart'); console.log('cart open:', !!open)
  const txt = await p.$eval('.pf-cart', (el) => el.innerText.replace(/\s+/g, ' ').slice(0, 300)); console.log('cart text:', txt)
  const inputs = await p.$$('.pf-cart input:not([type=hidden]):not(.hidden)')
  console.log('inputs:', inputs.length)
  await inputs[0].fill('Тест Тестов'); await inputs[1].fill('test@example.com'); await inputs[2].fill('+7 999 123-45-67')
  const [resp] = await Promise.all([p.waitForResponse((r) => r.url().includes('/api/order')), p.click('.pf-cart button[type=submit]')])
  console.log('order response:', resp.status(), JSON.stringify(await resp.json()).slice(0, 200))
  await p.waitForTimeout(500)
  console.log('after submit:', await p.$eval('.pf-cart', (el) => el.innerText.replace(/\s+/g, ' ').slice(0, 200)))
  await p.keyboard.press('Escape'); await p.waitForTimeout(300)
  console.log('cart closed:', !(await p.$('.pf-cart')))
}
// попап-форма T702 #popup:myform
await p.evaluate(() => { const a = document.createElement('a'); a.href = '#popup:myform'; a.textContent = 'x'; document.body.appendChild(a); a.click() })
await p.waitForTimeout(500)
const popup = await p.$('.tb--popup form.t-form')
console.log('popup form:', !!popup)
if (popup) {
  const ins = await popup.$$('input:not([type=hidden])'); console.log('popup inputs:', ins.length, await Promise.all(ins.map((i) => i.getAttribute('placeholder'))))
  await ins[0].fill('Тест'); await ins[1].fill('test@example.com')
  const [resp] = await Promise.all([p.waitForResponse((r) => r.url().includes('/api/lead')), popup.$eval('[type=submit]', (b) => b.click())])
  console.log('lead response:', resp.status(), JSON.stringify(await resp.json()))
  await p.waitForTimeout(400)
  console.log('popup after:', await p.$eval('.tb--popup', (el) => el.innerText.replace(/\s+/g, ' ').slice(0, 200)))
}
console.log('errors:', errors.slice(0, 5))
await b.close()
