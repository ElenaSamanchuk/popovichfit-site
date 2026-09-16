// Реферальная программа и UTM (замена ~15 скриптов T123 Тильды одним модулем).
// Если в URL есть ?r= и/или utm_*, параметры дописываются во все ссылки на этот сайт и на
// https://lk.popovichfit.ru/… (включая checkout тарифов), а ссылка на бот предзаписи
// https://t.me/POPOVICHcourse_bot при наличии r подменяется на salebot-ссылку (как на главной Тильды).
// Значение r и utm держим в sessionStorage, чтобы не терять при переходах по ссылкам без параметров.
import { links } from '~/data/links'

const KEYS = ['r', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const
const STORAGE = 'pf_ref_params'

function readStored(): Record<string, string> {
  try { return JSON.parse(sessionStorage.getItem(STORAGE) || '{}') } catch { return {} }
}

export function collectParams(search: string): Record<string, string> {
  const q = new URLSearchParams(search)
  const stored = readStored()
  const out: Record<string, string> = { ...stored }
  for (const k of KEYS) {
    const v = q.get(k)
    if (v) out[k] = v
  }
  try { if (Object.keys(out).length) sessionStorage.setItem(STORAGE, JSON.stringify(out)) } catch { /* noop */ }
  return out
}

export function decorateLinks(params: Record<string, string>, root: ParentNode = document) {
  if (!Object.keys(params).length) return
  const site = location.origin
  root.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((a) => {
    const href = a.getAttribute('href') || ''
    if (!href || href.startsWith('#') || href.startsWith('tg:') || href.startsWith('mailto:') || href.startsWith('javascript:')) return
    let url: URL
    try { url = new URL(href, site) } catch { return }
    const isSite = url.origin === site || /(^|\.)popovichfit\.ru$/.test(url.hostname) && !url.hostname.startsWith('lk.')
    const isLk = url.hostname === 'lk.popovichfit.ru'
    if (params.r && (url.href === links.preorderBotWeb || url.href === links.preorderBotWeb + '/')) {
      a.setAttribute('href', links.preorderBotSalebot(params.r))
      return
    }
    if (!isSite && !isLk) return
    let changed = false
    for (const [k, v] of Object.entries(params)) {
      if (url.searchParams.get(k) !== v) { url.searchParams.set(k, v); changed = true }
    }
    if (!changed) return
    a.setAttribute('href', url.origin === site ? url.pathname + url.search + url.hash : url.toString())
  })
}

export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  let params: Record<string, string> = {}
  const apply = () => {
    params = collectParams(location.search)
    decorateLinks(params)
  }
  nuxtApp.hook('app:mounted', apply)
  router.afterEach(() => nextTick(apply))
  // динамически добавленные ссылки (попапы, карточки тарифов) — наблюдаем за DOM
  nuxtApp.hook('app:mounted', () => {
    const mo = new MutationObserver((muts) => {
      if (!Object.keys(params).length) return
      for (const m of muts) m.addedNodes.forEach((n) => { if (n instanceof HTMLElement) decorateLinks(params, n) })
    })
    mo.observe(document.body, { childList: true, subtree: true })
  })
  return { provide: { refParams: () => params } }
})
