// Данные страницы экспорта (app/data/tilda/<file>.json) как серверный ассет: читаются по запросу
// при пререндере/SSR, а не бандлятся целиком (69 МБ JSON). На клиенте при переходах — из _payload.json.
export default defineEventHandler(async (event) => {
  const file = String(getRouterParam(event, 'file') || '').replace(/[^\w.-]/g, '')
  if (!/^page\d+\.json$/.test(file)) throw createError({ statusCode: 404, statusMessage: 'Нет данных страницы' })
  const data = await useStorage('assets:tilda').getItem(file)
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Нет данных страницы' })
  return data
})
