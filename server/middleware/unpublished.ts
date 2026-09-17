// Скрытые (неопубликованные) страницы — docs/unpublished.json → pages[*].published=false: без токена предпросмотра
// отдаём 404; с ?preview=<NUXT_PREVIEW_TOKEN> ставим cookie и показываем страницу (как предпросмотр в Тильде).
import { pages, pageByUrl } from '~~/app/data/pages'

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const path = url.pathname.replace(/\/+$/, '') || '/'
  const file = pageByUrl[path] ?? pageByUrl[path.toLowerCase()]
  const page = file ? pages[file] : undefined
  if (!page || page.published !== false) return
  const token = useRuntimeConfig().previewToken
  const q = url.searchParams.get('preview')
  if (token && q === token) { setCookie(event, 'pf_preview', token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24, path: '/' }); return }
  if (token && getCookie(event, 'pf_preview') === token) return
  throw createError({ statusCode: 404, statusMessage: 'Страница не найдена' })
})
