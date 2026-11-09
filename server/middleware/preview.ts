export default defineEventHandler((event) => {
  if (!useRuntimeConfig(event).public.previewMode) return
  setHeader(event, 'X-Robots-Tag', 'noindex, nofollow, noarchive')
  if (event.method !== 'GET' && event.method !== 'HEAD') {
    throw createError({ statusCode: 405, statusMessage: 'Preview is read-only' })
  }
})
