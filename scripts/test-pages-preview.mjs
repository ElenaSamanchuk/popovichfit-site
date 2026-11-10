#!/usr/bin/env node
/** node scripts/test-pages-preview.mjs /absolute/public-dir [report.json]
 * Local-only strict subpath static server; no SPA fallback. Browser external requests blocked.
 * Reuses the project's Playwright and verify-priority selectors (hdr/foot, image health).
 */
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
const root = path.resolve(process.argv[2])
const reportFile = path.resolve(process.argv[3] || '/tmp/popovichfit-pages-preview-test.json')
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'preview-manifest.json')))
const base = manifest.base
const report = { root, started: new Date().toISOString(), routes: [], browser: [], errors: [] }
const mime = { '.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.woff':'font/woff','.ico':'image/x-icon' }
const server = http.createServer((req, res) => {
  let pathname
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname) } catch { res.writeHead(400).end(); return }
  if (!pathname.startsWith(base)) { res.writeHead(404).end('Outside preview base'); return }
  let file = path.resolve(root, '.' + pathname.slice(base.length - 1))
  if (!file.startsWith(root + '/') && file !== root) { res.writeHead(403).end(); return }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!pathname.endsWith('/')) { res.writeHead(301, { location: pathname + '/' + new URL(req.url, 'http://localhost').search }).end(); return }
    file = path.join(file, 'index.html')
  }
  if (!fs.existsSync(file)) { res.writeHead(404, {'content-type':'text/html'}).end(fs.readFileSync(path.join(root, '404.html'))); return }
  res.writeHead(200, {'content-type': mime[path.extname(file)] || 'application/octet-stream'}); fs.createReadStream(file).pipe(res)
})
await new Promise(r => server.listen(0, '127.0.0.1', r))
const origin = `http://127.0.0.1:${server.address().port}`
let browser
try {
  for (const route of manifest.routes) {
    const res = await fetch(origin + base + route.slice(1))
    const html = await res.text()
    assert.equal(res.status, 200, route)
    assert.match(html, /name="robots"[^>]*noindex/, route)
    assert.match(html, /Content-Security-Policy/, route)
    report.routes.push({ route, status:res.status, noindex:true })
  }
  for (const route of ['/speakers','/pred','/predcor','/predpow','/open','/close','/payment-test','/test_mtd','/page36666832.html']) assert.equal((await fetch(origin + base + route.slice(1))).status, 404, route)
  browser = await chromium.launch({ headless:true })
  for (const width of [1440,390]) {
    const ctx = await browser.newContext({viewport:{width,height:width===390?844:960},isMobile:width===390,hasTouch:width===390,deviceScaleFactor:width===390?3:1})
    await ctx.route('**/*', route => { const url = new URL(route.request().url()); if (url.origin === origin) return route.continue(); if (url.hostname === 'senndder.ru') return route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }); return route.abort() })
    const page = await ctx.newPage()
    let issues=[]
    page.on('pageerror', e => issues.push(e.message))
    page.on('console', m => { if (m.type()==='error') issues.push(m.text()) })
    page.on('response', r => { if(r.url().startsWith(origin) && r.status()>=400) issues.push(`${r.status()} ${r.url()}`) })
    for (const route of ['/', '/course_correction','/course_power','/course_corprod','/oferta','/community','/taplink','/nutric-lk']) {
      issues=[]
      await page.goto(origin+base+route.slice(1),{waitUntil:'networkidle'})
      await page.waitForFunction(() => !!document.querySelector('#__nuxt')?.__vue_app__)
      await page.evaluate(async()=> { for(let y=0;y<document.body.scrollHeight;y+=700){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,25))}window.scrollTo(0,0) })
      await page.waitForTimeout(350)
      const state = await page.evaluate(()=>({title:document.title,headers:document.querySelectorAll('header.hdr').length,footers:document.querySelectorAll('footer.foot').length,overflow:document.documentElement.scrollWidth>innerWidth+2,broken:[...document.images].filter(i=>{const r=i.getBoundingClientRect();return r.width>0&&r.height>0&&r.right>0&&r.left<innerWidth&&i.complete&&!i.naturalWidth}).map(i=>i.src)}))
      report.browser.push({width,route,...state,issues:[...issues]})
    }
    await page.goto(origin+base+'?utm_source=preview-test',{waitUntil:'networkidle'})
    await page.evaluate(()=>window.__previewDocumentIdentity='preserved')
    if(width===390){await page.locator('.burger').click();assert.equal(await page.locator('.burger').getAttribute('aria-expanded'),'true');await page.locator('#sheet .menu__nav a[href*="course_correction"]').click()}
    else await page.locator('.hdr__nav a[href*="course_correction"]').click()
    await page.waitForURL('**/course_correction*')
    await page.waitForTimeout(700)
    assert.equal(await page.evaluate(()=>window.__previewDocumentIdentity),'preserved','SPA navigation reloaded the document')
    assert.ok(page.url().includes(base+'course_correction'),'base lost')
    assert.equal(new URL(page.url()).searchParams.get('utm_source'),'preview-test')
    if(width===390) assert.equal(await page.locator('.burger').getAttribute('aria-expanded'),'false')
    assert.match(await page.locator('meta[name=robots]').getAttribute('content'), /noindex/)
    assert.equal(await page.locator('script[src*="senndder.ru"]').count(),1,'chat widget missing')
    // Prove fetch/send guard and visible explanation, never send a real form.
    assert.equal(await page.evaluate(async()=>{try{await fetch('/api/lead',{method:'POST',body:'preview'});return false}catch{return true}}),true)
    // Форма сайта работает визуально и не создаёт ни одного изменяющего запроса.
    const posts=[];page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))posts.push(r.url())})
    await page.goto(origin+base+'support/',{waitUntil:'networkidle'})
    const form=page.locator('form.tz-form:visible').first()
    for(const input of await form.locator('input:not([type=checkbox]),textarea').all()){const type=await input.getAttribute('type');await input.fill(type==='email'?'qa@example.com':type==='tel'?'+375291112233':'Проверка QA')}
    for(const box of await form.locator('input[type=checkbox]').all()) await box.check()
    await form.locator('button[type=submit]').click()
    await page.getByText('Спасибо! Заявка отправлена.').first().waitFor({timeout:4000})
    assert.deepEqual(posts,[],'preview form sent a request')
    await page.screenshot({path:reportFile.replace(/\.json$/,`-${width}.png`)})
    await ctx.close()
  }
  for (const r of report.browser) if(r.issues.length||r.broken.length||r.headers!==1||r.footers!==1) report.errors.push(r)
} catch(e) { report.errors.push({fatal:e.stack}) }
finally {await browser?.close();await new Promise(r=>server.close(r));fs.writeFileSync(reportFile,JSON.stringify(report,null,2))}
console.log(JSON.stringify({routes:report.routes.length,browser:report.browser.length,errors:report.errors,reportFile},null,2))
process.exitCode=report.errors.length?1:0
