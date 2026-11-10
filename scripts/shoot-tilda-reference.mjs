// Скрины живого сайта на Тильде: основные страницы, компьютер и телефон парами, плюс страница-витрина.
// Запуск: node scripts/shoot-tilda-reference.mjs [папка] [--only /a,/b] [--resume: только то, что ещё не снято]. Только чтение, по одной странице за раз.
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const BASE = 'https://popovichfit.ru'
const argv = process.argv.slice(2)
const onlyAt = argv.indexOf('--only')
const only = onlyAt >= 0 ? argv[onlyAt + 1].split(',') : null
const resume = argv.includes('--resume')
const OUT = path.resolve(argv[0] && !argv[0].startsWith('--') ? argv[0] : 'work/tilda-screens-2026-11-10')
const SECTIONS = [
  ['Основные страницы и меню', [['/', 'Главная'], ['/course_correction', 'Курс Коррекция'], ['/course_power', 'Курс Силовой'], ['/about', 'О тренере'], ['/community', 'Сообщество'], ['/support', 'Служба заботы']]],
  ['Отзывы и результаты', [['/results', 'До/после, результаты участниц']]],
  ['Статьи', [['/media', 'Статьи, POPOVICH media'], ['/media_1_otek', 'Отёки и целлюлит'], ['/media_gluteal_muscles', 'Ягодичные мышцы'], ['/media_kor', 'Кор'], ['/media_mtd2', 'Тазовое дно'], ['/mediah', 'Холка'], ['/diet_analysis', 'Анализ рациона'], ['/mif', 'Фитнес-мифы']]],
  ['Документы из подвала', [['/oferta', 'Договор-оферта'], ['/part_oferta', 'Партнёрское соглашение'], ['/privacy', 'Политика обработки персональных данных'], ['/data-consent', 'Согласие на обработку данных'], ['/consent', 'Согласие на рассылку'], ['/doc_l', 'Документы']]],
  ['Страницы для приложений', [['/delete', 'Удалить аккаунт'], ['/m', 'Восстановить пароль'], ['/ogin1', 'Вход в аккаунт'], ['/error-auth', 'Ошибка авторизации'], ['/members/signup', 'Регистрация'], ['/taplink', 'Быстрая навигация']]],
]
const slug = (r) => r === '/' ? 'home' : r.replace(/\W+/g, '_').replace(/^_/, '')
const PROFILES = { desk: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }, mob: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } }
fs.mkdirSync(OUT, { recursive: true })
const manifestFile = path.join(OUT, 'manifest.json')
const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : {}
let browser = await chromium.launch()
// браузер упал или закрыт извне: поднимаем заново, прогресс сохранён в manifest
const ensureBrowser = async () => { if (!browser.isConnected()) browser = await chromium.launch() }

async function shoot(route, kind) {
  await ensureBrowser()
  const context = await browser.newContext(PROFILES[kind])
  const page = await context.newPage()
  try {
    const response = await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(3000)
    // контент должен прогрузиться: прокрутка до конца и обратно, ожидание сети, картинок и появления блоков
    const pass = (stepShare, pause) => page.evaluate(async ([share, wait]) => {
      const step = Math.round(innerHeight * share)
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) { scrollTo(0, y); await new Promise((r) => setTimeout(r, wait)) }
    }, [stepShare, pause])
    await pass(0.5, 350)
    await page.waitForTimeout(2000)
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
    const pendingList = () => page.evaluate(() => {
      const shown = (e) => { const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2 && getComputedStyle(e).visibility !== 'hidden' }
      const low = (u) => /resize\/\d{1,2}x|-\/blur\//.test(u || '')
      const imgs = [...document.images].filter((i) => shown(i) && (!i.complete || i.naturalWidth === 0 || low(i.currentSrc)))
      const bgs = [...document.querySelectorAll('[data-original]')].filter((e) => e.tagName !== 'IMG' && shown(e) && (!getComputedStyle(e).backgroundImage.includes('url(') || low(getComputedStyle(e).backgroundImage)))
      window.__pending = [...imgs, ...bgs]
      return window.__pending.length
    })
    let pending = await pendingList()
    for (let round = 0; round < 3 && pending > 0; round++) {
      await page.evaluate(async () => { for (const e of window.__pending.slice(0, 80)) { e.scrollIntoView({ block: 'center' }); await new Promise((r) => setTimeout(r, 350)) } })
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
      await page.waitForTimeout(1500)
      pending = await pendingList()
    }
    await page.evaluate(() => scrollTo(0, 0))
    await page.waitForTimeout(2500)
    await page.evaluate(() => document.fonts.ready)
    // служебное поверх страницы не снимаем: окно куки и кнопка чата; плавающая «Назад» это элемент страницы, её оставляем
    await page.evaluate(() => {
      for (const e of document.querySelectorAll('body *')) {
        const c = getComputedStyle(e)
        if (c.position !== 'fixed') continue
        const t = e.textContent || ''
        const r = e.getBoundingClientRect()
        if (/использует куки|cookie/i.test(t) && r.height < 500) e.style.display = 'none'
        if (/Тех\. поддержка/.test(t) && r.width < 300) e.style.display = 'none'
      }
      for (const e of document.querySelectorAll('[class*="sender" i],[id*="sender" i],iframe[src*="senndder"]')) e.style.display = 'none'
    })
    await page.waitForTimeout(300)
    const height = await page.evaluate(() => document.documentElement.scrollHeight)
    const file = `${slug(route)}-${kind}.jpg`
    const dpr = PROFILES[kind].deviceScaleFactor
    await page.screenshot({ path: path.join(OUT, file), fullPage: true, type: 'jpeg', quality: 80, scale: height * dpr > 16000 ? 'css' : 'device' })
    return { file, status: response?.status() ?? 0, height, final: page.url(), pending }
  } finally { await context.close() }
}

let failed = 0
for (const [, list] of SECTIONS) for (const [route] of list) {
  if (only && !only.includes(route)) continue
  for (const kind of ['desk', 'mob']) {
    if (resume && manifest[`${route} ${kind}`]) continue
    let result
    for (let attempt = 1; attempt <= 2 && !result; attempt++) {
      try { result = await shoot(route, kind) } catch (e) { console.log('сбой', route, kind, String(e).split('\n')[0]); await new Promise((r) => setTimeout(r, 5000)) }
    }
    if (!result) { failed++; continue }
    manifest[`${route} ${kind}`] = result
    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 1))
    console.log(route, kind, result.status, result.height, 'не прогрузилось', result.pending, result.final === BASE + route ? '' : result.final)
    await new Promise((r) => setTimeout(r, 2000))
  }
}
await browser.close()
fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 1))

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const shot = (route, kind, label) => {
  const m = manifest[`${route} ${kind}`]
  if (!m) return `<div class="shot none">${label}: не снято</div>`
  return `<a class="shot ${kind}" href="${m.file}" target="_blank"><span>${label}${m.pending ? `, не прогрузилось картинок: ${m.pending}` : ''}</span><img src="${m.file}" alt="${label}" loading="lazy"></a>`
}
const body = SECTIONS.map(([title, list]) => `<section><h2>${esc(title)}</h2>${list.map(([route, name]) => `<article><h3>${esc(name)} <a href="${BASE}${route}" target="_blank">${BASE.replace('https://', '')}${route}</a></h3><div class="pair">${shot(route, 'desk', 'Компьютер, 1440')}${shot(route, 'mob', 'Телефон, 390')}</div></article>`).join('')}</section>`).join('')
fs.writeFileSync(path.join(OUT, 'Тильда-страницы-деск-мобилка.html'), `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PopovichFit: страницы Тильды</title><style>
:root{--bg:#f6f6f8;--card:#fff;--ink:#222;--muted:#70727c;--line:#e4e4ea;--accent:#5c6fd0}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}
main{max-width:1180px;margin:0 auto;padding:32px 16px 64px}h1{font-size:28px;margin:0 0 6px}p{margin:0 0 28px;color:var(--muted)}
h2{font-size:22px;margin:40px 0 14px}h3{font-size:16px;margin:0 0 12px;display:flex;flex-wrap:wrap;gap:4px 12px;align-items:baseline}h3 a{font-weight:400;font-size:14px;color:var(--accent);overflow-wrap:anywhere}
article{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:14px}
.pair{display:grid;grid-template-columns:minmax(0,3fr) minmax(0,1fr);gap:14px}.shot{display:block;color:var(--muted);font-size:13px;text-decoration:none;min-width:0}.shot span{display:block;margin-bottom:6px}
.shot img{display:block;width:100%;height:520px;object-fit:cover;object-position:top;border:1px solid var(--line);border-radius:8px;background:#eee}
.none{padding:24px;background:#fbeeee;border-radius:8px}
@media(max-width:640px){.pair{grid-template-columns:minmax(0,1fr)}.shot img{height:360px}}
</style></head><body><main><h1>PopovichFit: страницы сайта на Тильде</h1><p>Снято с popovichfit.ru 10.11.2026. Нажмите на скрин, чтобы открыть его целиком.</p>${body}</main></body></html>`)
console.log(`снято ${Object.keys(manifest).length}, не снято ${failed}`)
process.exitCode = failed ? 1 : 0
