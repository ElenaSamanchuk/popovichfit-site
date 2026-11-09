#!/usr/bin/env node
/** Проверка страниц продаж в режиме «открыто» (нужна сборка с SALES_OPEN=true): #safety, FAQ, выбор тарифа → цена и ссылка, якорь #tariff, ссылки покупки на lk.popovichfit.ru.
 *  node scripts/verify-sales-open.mjs [--base http://127.0.0.1:3100]  — код выхода 1 при ошибке. Формы не отправляются, по ссылкам покупки не переходим (читаем href). */
import { chromium } from 'playwright'
import fs from 'node:fs'
const i = process.argv.indexOf('--base'); const base = i > 0 ? process.argv[i + 1] : 'http://127.0.0.1:3100'
const pageFile = { '/predcor': 'page41134729', '/predpow': 'page41134747' }
let fails = 0
const ok = (c, t) => { console.log(`${c ? 'ок    ' : 'ОШИБКА'} ${t}`); if (!c) fails++ }
const b = await chromium.launch()
for (const url of ['/predcor', '/predpow']) for (const w of [1440, 390]) {
  const data = JSON.parse(fs.readFileSync(`app/data/tilda/${pageFile[url]}.json`, 'utf8'))
  const ctx = await b.newContext({ viewport: { width: w, height: w < 600 ? 844 : 900 }, locale: 'ru-RU', hasTouch: w < 600, isMobile: w < 600 }); const p = await ctx.newPage()
  const errs = []; p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)) }); p.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(base)) errs.push(r.status() + ' ' + r.url().slice(0, 100)) })
  await p.goto(base + url, { waitUntil: 'load' }); await p.waitForTimeout(2500)
  const tag = `${url} ${w}`
  // якорь #tariff
  const anchor = await p.evaluate(async () => { const a = document.querySelector('a[href="#tariff"]'); const t = document.getElementById('tariff'); if (!a || !t) return { found: false }; const el = a.closest('[class*=tz__el]') || a; el.scrollIntoView({ block: 'center' }); await new Promise((r) => setTimeout(r, 400)); a.click(); await new Promise((r) => setTimeout(r, 1500)); return { found: true, top: Math.round(t.getBoundingClientRect().top), y: Math.round(scrollY) } })
  ok(anchor.found && anchor.y > 300 && Math.abs(anchor.top) < 200, `${tag}: клик по #tariff прокручивает к тарифам (метка в ${anchor.top} px от верха экрана, scrollY ${anchor.y})`)
  // тарифы: выбор варианта, цена и ссылка
  const cards = await p.$$('.pf-card'); ok(cards.length > 0, `${tag}: карточек тарифов ${cards.length}`)
  const pfData = data.pfCards || {}
  const all = Object.values(pfData).flatMap((c) => c.options)
  for (const [ci, card] of cards.entries()) {
    const opts = await card.$$('.pf-option'); if (opts.length < 2) continue
    for (let oi = 0; oi < opts.length; oi++) {
      await opts[oi].scrollIntoViewIfNeeded(); await opts[oi].click({ timeout: 5000 }).catch(() => {}); await p.waitForTimeout(250)
      const st = await card.evaluate((c) => { const price = [...c.querySelectorAll('[class*=pf-price]')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean); const a = c.querySelector('a[href*="lk.popovichfit.ru"]') || c.parentElement?.querySelector('a[href*="lk.popovichfit.ru"]'); return { price, href: a ? a.getAttribute('href') : null, active: [...c.querySelectorAll('.pf-option')].findIndex((e) => e.classList.contains('pf-active')) } })
      const known = st.href ? all.some((o) => o.link === st.href) : false
      ok(st.active === oi && !!st.href && st.href.startsWith('https://lk.popovichfit.ru/') && known, `${tag}: карточка ${ci + 1}, вариант ${oi + 1}: активен, цена «${st.price.slice(0, 3).join(' | ')}», ссылка ${st.href} ${known ? '(есть в данных страницы)' : '(НЕТ в данных страницы)'}`)
    }
  }
  // кнопки покупки: ссылки на lk.popovichfit.ru
  const buy = await p.$$eval('a[href*="/payments/"]', (as) => as.map((a) => a.href))
  ok(buy.length > 0 && buy.every((h) => h.startsWith('https://lk.popovichfit.ru/payments/')), `${tag}: ссылок покупки ${buy.length}, все на lk.popovichfit.ru`)
  // FAQ (T585): первая запись раскрывается и сворачивается; ссылка #safety лежит внутри ответа, поэтому нужная запись раскрывается и по ней открывается окно
  const faqState = (idx) => p.evaluate((idx) => { const it = [...document.querySelectorAll('.t585__accordion')][idx]; if (!it) return null; const c = it.querySelector('.t585__content'); return c ? Math.round(c.getBoundingClientRect().height) : -1 }, idx)
  const faqClick = async (idx) => { await p.evaluate((idx) => { const it = [...document.querySelectorAll('.t585__accordion')][idx]; it.scrollIntoView({ block: 'center' }) }, idx); await p.waitForTimeout(300); await p.locator('.t585__header').nth(idx).click({ force: true }); await p.waitForTimeout(900) }
  const n = await p.locator('.t585__accordion').count()
  const h0 = await faqState(0); await faqClick(0); const h1 = await faqState(0); await faqClick(0); const h2 = await faqState(0)
  ok(n > 0 && h1 > h0 + 5 && h2 < h1, `${tag}: FAQ (${n} записей): первая раскрывается и сворачивается (высота ответа ${h0} > ${h1} > ${h2})`)
  // #safety
  const idx = await p.evaluate(() => [...document.querySelectorAll('.t585__accordion')].findIndex((e) => e.querySelector('a[href="#safety"]')))
  const vis = () => p.evaluate(() => { const e = document.getElementById('safety'); if (!e) return { exists: false }; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { exists: true, open: e.open, shown: e.open && cs.display !== 'none' && r.width > 50 && r.height > 50 } })
  const before = await vis()
  await faqClick(idx)
  await p.locator('a[href="#safety"]:visible').first().click({ timeout: 5000 }).catch(() => {}); await p.waitForTimeout(700)
  const opened = await vis()
  ok(idx >= 0 && opened.exists && opened.shown && !before.shown, `${tag}: #safety (в записи FAQ №${idx + 1}) закрыт, открывается по клику на ссылку (до: ${before.shown}, после: ${opened.shown})`)
  await p.keyboard.press('Escape'); await p.waitForTimeout(600)
  let closed = await vis()
  if (closed.shown) { const x = p.locator('#safety button, #safety [class*=close]').first(); if (await x.count()) { await x.click({ force: true }).catch(() => {}); await p.waitForTimeout(600); closed = await vis() } }
  ok(!closed.shown, `${tag}: #safety закрывается (Esc), прокрутка страницы возвращена: overflow='${await p.evaluate(() => document.documentElement.style.overflow)}'`)
  // повторное открытие и закрытие крестиком / подложкой
  await p.locator('a[href="#safety"]:visible').first().click({ timeout: 5000 }).catch(() => {}); await p.waitForTimeout(600)
  const re = await vis()
  await p.mouse.click(5, 5); await p.waitForTimeout(600)
  const closed2 = await vis()
  ok(re.shown && !closed2.shown, `${tag}: #safety открывается повторно и закрывается кликом по подложке (${re.shown} → ${closed2.shown})`)
  ok(errs.length === 0, `${tag}: ошибок консоли/ответов 400+: ${errs.length} ${errs.slice(0, 2).join(' ; ')}`)
  await ctx.close()
}
await b.close()
console.log(fails ? `\nИТОГ: ОШИБОК ${fails}` : '\nИТОГ: всё в порядке'); process.exit(fails ? 1 : 0)
