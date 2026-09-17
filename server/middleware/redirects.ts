// Редиректы старых адресов Тильды (301): /pageNNN.html → /slug (если у страницы есть slug),
// пути с заглавными буквами → нижний регистр, завершающий слэш → без него. Работает в режиме node-server;
// для чисто статического хостинга те же правила — в nginx (scripts/postgenerate.mjs пишет redirects.map).
import { pages, pageByUrl } from '~~/app/data/pages'

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const path = url.pathname
  if (path.startsWith('/api/') || path.startsWith('/_nuxt/') || path.startsWith('/img/') || path.startsWith('/fonts/')) return
  let target: string | null = null
  const m = /^\/(page\d+)\.html$/i.exec(path)
  if (m) {
    const file = m[1]!.toLowerCase() + '.html'
    const page = pages[file]
    if (page && page.url !== path) target = page.url
  }
  if (!target && path !== path.toLowerCase() && pageByUrl[path.toLowerCase()]) target = path.toLowerCase()
  if (!target && path.length > 1 && path.endsWith('/') && pageByUrl[path.replace(/\/+$/, '')]) target = path.replace(/\/+$/, '')
  if (target) return sendRedirect(event, target + url.search, 301)
})
