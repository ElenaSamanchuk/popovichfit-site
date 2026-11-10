#!/usr/bin/env node
/** Формы, окна, вкладки, плавность и кнопки покупки без ИИ. Заявки не уходят: POST перехватывается в браузере.
 *  node scripts/verify-ui.mjs [http://127.0.0.1:3100] [--browser chromium|webkit] [--preview] [--report файл.json]
 *  --preview: сборка режима просмотра, запросов POST быть не должно. Код выхода 1 при ошибке. */
import fs from 'node:fs'
import { chromium, webkit } from 'playwright'

const argv = process.argv.slice(2)
const opt = (name, fallback) => { const i = argv.indexOf('--' + name); return i >= 0 ? argv[i + 1] : fallback }
const preview = argv.includes('--preview')
const base = new URL(argv.find((a) => a.startsWith('http')) ?? 'http://127.0.0.1:3100')
const browserName = opt('browser', 'chromium')
const reportFile = opt('report', '')
const WIDTHS = [[1440, 900], [390, 844]]
const FORM_ROUTES = ['/support', '/delete', '/m', '/course_prod', '/brief', '/gift', '/gift1', '/draw', '/money_draw', '/members/signup', '/ogin1']
const COURSE_ROUTES = ['/course_correction', '/course_power', '/course_prod', '/course_corprod', '/course_powprod']
const SUCCESS = /Спасибо|успешно/i
const url = (path) => new URL(base.pathname.replace(/\/$/, '') + path, base.origin).href

const results = []
const record = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'ок    ' : 'ОШИБКА'} ${name}${detail ? ' — ' + detail : ''}`) }
const note = (name, detail) => { results.push({ name, ok: null, detail }); console.log(`—      ${name} — ${detail}`) }

const browser = await (browserName === 'webkit' ? webkit : chromium).launch()

async function open(path, [width, height], extra = {}) {
  const context = await browser.newContext({ viewport: { width, height }, ...extra })
  const posts = []
  await context.route('**/*', (route) => {
    const request = route.request()
    const target = new URL(request.url())
    if (target.hostname === 'senndder.ru') return route.fulfill({ status: 200, contentType: 'text/javascript', body: '' })
    if (target.origin !== base.origin && /mc\.yandex|vk\.com\/rtrg|top-fwz/.test(request.url())) return route.abort()
    if (!['GET', 'HEAD'].includes(request.method()) && target.origin === base.origin) {
      posts.push(target.pathname)
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
    }
    return route.continue()
  })
  const page = await context.newPage()
  await page.goto(url(path), { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForLoadState('load', { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(900)
  return { context, page, posts }
}

async function acceptCookie(page) {
  const button = page.locator('.cookie-banner-btn:visible').first()
  if (await button.count()) { await button.click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(500) }
}

async function fill(form) {
  for (const input of await form.locator('input:visible:not([type=checkbox]):not([type=radio]):not([type=submit]),textarea:visible').all()) {
    const type = await input.getAttribute('type')
    const rule = await input.getAttribute('data-tilda-rule')
    const value = type === 'email' || rule === 'email' ? 'qa@example.com' : type === 'tel' || rule === 'phone' ? '+375291112233' : rule === 'number' ? '123' : 'Проверка QA'
    await input.fill(value).catch(() => {})
  }
  for (const box of await form.locator('input[type=checkbox]').all()) await box.check({ force: true, timeout: 1500 }).catch(() => {})
}

async function checkForms(path, size) {
  const label = `${path} ${size[0]}`
  const { context, page, posts } = await open(path, size)
  try {
    await acceptCookie(page)
    let form = page.locator('form.tz-form:visible').first()
    if (await form.count()) {
      const submit = form.locator('button[type=submit]')
      await submit.click()
      await page.waitForTimeout(300)
      const required = await form.locator('input:invalid,textarea:invalid').count()
      if (required) record(`${label} форма: пустые поля не отправляются`, posts.length === 0)
      if (!(await form.getByText(SUCCESS).count())) {
        await fill(form)
        await submit.click()
        await form.getByText(SUCCESS).first().waitFor({ timeout: 5000 })
      }
      record(`${label} форма: успех после заполнения`, true)
    } else {
      form = page.locator('form.t-form:visible').first()
      if (!(await form.count())) {
        const trigger = page.locator('a[href^="#popup"]:visible,a[href^="#order"]:visible').first()
        if (await trigger.count()) { await trigger.click({ timeout: 3000 }); await page.waitForTimeout(600); form = page.locator('form.t-form:visible').first() }
      }
      if (!(await form.count())) { note(`${label} форма`, 'нет видимой формы на странице'); return }
      const submit = form.locator('[type=submit]:visible').first()
      const needsInput = await form.locator('[data-tilda-req="1"]').count()
      if (needsInput) {
        await submit.click()
        await page.waitForTimeout(300)
        record(`${label} форма: ошибка при пустых полях`, await form.locator('.js-errorbox-all').isVisible() && posts.length === 0)
      }
      await fill(form)
      await submit.click()
      await form.locator('.js-successbox').waitFor({ state: 'visible', timeout: 5000 })
      record(`${label} форма: успех после заполнения`, true)
    }
    if (preview) record(`${label} форма: запросов нет`, posts.length === 0, posts.join(','))
    if (size[0] === 390) fs.mkdirSync('docs/screens/2026-11-10-retest/forms-Claude', { recursive: true })
    if (size[0] === 390) await page.screenshot({ path: `docs/screens/2026-11-10-retest/forms-Claude/${path.replace(/\W+/g, '_')}-${browserName}${preview ? '-preview' : ''}.png` })
  } catch (error) {
    record(`${label} форма`, false, String(error).split('\n')[0])
  } finally { await context.close() }
}

async function checkModal(size) {
  const label = `окно безопасности ${size[0]}`
  const { context, page } = await open('/', size)
  try {
    await acceptCookie(page)
    await page.locator('a[href="#safety"]:visible').first().click({ timeout: 5000 })
    const dialog = page.locator('dialog#safety[open]')
    await dialog.waitFor({ timeout: 4000 })
    await page.waitForTimeout(500)
    const m = await dialog.evaluate((d) => { const r = d.getBoundingClientRect(); return { left: r.left, right: innerWidth - r.right, top: r.top, bottom: innerHeight - r.bottom, y: scrollY } })
    record(`${label}: по центру`, Math.abs(m.left - m.right) <= 2 && Math.abs(m.top - m.bottom) <= 2, JSON.stringify(m))
    await page.mouse.move(4, size[1] - 4)
    await page.mouse.wheel(0, 700)
    await page.waitForTimeout(400)
    record(`${label}: страница не прокручивается`, (await page.evaluate(() => scrollY)) === m.y)
    await page.locator('dialog#safety .modal__x').click()
    await dialog.waitFor({ state: 'hidden', timeout: 4000 })
    record(`${label}: крестик закрывает`, true)
    record(`${label}: прокрутка вернулась`, await page.evaluate(() => getComputedStyle(document.documentElement).overflowY !== 'hidden'))
  } catch (error) { record(label, false, String(error).split('\n')[0]) } finally { await context.close() }
}

async function checkMotion() {
  let { context, page } = await open('/', [390, 844])
  try {
    const name = await page.locator('.pf-cookie .tz__art').first().evaluate((e) => getComputedStyle(e).animationName).catch(() => 'нет плашки')
    record('cookie: появляется плавно', name === 'pf-cookie-in', name)
  } finally { await context.close() }
  ;({ context, page } = await open('/', [390, 844], { reducedMotion: 'reduce' }))
  try {
    const seconds = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.burger') || document.body).transitionDuration))
    record('уменьшение движения учтено', seconds < 0.01, String(seconds))
  } finally { await context.close() }
  ;({ context, page } = await open('/inventory', [1440, 900]))
  try {
    await acceptCookie(page)
    const tabs = page.locator('.t1281__tab[data-tab-rec-ids]')
    if ((await tabs.count()) < 2) { note('вкладки /inventory', 'меньше двух вкладок'); return }
    const recs = await tabs.evaluateAll((list) => list.map((t) => t.getAttribute('data-tab-rec-ids').split(',')[0].trim()))
    const isOff = (id) => page.locator('#rec' + id).evaluate((r) => r.classList.contains('t395__off'))
    const before = (await isOff(recs[0])) ? 1 : 0
    const next = before === 0 ? 1 : 0
    await tabs.nth(next).click()
    record('вкладки: старая гаснет плавно', await page.locator('#rec' + recs[before]).evaluate((r) => r.classList.contains('pf-fade-out')))
    await page.waitForTimeout(650)
    record('вкладки: новая показана', !(await isOff(recs[next])) && (await isOff(recs[before])))
  } catch (error) { record('вкладки', false, String(error).split('\n')[0]) } finally { await context.close() }
}

async function checkBuyLinks() {
  const summary = {}
  for (const path of COURSE_ROUTES) {
    const { context, page } = await open(path, [1440, 900])
    try {
      const links = await page.locator('a[href]').evaluateAll((list) => list
        .map((a) => ({ text: a.textContent.replace(/\s+/g, ' ').trim().slice(0, 40), href: a.href }))
        .filter((a) => /купить|оплат|приобрест|продлить|выбрать тариф/i.test(a.text)))
      summary[path] = links
      const bad = links.filter((a) => { const host = new URL(a.href).hostname; return !/lk\.popovichfit\.ru|^t\.me$|popovichfit\.ru$|127\.0\.0\.1|localhost|github\.io/.test(host) })
      record(`${path}: кнопки покупки ведут на платформу`, bad.length === 0, `${links.length} шт. ${JSON.stringify(bad.slice(0, 3))}`)
    } finally { await context.close() }
  }
  return summary
}

async function checkHovers(path) {
  const { context, page } = await open(path, [1440, 900])
  try {
    const abrupt = await page.evaluate(() => {
      const found = new Set()
      const visit = (list) => { for (const rule of list) {
        if (rule.media && !matchMedia(rule.media.mediaText).matches) continue
        if (rule.cssRules && !rule.selectorText) { visit(rule.cssRules); continue }
        if (!rule.selectorText?.includes(':hover')) continue
        const props = [...rule.style].filter((name) => !['cursor', 'pointer-events'].includes(name))
        if (!props.length) continue
        for (const selector of rule.selectorText.split(',')) {
          if (!selector.includes(':hover')) continue
          let elements = []
          try { elements = [...document.querySelectorAll(selector.replace(/:hover/g, '').replace(/::?(before|after)/g, '').trim() || '*')].slice(0, 4) } catch { continue }
          for (const element of elements) {
            const style = getComputedStyle(element, /::?before/.test(selector) ? '::before' : /::?after/.test(selector) ? '::after' : undefined)
            if (Math.max(...style.transitionDuration.split(',').map(parseFloat)) === 0) { found.add(selector.trim().slice(0, 80) + ' {' + props.slice(0, 3).join(',') + '}'); break }
          }
        }
      } }
      for (const sheet of document.styleSheets) { try { visit(sheet.cssRules) } catch {} }
      return [...found]
    })
    record(`${path}: все наведения плавные`, abrupt.length === 0, abrupt.length ? `${abrupt.length}: ${abrupt.slice(0, 12).join(' | ')}` : '')
  } finally { await context.close() }
}

async function checkPopups(path) {
  const { context, page } = await open(path, [1440, 900])
  try {
    await acceptCookie(page)
    const hrefs = await page.locator('a[href^="#popup"],a[href^="#zeropopup"]').evaluateAll((list) => [...new Set(list.filter((a) => a.offsetParent).map((a) => a.getAttribute('href')))].slice(0, 8))
    const dataOpen = await page.locator('[data-open]').evaluateAll((list) => [...new Set(list.filter((a) => a.offsetParent).map((a) => a.dataset.open))].slice(0, 4))
    if (!hrefs.length && !dataOpen.length) { note(`${path}: попапы`, 'на странице нет'); return }
    const shown = page.locator('.pf-modal__box:visible,dialog[open]').first()
    for (const [kind, value] of [...hrefs.map((h) => ['href', h]), ...dataOpen.map((d) => ['data-open', d])]) {
      const name = `${path}: окно ${value}`
      try {
        await page.locator(`[${kind}="${value}"]`).first().evaluate((el) => el.click())
        await shown.waitFor({ state: 'visible', timeout: 4000 })
        const content = await shown.evaluate((box) => ({ text: box.innerText.trim().length, media: box.querySelectorAll('img,iframe,video,.tz__art,.t-bgimg,[style*="background-image"]').length, broken: [...box.querySelectorAll('img')].filter((i) => i.complete && !i.naturalWidth && i.src).length }))
        record(name, (content.text > 0 || content.media > 0) && content.broken === 0, JSON.stringify(content))
        await page.keyboard.press('Escape')
        await shown.waitFor({ state: 'hidden', timeout: 4000 })
        await page.waitForTimeout(400)
      } catch (error) { record(name, false, String(error).split('\n')[0]) ; await page.keyboard.press('Escape').catch(() => {}); await page.waitForTimeout(500) }
    }
  } finally { await context.close() }
}

async function checkArticles() {
  const { context, page } = await open('/media', [390, 844])
  let articles = []
  try {
    articles = await page.locator('a[href]').evaluateAll((list, origin) => [...new Set(list.map((a) => new URL(a.href)).filter((u) => u.origin === origin).map((u) => u.pathname))], base.origin)
  } finally { await context.close() }
  const prefix = base.pathname.replace(/\/$/, '')
  articles = articles.map((a) => a.slice(prefix.length) || '/').filter((a) => /^\/(media_|mediah|mif)/.test(a))
  record('статьи: список на /media', articles.length > 0, String(articles.length))
  for (const path of articles) {
    const { context: ctx, page: p } = await open(path, [390, 844])
    try {
      await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)) } })
      await p.waitForTimeout(500)
      const s = await p.evaluate(() => ({ text: document.body.innerText.length, overflow: document.documentElement.scrollWidth > innerWidth + 2, broken: [...document.images].filter((i) => i.complete && !i.naturalWidth && i.src).length }))
      record(`статья ${path}`, s.text > 300 && !s.overflow && s.broken === 0, JSON.stringify(s))
    } finally { await ctx.close() }
  }
}

const buyLinks = preview ? null : await checkBuyLinks()
for (const path of ['/', '/course_correction', '/course_power', '/about', '/results', '/media', '/community', '/taplink', '/inventory']) await checkHovers(path)
for (const path of ['/', '/course_correction', '/course_power', '/results', '/about', '/community', '/inventory', '/sertif', '/taplink']) await checkPopups(path)
await checkArticles()
for (const size of WIDTHS) await checkModal(size)
await checkMotion()
for (const path of FORM_ROUTES) for (const size of WIDTHS) await checkForms(path, size)
await browser.close()

const failed = results.filter((r) => r.ok === false)
console.log(`\nИтог ${browserName}${preview ? ' превью' : ''}: ${results.filter((r) => r.ok).length} ок, ${failed.length} ошибок, ${results.filter((r) => r.ok === null).length} не применимо`)
if (reportFile) fs.writeFileSync(reportFile, JSON.stringify({ browser: browserName, preview, results, buyLinks }, null, 2))
process.exit(failed.length ? 1 : 0)
