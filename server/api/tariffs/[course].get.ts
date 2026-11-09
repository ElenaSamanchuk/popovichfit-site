// Конфиг виджета тарифов: актуальный — из репозитория заказчицы на GitHub (админка виджета коммитит в main),
// кэш 10 минут; если GitHub недоступен — резервная копия из сборки (scripts/build-tariffs-widget.mjs).
import korrekciya from '~~/app/data/tariffs-widget/config-korrekciya.json'
import silovye from '~~/app/data/tariffs-widget/config-silovye.json'

const bundled: Record<string, unknown> = { korrekciya, silovye }
const cache = new Map<string, { at: number; data: unknown }>()
const TTL = 10 * 60 * 1000

function rewrite(o: unknown): void {
  if (!o || typeof o !== 'object') return
  for (const k of Object.keys(o as Record<string, unknown>)) {
    const v = (o as Record<string, unknown>)[k]
    if (typeof v === 'string' && v.startsWith('assets/')) (o as Record<string, unknown>)[k] = '/tariffs/assets/' + v.slice(7)
    else if (typeof v === 'object') rewrite(v)
  }
}

export default defineEventHandler(async (event) => {
  const course = String(getRouterParam(event, 'course') || '').replace(/\.json$/, '')
  if (!bundled[course]) throw createError({ statusCode: 404, statusMessage: 'Нет такого курса' })
  if (useRuntimeConfig(event).public.previewMode) return bundled[course]
  const hit = cache.get(course)
  if (hit && Date.now() - hit.at < TTL) return hit.data
  try {
    const res = await fetch(`https://raw.githubusercontent.com/ElenaSamanchuk/popovichfit-tariffs/main/config-${course}.json`, { signal: AbortSignal.timeout(4000) })
    if (res.ok) { const data = await res.json(); rewrite(data); cache.set(course, { at: Date.now(), data }); return data }
  } catch { /* GitHub недоступен — резерв */ }
  return bundled[course]
})
