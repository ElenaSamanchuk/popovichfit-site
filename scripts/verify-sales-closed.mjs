// Запуск на локальном Nitro при SALES_OPEN=false:
// node scripts/verify-sales-closed.mjs http://127.0.0.1:3100
import { chromium } from 'playwright'

const base = new URL(process.argv[2] ?? 'http://127.0.0.1:3100')
if (base.hostname !== '127.0.0.1' && base.hostname !== 'localhost') {
  throw new Error('Для этой проверки нужен локальный сервер')
}

const params = '?r=qa123&utm_source=local-qa'
const results = []
const record = (label, ok, details) => results.push({ label, ok: Boolean(ok), details })
const browser = await chromium.launch()

try {
  for (const [source, target] of [['/pred', '/'], ['/predcor', '/course_correction'], ['/predpow', '/course_power']]) {
    const response = await fetch(new URL(source + params, base), { redirect: 'manual' })
    const location = response.headers.get('location')
    const destination = location && new URL(location, base)
    record(`${source} закрытые продажи`, response.status === 302 && destination?.pathname === target
      && destination?.search === params, { status: response.status, location })
  }
  const sitemap = await fetch(new URL('/sitemap.xml', base)).then(response => response.text())
  record('sitemap без закрытых продаж', sitemap.includes('<urlset') && !/\/pred(?:cor|pow)?<\/loc>/.test(sitemap))

  for (const width of [390, 1440]) {
    for (const path of ['/', '/open', '/close']) {
      const phone = width === 390
      const context = await browser.newContext({
        viewport: { width, height: 844 }, isMobile: phone, hasTouch: phone, deviceScaleFactor: phone ? 3 : 1,
      })
      const analytics = []
      const label = `${path} ${width}`
      try {
        await context.route('**/*', route => {
          const url = new URL(route.request().url())
          if (url.origin === base.origin) return route.continue()
          if (url.hostname === 'mc.yandex.ru' || url.hostname === 'vk.com') analytics.push(url.hostname)
          return route.fulfill({ status: 204 })
        })
        const page = await context.newPage()
        await page.goto(new URL(path + params + '#safety', base).href)
        const dialog = page.locator('dialog#safety[open]')
        await dialog.waitFor({ timeout: 5000 })
        record(`${label} окно по прямой ссылке`, await dialog.isVisible())
        await page.keyboard.press('Escape')
        await dialog.waitFor({ state: 'hidden', timeout: 5000 })
        await page.locator('a[href="#safety"]:visible').first().click({ timeout: 5000 })
        record(`${label} окно из карточки`, await dialog.isVisible())
        await page.keyboard.press('Escape')
        await dialog.waitFor({ state: 'hidden', timeout: 5000 })
        const faq = page.locator('details.qa').filter({ hasText: 'беременным?' }).first()
        await faq.locator('summary').click({ timeout: 5000 })
        const answer = (await faq.textContent()).replace(/\s+/g, ' ')
        record(`${label} актуальный ответ FAQ`, answer.includes('Можно в беременность'))
        const links = await page.locator('a[href*="/predcor"],a[href*="/course_correction"]')
          .evaluateAll(anchors => anchors.map(anchor => anchor.href))
        record(`${label} атрибуция в ссылках`, links.some(href => {
          const search = new URL(href).searchParams
          return search.get('r') === 'qa123' && search.get('utm_source') === 'local-qa'
        }))
        await page.waitForTimeout(2200) // Счётчики планировали загрузку с задержкой 2 секунды.
        record(`${label} счётчики на localhost`, analytics.length === 0, analytics)
      } catch (error) {
        record(`${label} выполнение`, false, String(error).split('\n')[0])
      } finally {
        await context.close()
      }
    }
  }
} finally {
  await browser.close()
}
console.log(JSON.stringify(results, null, 2))
process.exitCode = Number(results.some(result => !result.ok))
