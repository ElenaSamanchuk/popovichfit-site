// Пока продажи закрыты, адреса страниц продаж редиректят (302, не 301); query (r, utm…) и #якорь сохраняются.
// Работает и при прямом заходе (node/SSR), и при переходе внутри сайта; для nginx — deploy/popovichfit.nginx.conf.
import { SALES_OPEN, SALES_REDIRECTS } from '~/data/sales'

export default defineNuxtRouteMiddleware((to) => {
  if (SALES_OPEN) return
  const target = SALES_REDIRECTS[to.path.replace(/\/+$/, '').toLowerCase()]
  if (!target) return
  return navigateTo({ path: target, query: to.query, hash: to.hash }, { redirectCode: 302 })
})
