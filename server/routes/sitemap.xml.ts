// sitemap.xml: все публичные страницы экспорта без noindex (как автогенерируемая карта Тильды).
import { pages } from '~~/app/data/pages'
import { SALES_OPEN, SALES_REDIRECTS } from '~~/app/data/sales'

export default defineEventHandler((event) => {
  const site = useRuntimeConfig().public.siteUrl.replace(/\/$/, '')
  const urls = Object.values(pages).filter((p) => !p.noindex && p.published !== false && p.url !== '/404.html' && (SALES_OPEN || !(p.url in SALES_REDIRECTS))).map((p) => p.url).concat(SALES_OPEN ? ['/pred'] : []).sort()
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
    + urls.map((u) => `  <url><loc>${site}${u === '/' ? '/' : u}</loc></url>`).join('\n') + '\n</urlset>\n'
  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return body
})
