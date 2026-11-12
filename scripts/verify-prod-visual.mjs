#!/usr/bin/env node
// Визуальная проверка боевого сайта против эталона Тильды (old-site/*.html через file://).
// Только чтение: формы не отправляются, на сервер никто не заходит, в проекте ничего не меняется.
// Запуск: nice -n 10 node scripts/verify-prod-visual.mjs [base=https://popovichfit.ru] [--only /a,/b]
//         [--fast] (без попапов в эталоне) [--no-ref] (без эталона) [--chromium] (встроенный Chromium вместо Chrome)
//         [--profiles desk,mob] [--out work/prod-check-2026-11-12]
// Код возврата: 0 — проблем H/M нет; 1 — найдены проблемы; 2 — сбой запуска.
// Один браузер, одна страница за раз, без записи видео.
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const flag = (n) => argv.includes(n)
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d }
const BASE = (argv.find((a) => /^https?:\/\//.test(a)) || 'https://popovichfit.ru').replace(/\/$/, '')
const OUT = path.resolve(ROOT, opt('--out', 'work/prod-check-2026-11-12'))
const ISSUES = path.join(OUT, 'issues')
const ONLY = opt('--only', '') ? opt('--only', '').split(',').map((s) => s.trim()).filter(Boolean) : null
const NO_REF = flag('--no-ref'), FAST = flag('--fast')
const PROF_FILTER = opt('--profiles', '') ? opt('--profiles', '').split(',') : null
fs.mkdirSync(ISSUES, { recursive: true })

// ---------- карта страниц ----------
const pagesTs = fs.readFileSync(path.join(ROOT, 'app/data/pages.ts'), 'utf8')
const PAGES = new Map() // url -> {key, published}
for (const m of pagesTs.matchAll(/"([^"]+\.html)": \{ url: "([^"]*)"[^\n]*?published: (true|false)/g)) PAGES.set(m[2] || '/', { key: m[1], published: m[3] === 'true' })

const LAYOUT = ['/', '/course_correction', '/course_power', '/results', '/media', '/about', '/community', '/support', '/sertif',
  '/oferta', '/part_oferta', '/privacy', '/data-consent', '/consent', '/doc_l',
  '/delete', '/m', '/ogin1', '/error-auth', '/members/signup', '/taplink',
  '/media_1_otek', '/media_gluteal_muscles', '/media_kor', '/media_mtd2', '/mediah', '/diet_analysis', '/mif', '/page01', '/page03']
const INVENTORY = ['/inventory', '/inventory1', '/inventar', '/inv_corr', '/inv_pow']
const SALES = ['/korrekciya-new', '/silovye-new', '/course_corprod', '/course_powprod', '/course_prod', '/new-course', '/close', '/open', '/pred', '/gift1']
const VIDEO_PAGES = ['/warmup', '/nutric', '/nutric-lk', '/health', '/regime', '/eating', '/ifrtaping', '/max', '/bonus1', '/bonus2', '/bonus3', '/bonus4', '/bonus5', '/bonus6',
  '/body', '/knees', '/eat', '/ifr', '/lifestyle', '/popovichlec', '/taping', '/before',
  ...[...PAGES.keys()].filter((u) => u.startsWith('/guest_'))]
const DIARY = [...PAGES.keys()].filter((u) => /^\/(\d+day|cor\d+|pow\d+|20cor\d+|20pow\d+)$/.test(u))

const PROFILES = {
  desk: { w: 1440, h: 900, mobile: false }, mob: { w: 390, h: 844, mobile: true },
  m360: { w: 360, h: 780, mobile: true }, m412: { w: 412, h: 915, mobile: true },
}
const BASIC = ['desk', 'mob'], WIDE = ['desk', 'mob', 'm360', 'm412']
const plan = []
const addPlan = (urls, profs, mode) => urls.forEach((u) => plan.push({ url: u, profs, mode }))
addPlan(LAYOUT, BASIC, 'full'); addPlan(INVENTORY, WIDE, 'full'); addPlan(SALES, WIDE, 'full'); addPlan(VIDEO_PAGES, BASIC, 'full')
addPlan(DIARY, ['desk'], 'video')
const planned = ONLY ? ONLY.map((u) => plan.find((p) => p.url === u) || { url: u, profs: BASIC, mode: 'full' }) : plan

// ---------- общие вещи ----------
const slug = (u) => (u === '/' ? 'home' : u.replace(/^\//, '').replace(/\W+/g, '_'))
const VID_RE = /kinescope\.io\\?\/embed\\?\/([\w-]{8,})|player\.vimeo\.com\\?\/video\\?\/(\d+)|youtube(?:-nocookie)?\.com\\?\/embed\\?\/([\w-]{8,})/g
const vidIds = (txt) => { const s = new Map(); for (const m of txt.matchAll(VID_RE)) { const id = m[1] || m[2] || m[3]; s.set(id, m[1] ? 'kinescope' : m[2] ? 'vimeo' : 'youtube') } return s }
const ERR = /недоступ|ошибк|error|not available|unavailable|forbidden|не найден|not found|private|приватн|домен|domain/i
const problems = [], pageStates = [], notes = []
const videos = new Map() // id -> {kind,status,detail,where:Set}
const refVideos = new Map()
const addProblem = (p) => { problems.push(p); console.log(`  [${p.sev}] ${p.page} ${p.profile}: ${p.what}`) }
const ssPath = (page, prof, what) => path.join(ISSUES, `${slug(page)}-${prof}-${what}.png`)
const rel = (p) => path.relative(ROOT, p)

const launch = async () => {
  const args = { headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] }
  if (!flag('--chromium')) { try { return await chromium.launch({ ...args, channel: 'chrome' }) } catch { notes.push('Chrome не найден, использован встроенный Chromium (возможны ложные «видео не играет» из-за кодеков)') } }
  return chromium.launch(args)
}

const PAGE_METRICS = () => {
  const cw = document.documentElement.clientWidth
  const blocks = [...document.querySelectorAll('[id^=rec]')].filter((e) => /^rec\d+$/.test(e.id) && !e.parentElement.closest('[id^=rec]')).map((e) => {
    const r = e.getBoundingClientRect()
    return { id: e.id, top: Math.round(r.top + scrollY), h: Math.round(r.height), has: !!e.querySelector('img,iframe,video,svg,canvas,.tn-atom') || (e.innerText || '').trim().length > 0 }
  })
  const over = []
  for (const e of document.querySelectorAll('body *')) {
    if (over.length >= 3) break
    const r = e.getBoundingClientRect()
    if (r.width > 0 && r.right > cw + 2 && getComputedStyle(e).position !== 'fixed') over.push(`${e.tagName}#${e.id}.${String(e.className).slice(0, 30)} right=${Math.round(r.right)}`)
  }
  const foot = document.querySelector('.foot')
  return { cw, docH: document.documentElement.scrollHeight, ox: document.documentElement.scrollWidth - cw, over, blocks,
    footH: foot ? Math.round(foot.getBoundingClientRect().height) : null, title: document.title, text: (document.body.innerText || '').trim().slice(0, 120).replace(/\s+/g, ' ') }
}

// Измерение открытого попапа (и Тильды .t-popup_show, и боевого fixed-оверлея)
const POPUP_MEASURE = async () => {
  const cw = document.documentElement.clientWidth, vh = innerHeight
  const shown = (e) => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.05 && r.width > 0 && r.height > 0 }
  let root = [...document.querySelectorAll('.t-popup_show')].pop()
  if (!root) root = [...document.querySelectorAll('body *')].filter((e) => { const s = getComputedStyle(e); if (s.position !== 'fixed' || (parseInt(s.zIndex) || 0) < 1000) return false; const r = e.getBoundingClientRect(); return r.width >= cw - 2 && r.height >= vh - 2 && shown(e) }).pop()
  if (!root) return null
  const whites = [...root.querySelectorAll('*')].filter((e) => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return r.width > 150 && r.height > 150 && /rgb\(255, 255, 255\)/.test(s.backgroundColor) && parseFloat(s.borderTopLeftRadius) > 2 && shown(e) })
  whites.sort((a, b) => b.getBoundingClientRect().height * b.getBoundingClientRect().width - a.getBoundingClientRect().height * a.getBoundingClientRect().width)
  let card = whites[0], via = 'white'
  if (!card) { card = root.querySelector('.t-popup__container') || root.querySelector('.min-h-full')?.firstElementChild; via = 'container' }
  if (!card) return { via: 'none', scrollable: root.scrollHeight > root.clientHeight + 2, hasIframe: !!root.querySelector('iframe') }
  const box = () => { const r = card.getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width), t: Math.round(r.top), b: Math.round(r.bottom), h: Math.round(r.height) } }
  const c0 = box()
  const closeEl = root.querySelector('.t-popup__close') || root.querySelector('button')
  const closeInfo = () => { if (!closeEl) return { found: false }; const r = closeEl.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2
    const top = document.elementFromPoint(cx, cy); return { found: true, inView: r.width > 0 && r.left >= -1 && r.right <= cw + 1 && r.top >= -1 && r.bottom <= vh + 1, free: !!top && (closeEl === top || closeEl.contains(top)) } }
  const close0 = closeInfo()
  const scrollable = root.scrollHeight > root.clientHeight + 2
  root.scrollTop = 1e6; await new Promise((r) => setTimeout(r, 250))
  const c1 = box(); const close1 = closeInfo()
  const maxScroll = root.scrollTop
  root.scrollTop = 0
  return { via, card: c0, gapL: c0.l, gapR: cw - c0.r, cw, vh, scrollable, maxScroll, bottomAfter: c1.b, close0, close1, hasIframe: !!root.querySelector('iframe') }
}

const rootGone = (page) => page.evaluate(() => { const cw = document.documentElement.clientWidth, vh = innerHeight
  if ([...document.querySelectorAll('.t-popup_show')].length) return false
  return ![...document.querySelectorAll('body *')].some((e) => { const s = getComputedStyle(e); if (s.position !== 'fixed' || (parseInt(s.zIndex) || 0) < 1000) return false; const r = e.getBoundingClientRect(); return r.width >= cw - 2 && r.height >= vh - 2 && s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.05 }) })

async function closePopup(page) {
  await page.keyboard.press('Escape').catch(() => {}); await page.waitForTimeout(500)
  if (await rootGone(page)) return true
  await page.evaluate(() => { const x = [...document.querySelectorAll('.t-popup__close, .t-popup_show button, [class*=z-\\[100000\\]] button')].find((e) => e.getBoundingClientRect().width > 0); x && x.click() }).catch(() => {})
  await page.waitForTimeout(700)
  return rootGone(page)
}

async function loadPage(ctx, url, wait = 2500) {
  const page = await ctx.newPage(); const log = { cons: [], bad: [], third: [] }
  page.on('console', (m) => { if (m.type() === 'error') log.cons.push(m.text().slice(0, 200)) })
  page.on('pageerror', (e) => log.cons.push('pageerror: ' + String(e.message).slice(0, 200)))
  page.on('response', (r) => { const st = r.status(); if (st >= 400) { const u = r.url(); const mine = u.startsWith(BASE) || /kinescope|vimeo|youtube/.test(u); (mine ? log.bad : log.third).push(`${st} ${u.slice(0, 140)}`) } })
  let status = 0
  try { const r = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }); status = r ? r.status() : 0 } catch (e) { log.cons.push('goto: ' + e.message.slice(0, 120)) }
  await page.waitForTimeout(wait)
  for (const t of ['Согласен', 'Принять', 'OK']) { const c = page.getByText(t, { exact: true }).first(); if (await c.isVisible().catch(() => false)) { await c.click().catch(() => {}); break } }
  await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 450) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)) } scrollTo(0, 0) }).catch(() => {})
  await page.waitForTimeout(800)
  return { page, log, status }
}

// ---------- видео ----------
async function probeHandle(page, h, kind = '') {
  // Реальное воспроизведение в автоматизации Kinescope не стартует (проверено вручную: плеер готов, readyState 4, клик не запускает),
  // поэтому «работает» = кадр плеера загрузился, есть <video>, манифест/конфиг ответил 2xx, ошибок нет; рост currentTime — бонус (ok-play).
  const net = []
  const onResp = (r) => { const u = r.url(); if (/kinescope|vimeo|youtube|\.m3u8|\.mpd/.test(u)) net.push({ st: r.status(), u }) }
  page.on('response', onResp)
  try {
    await h.scrollIntoViewIfNeeded().catch(() => {})
    const fr = await h.contentFrame().catch(() => null)
    const info = () => fr ? fr.evaluate(() => { const vs = [...document.querySelectorAll('video')]; const v = vs[0]; return { hasVideo: !!v, t: Math.max(0, ...vs.map((x) => x.currentTime)), rs: v ? v.readyState : 0, verr: v && v.error ? v.error.code : 0, txt: (document.body ? document.body.innerText : '').trim().replace(/\s+/g, ' ').slice(0, 140) } }).catch(() => null) : Promise.resolve(null)
    let s = null
    for (let i = 0; i < 16; i++) { s = await info(); if (s && ((s.hasVideo && s.rs > 0) || ERR.test(s.txt))) break; await page.waitForTimeout(500) }
    const box = await h.boundingBox().catch(() => null)
    if (box) { await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.waitForTimeout(1200); await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2).catch(() => {}) }
    await page.waitForTimeout(2500); const a = await info(); await page.waitForTimeout(2000); const b = await info()
    const bad = net.filter((n) => n.st >= 400 && /kinescope\.io|vimeo\.com/.test(n.u) && !/metrics|favicon/.test(n.u))
    const manifestOk = net.some((n) => n.st < 400 && /\.m3u8|\.mpd|vimeo\.com\/video\/\d+\/config|playlist\.json/.test(n.u))
    const nets = ` сеть: ${manifestOk ? 'манифест 2xx' : 'манифеста нет'}${bad.length ? '; 4xx: ' + bad.slice(0, 2).map((x) => x.st + ' ' + x.u.slice(0, 70)).join(' ') : ''}`
    if (!b) return { status: 'fail', detail: 'кадр плеера не отвечает' + nets }
    if (!b.hasVideo) return { status: 'fail', detail: `нет <video>; текст: «${b.txt}»` + nets }
    if (ERR.test(a?.txt || '') || ERR.test(b.txt) || b.verr) return { status: 'fail', detail: `ошибка плеера (code ${b.verr}); текст: «${b.txt}»` + nets }
    if (bad.length) return { status: 'fail', detail: 'ответ 4xx от видеохостинга.' + nets }
    if (b.t > (a?.t || 0) + 0.3 || b.t > 0.5) return { status: 'ok-play', detail: `воспроизводится, currentTime ${b.t.toFixed(1)}` + nets }
    if (!manifestOk && kind !== 'youtube') return { status: 'fail', detail: 'плеер открылся, но манифест видео не загрузился.' + nets }
    return { status: 'ok-load', detail: 'плеер и манифест загружены, ошибок нет; запуск в автоматизации не подтверждается' + nets }
  } finally { page.off('response', onResp) }
}

// проверить все видимые видео-iframe на странице; store — Map id->результат
async function probeVideos(page, store, where, only) {
  const out = []
  for (const h of await page.$$('iframe')) {
    const src = (await h.getAttribute('src').catch(() => '')) || ''
    const m = [...vidIds(src).entries()][0]; if (!m) continue
    const [id, kind] = m
    if (only && !only.has(id)) continue
    const box = await h.boundingBox().catch(() => null); if (!box || box.width < 20) continue
    let rec = store.get(id)
    if (!rec || rec.status === 'pending') { const r = await probeHandle(page, h, kind); rec = { id, kind, ...r, where: new Set() }; store.set(id, rec) }
    rec.where.add(where); out.push({ id, kind, status: rec.status, detail: rec.detail, where })
  }
  return out
}

// ---------- попапы ----------
async function popupPass(page, prof, { videoOnly, store, onlyVideoIds, onlyHooks }) {
  const res = new Map()
  const tabs = await page.evaluate(() => [...document.querySelectorAll('.t1281__tab[data-tab-number]')].map((e) => e.dataset.tabNumber))
  const hooksAll = new Set()
  for (const tab of tabs.length ? tabs : [null]) {
    if (tab) { await page.evaluate((n) => { document.querySelector(`.t1281__tab[data-tab-number="${n}"]`)?.click() }, tab); await page.waitForTimeout(900) }
    const hooks = await page.evaluate(() => [...new Set([...document.querySelectorAll('a[href^="#popup"],a[href^="#zeropopup"],a[href^="#order"]')].map((a) => a.getAttribute('href')))])
    hooks.forEach((h) => hooksAll.add(h))
    for (const h of hooks) {
      if (onlyHooks && !onlyHooks.has(h)) continue
      const key = `${tab ? 't' + tab + ':' : ''}${h}`
      if ([...res.keys()].some((k) => k.endsWith(h) && !res.get(k).noButton)) continue
      const ok = await page.evaluate((h) => { const a = [...document.querySelectorAll(`a[href="${h}"]`)].find((a) => { const r = a.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(a).visibility !== 'hidden' }); if (!a) return false; a.scrollIntoView({ block: 'center' }); return true }, h).catch(() => false)
      if (!ok) { res.set(key, { hook: h, tab, noButton: true }); continue }
      await page.waitForTimeout(300)
      const urlBefore = page.url().split('#')[0]
      await page.evaluate((h) => { [...document.querySelectorAll(`a[href="${h}"]`)].find((a) => a.getBoundingClientRect().width > 0).click() }, h).catch(() => {})
      await page.waitForTimeout(videoOnly ? 1300 : 1500)
      const r = { hook: h, tab }
      if (!videoOnly) { r.m = await page.evaluate(POPUP_MEASURE).catch((e) => ({ err: e.message.slice(0, 80) })); if (r.m) r.shot = await page.screenshot({ type: 'png' }).catch(() => null) }
      r.videos = await probeVideos(page, store, `popup ${h}`, onlyVideoIds)
      r.closed = await closePopup(page)
      if (page.url().split('#')[0] !== urlBefore) { r.navigated = page.url(); await page.goto(urlBefore, { waitUntil: 'domcontentloaded' }).catch(() => {}); await page.waitForTimeout(1500) }
      res.set(key, r)
    }
  }
  return { res, hooks: [...hooksAll] }
}

// ---------- страница × профиль ----------
async function runPage(browser, item, profName) {
  const { url, mode } = item, prof = PROFILES[profName], pg = PAGES.get(url)
  const ctxOpts = { viewport: { width: prof.w, height: prof.h }, deviceScaleFactor: prof.mobile ? 2 : 1, isMobile: prof.mobile, hasTouch: prof.mobile }
  console.log(`\n${url} [${profName}] ${mode}`)
  const ctxP = await browser.newContext(ctxOpts)
  const prodUrl = BASE + url
  const P = await loadPage(ctxP, prodUrl)
  const state = { page: url, profile: profName, status: P.status, final: P.page.url(), mode }
  const metrics = await P.page.evaluate(PAGE_METRICS).catch(() => null)
  Object.assign(state, { title: metrics?.title, text: metrics?.text, docH: metrics?.docH, footH: metrics?.footH })
  const html = await P.page.content().catch(() => '')
  const prodHtmlIds = vidIds(html)
  const refHtml = pg ? (() => { try { return fs.readFileSync(path.join(ROOT, 'old-site', pg.key), 'utf8') } catch { return '' } })() : ''
  const refHtmlIds = vidIds(refHtml.replace(/<script[\s\S]*?<\/script>/gi, '')) // без <script>: иначе ловим ID из встроенных JS-виджетов, а не видимые ролики
  const expected404 = pg && !pg.published
  if (P.status >= 400 && !expected404) addProblem({ sev: 'H', page: url, profile: profName, what: `страница отвечает ${P.status}` })
  if (expected404) state.note = `скрыта (published:false), статус ${P.status}`
  if (mode === 'full' && metrics?.ox > 1 && P.status < 400) {
    const f = ssPath(url, profName, 'gorizontalnaya-prokrutka')
    await P.page.screenshot({ path: f, fullPage: true, scale: 'css' }).catch(() => {})
    addProblem({ sev: 'H', page: url, profile: profName, what: `горизонтальная прокрутка +${metrics.ox}px (${metrics.over.join('; ')})`, shot: rel(f) })
  }
  // консоль / сеть
  const consClean = [...new Set(P.log.cons)].filter((c) => !/Failed to load resource/.test(c))
  if (consClean.length) addProblem({ sev: 'M', page: url, profile: profName, what: `ошибки JS в консоли: ${consClean.slice(0, 3).join(' | ')}` })
  if (P.log.bad.length) addProblem({ sev: P.log.bad.some((b) => /kinescope|vimeo/.test(b)) ? 'H' : 'M', page: url, profile: profName, what: `ответы 4xx/5xx: ${[...new Set(P.log.bad)].slice(0, 4).join(' | ')}` })
  state.thirdParty = [...new Set(P.log.third)].slice(0, 5)

  // видео на странице
  const pageVideos = await probeVideos(P.page, videos, 'page')
  // попапы боевого
  let prodPop = null
  if (P.status < 400) prodPop = await popupPass(P.page, profName, { videoOnly: mode === 'video', store: videos })

  // эталон
  let refPop = null, refMetrics = null, R = null, ctxR = null
  if (!NO_REF && pg && mode === 'full' && fs.existsSync(path.join(ROOT, 'old-site', pg.key))) {
    ctxR = await browser.newContext(ctxOpts)
    R = await loadPage(ctxR, 'file://' + path.join(ROOT, 'old-site', pg.key))
    refMetrics = await R.page.evaluate(PAGE_METRICS).catch(() => null)
    if (!FAST) {
      const failedIds = new Set([...videos.values()].filter((v) => v.status === 'fail').map((v) => v.id))
      await probeVideos(R.page, refVideos, 'page', failedIds)
      // эталонные попапы — только первые два и те, что у боевого подозрительны (экономия времени)
      const sus = new Set(); let n = 0
      for (const r of (prodPop?.res.values() || [])) { if (r.noButton) continue; if (n++ < 2) sus.add(r.hook); const m = r.m; if (m?.card && (Math.abs(m.gapL - m.gapR) > 4 || m.card.r > m.cw + 1 || m.bottomAfter > m.vh + 2 || !r.closed || !m.close0?.found || !m.close0.inView)) sus.add(r.hook) }
      refPop = await popupPass(R.page, profName, { videoOnly: false, store: refVideos, onlyVideoIds: failedIds, onlyHooks: sus })
    }
  }

  // сравнение блоков и подвала
  let layoutShot = false
  const layoutShoot = async (what) => {
    if (layoutShot) return {}; layoutShot = true
    const f = ssPath(url, profName, what), g = ssPath(url, profName, what + '-tilda')
    await P.page.screenshot({ path: f, fullPage: true, scale: 'css' }).catch(() => {})
    if (R) await R.page.screenshot({ path: g, fullPage: true, scale: 'css' }).catch(() => {})
    return { shot: rel(f), shotTilda: R ? rel(g) : undefined }
  }
  if (mode === 'full' && metrics && refMetrics && P.status < 400) {
    const rb = new Map(refMetrics.blocks.map((b) => [b.id, b])); const diffs = []
    for (const b of metrics.blocks) { const r = rb.get(b.id); if (r && b.h > 0 && r.h > 0 && Math.abs(b.h - r.h) > 40) diffs.push(`${b.id}: ${b.h}px вместо ${r.h}px`) }
    const onlyProd = metrics.blocks.filter((b) => b.h > 0 && !rb.has(b.id)).length, onlyRef = refMetrics.blocks.filter((b) => b.h > 0 && !metrics.blocks.some((x) => x.id === b.id && x.h > 0)).length
    if (diffs.length) addProblem({ sev: 'M', page: url, profile: profName, what: `высота ${diffs.length} блок(ов) отличается от Тильды более чем на 40px: ${diffs.slice(0, 5).join('; ')}`, tilda: `документ ${refMetrics.docH}px против ${metrics.docH}px`, ...(await layoutShoot('vysoty-blokov')) })
    if (onlyRef > 0) addProblem({ sev: 'M', page: url, profile: profName, what: `${onlyRef} видимых блок(ов) Тильды нет на боевом`, ...(await layoutShoot('net-blokov')) })
    if (metrics.footH != null && refMetrics.footH != null && Math.abs(metrics.footH - refMetrics.footH) > 40)
      addProblem({ sev: 'M', page: url, profile: profName, what: `подвал ${metrics.footH}px`, tilda: `подвал Тильды ${refMetrics.footH}px (разница ${metrics.footH - refMetrics.footH}px)`, ...(await layoutShoot('podval')) })
    const gapsOf = (m) => { const o = new Map(); const bl = m.blocks.filter((b) => b.h > 0); for (let i = 1; i < bl.length; i++) o.set(bl[i - 1].id + '>' + bl[i].id, bl[i].top - (bl[i - 1].top + bl[i - 1].h)); return o }
    const gp = gapsOf(metrics), gr = gapsOf(refMetrics)
    const bigGaps = [...gp].filter(([k, v]) => v > 40 && (gr.get(k) ?? 0) + 40 < v).map(([k, v]) => `${k} ${v}px`)
    if (bigGaps.length) addProblem({ sev: 'M', page: url, profile: profName, what: `пустой промежуток между блоками: ${bigGaps.slice(0, 3).join('; ')}`, ...(await layoutShoot('pustoy-promezhutok')) })
    if (Math.abs(metrics.docH - refMetrics.docH) > 150 && !diffs.length && !onlyRef) addProblem({ sev: 'L', page: url, profile: profName, what: `высота страницы ${metrics.docH}px против ${refMetrics.docH}px у Тильды без отдельных блоков-виновников` })
  }

  // попапы: проверки и сравнение
  const popSummary = []
  if (prodPop && mode === 'full') {
    for (const [key, r] of prodPop.res) {
      const rr = refPop?.res.get(key)
      const sum = { hook: key, state: r.noButton ? 'нет видимой кнопки' : 'ok' }
      popSummary.push(sum)
      if (r.noButton) continue
      const issues = []
      if (!r.m) { addProblem({ sev: 'L', page: url, profile: profName, what: `${key}: оверлей попапа не распознан (возможно другая механика)` }); continue }
      const m = r.m
      if (m.err) { addProblem({ sev: 'L', page: url, profile: profName, what: `${key}: ошибка измерения ${m.err}` }); continue }
      if (m.card) {
        sum.card = m.card; sum.gapL = m.gapL; sum.gapR = m.gapR
        if (m.card.r > m.cw + 1 || m.card.l < -1) issues.push(['H', 'vyhodit-za-ekran', `карточка выходит за экран (слева ${m.gapL}px, справа ${m.gapR}px)`])
        else if (Math.abs(m.gapL - m.gapR) > 4) issues.push(['M', 'sdvig', `карточка сдвинута: слева ${m.gapL}px, справа ${m.gapR}px, ширина ${m.card.w}px`])
        if (m.card.t < -1 && !m.scrollable) issues.push(['H', 'obrezan-sverhu', `карточка обрезана сверху (top ${m.card.t}px) и не прокручивается`])
        if (m.bottomAfter > m.vh + 2) issues.push(['H', 'obrezan-snizu', `после прокрутки низ карточки на ${m.bottomAfter}px при высоте экрана ${m.vh}px (прокручивается: ${m.scrollable})`])
        if (m.card.h > m.vh + 2 && !m.scrollable) issues.push(['H', 'ne-prokruchivaetsya', `карточка ${m.card.h}px выше экрана ${m.vh}px и не прокручивается`])
      }
      if (!m.close0?.found) issues.push(['M', 'net-krestika', 'крестик закрытия не найден'])
      else if (!m.close0.inView || !m.close0.free) issues.push(['H', 'krestik-ne-viden', 'крестик не виден или перекрыт'])
      if (!r.closed) issues.push(['H', 'ne-zakryvaetsya', 'попап не закрывается (Escape и крестик)'])
      const rm = rr?.m
      if (rm?.card && m.card) {
        sum.tildaCard = rm.card; sum.tildaGapL = rm.gapL; sum.tildaGapR = rm.gapR
        if (Math.abs(m.card.w - rm.card.w) > 24) issues.push(['M', 'shirina', `ширина карточки ${m.card.w}px вместо ${rm.card.w}px в Тильде`])
        if (Math.abs(m.gapL - rm.gapL) > 12 || Math.abs(m.gapR - rm.gapR) > 12) issues.push(['M', 'otstupy', `отступы слева/справа ${m.gapL}/${m.gapR}px вместо ${rm.gapL}/${rm.gapR}px в Тильде`])
      }
      if (issues.length) {
        const order = { H: 0, M: 1, L: 2 }; issues.sort((a, b) => order[a[0]] - order[b[0]])
        const f = ssPath(url, profName, `popup-${key.replace(/\W+/g, '')}-${issues[0][1]}`), g = f.replace(/\.png$/, '-tilda.png')
        if (r.shot) fs.writeFileSync(f, r.shot)
        if (rr?.shot) fs.writeFileSync(g, rr.shot)
        for (const [sev, , text] of issues) addProblem({ sev, page: url, profile: profName, what: `попап ${key}: ${text}`, tilda: rm?.card ? `карточка ${rm.card.w}px, слева ${rm.gapL}px, справа ${rm.gapR}px` : undefined, shot: rel(f), shotTilda: rr?.shot ? rel(g) : undefined })
      }
    }
  }

  // видео: сводка по странице (вкл. попапы) и сравнение с Тильдой
  const seen = new Map()
  for (const v of pageVideos) seen.set(v.id, v)
  for (const r of (prodPop?.res.values() || [])) for (const v of r.videos || []) seen.set(v.id, v)
  const pageVidRows = []
  for (const [id, kind] of new Map([...refHtmlIds, ...prodHtmlIds])) {
    pageVidRows.push({ id, kind, inProd: prodHtmlIds.has(id) || seen.has(id), inTilda: refHtmlIds.has(id) })
  }
  for (const v of pageVidRows) {
    if (v.inTilda && !v.inProd && P.status < 400) addProblem({ sev: 'H', page: url, profile: profName, what: `видео ${v.kind} ${v.id} есть в архиве Тильды (в разметке, не в скрипте), на боевой странице не найдено ни в DOM, ни после открытия попапов` })
  }
  state.videoIds = pageVidRows.map((v) => v.id)
  state.popups = popSummary
  state.pageVideosProbed = [...seen.keys()]
  pageStates.push(state)
  state._ids = pageVidRows
  await P.page.close(); await ctxP.close(); if (R) { await R.page.close(); await ctxR.close() }
  return state
}

// ---------- запуск ----------
const t0 = Date.now()
const browser = await launch()
try {
  const idsAll = new Map() // id -> {kind, pages:Set, inTilda:Set}
  const missing = []
  for (const item of planned) {
    if (!PAGES.has(item.url)) { missing.push(item.url); console.log(`\n${item.url}: нет в pages.ts`); continue }
    const profs = item.profs.filter((p) => !PROF_FILTER || PROF_FILTER.includes(p))
    for (const prof of profs) {
      try {
        const st = await runPage(browser, item, prof)
        for (const v of st._ids) { const e = idsAll.get(v.id) || { kind: v.kind, pages: new Set(), tilda: new Set() }; if (v.inProd) e.pages.add(item.url); if (v.inTilda) e.tilda.add(item.url); idsAll.set(v.id, e) }
        delete st._ids
      } catch (e) { addProblem({ sev: 'M', page: item.url, profile: prof, what: `сбой проверки: ${e.message.slice(0, 150)}` }) }
      fs.writeFileSync(path.join(OUT, 'result.partial.json'), JSON.stringify({ problems, pageStates }, null, 1))
    }
  }
  // видео, найденные в коде, но ни разу не открытые: проверяем на боевом домене через временный iframe (только в браузере)
  const leftovers = [...idsAll].filter(([id]) => !videos.has(id))
  if (leftovers.length) {
    console.log(`\nВидео, не открытые через интерфейс: ${leftovers.length}, проверка синтетическим iframe на ${BASE}`)
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const { page } = await loadPage(ctx, BASE + '/')
    for (const [id, e] of leftovers) {
      const src = e.kind === 'kinescope' ? `https://kinescope.io/embed/${id}` : e.kind === 'vimeo' ? `https://player.vimeo.com/video/${id}` : `https://www.youtube-nocookie.com/embed/${id}`
      await page.evaluate((src) => { document.getElementById('__probe')?.remove(); const f = document.createElement('iframe'); f.id = '__probe'; f.src = src; f.allow = 'autoplay; fullscreen'; f.style.cssText = 'position:fixed;left:100px;top:100px;width:640px;height:360px;z-index:2147483000;background:#000'; document.body.appendChild(f) }, src)
      const h = await page.$('#__probe')
      const r = await probeHandle(page, h, e.kind)
      videos.set(id, { id, kind: e.kind, ...r, where: new Set(['синтетический iframe (в коде, кнопка не найдена)']) })
    }
    await page.close(); await ctx.close()
  }
  // видео, не работающие у нас: повтор в эталоне (если ещё не пробовали) — через file:// с синтетическим iframe
  const failIds = [...videos.values()].filter((v) => v.status === 'fail')
  const toRef = failIds.filter((v) => !refVideos.has(v.id))
  if (toRef.length && !NO_REF) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const { page } = await loadPage(ctx, 'file://' + path.join(ROOT, 'old-site/page36594700.html'))
    for (const v of toRef) {
      const src = v.kind === 'kinescope' ? `https://kinescope.io/embed/${v.id}` : v.kind === 'vimeo' ? `https://player.vimeo.com/video/${v.id}` : `https://www.youtube-nocookie.com/embed/${v.id}`
      await page.evaluate((src) => { document.getElementById('__probe')?.remove(); const f = document.createElement('iframe'); f.id = '__probe'; f.src = src; f.allow = 'autoplay; fullscreen'; f.style.cssText = 'position:fixed;left:100px;top:100px;width:640px;height:360px;z-index:2147483000;background:#000'; document.body.appendChild(f) }, src)
      const r = await probeHandle(page, await page.$('#__probe'), v.kind); refVideos.set(v.id, { id: v.id, kind: v.kind, ...r, where: new Set(['синтетический iframe на главной архива']) })
    }
    await page.close(); await ctx.close()
  }
  // проблемы по видео
  for (const v of failIds) {
    const rv = refVideos.get(v.id); const alsoTilda = rv?.status === 'fail'
    const pgs = idsAll.get(v.id)?.pages ? [...idsAll.get(v.id).pages] : []
    addProblem({ sev: alsoTilda ? 'L' : 'H', page: pgs.slice(0, 6).join(', ') || [...v.where][0], profile: 'desk', what: `видео ${v.kind} ${v.id} не работает: ${v.detail}${alsoTilda ? ' (в эталоне Тильды тоже не работает)' : rv ? ' (в эталоне Тильды работает: ' + rv.status + ')' : ''}`, videoId: v.id })
  }

  // ---------- вывод ----------
  const vlist = [...videos.values()].map((v) => ({ id: v.id, kind: v.kind, status: v.status, detail: v.detail, where: [...v.where], pages: idsAll.get(v.id) ? [...idsAll.get(v.id).pages] : [], tilda: refVideos.get(v.id) ? { status: refVideos.get(v.id).status, detail: refVideos.get(v.id).detail } : null }))
  const sevOrder = { H: 0, M: 1, L: 2 }
  problems.sort((a, b) => sevOrder[a.sev] - sevOrder[b.sev])
  const counts = { total: vlist.length, works: vlist.filter((v) => v.status !== 'fail').length, played: vlist.filter((v) => v.status === 'ok-play').length, fail: vlist.filter((v) => v.status === 'fail').length, failAlsoTilda: vlist.filter((v) => v.status === 'fail' && v.tilda?.status === 'fail').length }
  const minutes = Math.round((Date.now() - t0) / 60000)
  fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify({ base: BASE, date: new Date().toISOString(), minutes, missingInPagesTs: missing, notes, counts, problems, videos: vlist, pages: pageStates }, null, 1))
  const md = []
  md.push(`# Проверка боевого сайта ${BASE}`, '', `Дата: ${new Date().toISOString().slice(0, 16)}, время прогона: ${minutes} мин. Проблем: H ${problems.filter((p) => p.sev === 'H').length}, M ${problems.filter((p) => p.sev === 'M').length}, L ${problems.filter((p) => p.sev === 'L').length}.`, '')
  for (const sev of ['H', 'M', 'L']) {
    const list = problems.filter((p) => p.sev === sev); if (!list.length) continue
    md.push(`## ${sev === 'H' ? 'Высокий приоритет' : sev === 'M' ? 'Средний' : 'Низкий / справочно'} (${list.length})`, '')
    for (const p of list) md.push(`- **${p.page}** [${p.profile}] ${p.what}${p.tilda ? ` Тильда: ${p.tilda}.` : ''}${p.shot ? ` Скрин: \`${p.shot}\`${p.shotTilda ? ` | Тильда: \`${p.shotTilda}\`` : ''}` : ''}`)
    md.push('')
  }
  md.push('## Видео', '', `Всего уникальных: ${counts.total}; работает: ${counts.works} (из них плеер с подтверждённым ростом currentTime: ${counts.played}; остальные — плеер и манифест загружены, запуск в автоматизации не подтверждается); не работает: ${counts.fail}; не работает и в Тильде: ${counts.failAlsoTilda}.`, '')
  for (const v of vlist.filter((x) => x.status === 'fail')) md.push(`- ${v.kind} \`${v.id}\`: ${v.detail}; страницы: ${v.pages.slice(0, 8).join(', ') || v.where.join(', ')}; Тильда: ${v.tilda ? v.tilda.status : 'не проверялось'}`)
  md.push('', '## Не найдено в pages.ts', '', missing.length ? missing.join(', ') : 'нет', '', '## Заметки', '', ...(notes.length ? notes.map((n) => '- ' + n) : ['нет']))
  fs.writeFileSync(path.join(OUT, 'SUMMARY.md'), md.join('\n') + '\n')
  console.log(`\nГотово за ${minutes} мин. Видео: ${counts.total} всего / ${counts.works} работает / ${counts.fail} нет. Проблемы H/M/L: ${['H', 'M', 'L'].map((s) => problems.filter((p) => p.sev === s).length).join('/')}. Итог: ${rel(path.join(OUT, 'SUMMARY.md'))}`)
  await browser.close()
  process.exit(problems.some((p) => p.sev !== 'L') ? 1 : 0)
} catch (e) {
  console.error(e); await browser.close().catch(() => {}); process.exit(2)
}
