<script setup lang="ts">
// Универсальный маршрут для всех страниц экспорта, у которых нет своего файла в app/pages:
// URL → старый файл (app/data/pages.ts) → данные блоков (app/data/tilda/<file>.json) → TildaPage.
// Сохраняет старые пути 1:1: /about, /20cor1, /page103420636.html и т.д.
import { pages, pageByUrl } from '~/data/pages'

const route = useRoute()
const path = route.path.replace(/\/+$/, '') || '/'
const file = pageByUrl[path] ?? pageByUrl[path.toLowerCase()]
if (!file) throw createError({ statusCode: 404, statusMessage: 'Страница не найдена', fatal: true })

const meta = pages[file]!
// у главной, /open и /close свои маршруты (app/pages/*.vue): универсальный рендерер их не отдаёт (scripts/audit/export-config.json → customRoutes)
if (meta.custom) throw createError({ statusCode: 404, statusMessage: 'Страница не найдена', fatal: true })
definePageMeta({ layout: false })
usePageMeta(file)

// данные блоков — с сервера (серверный ассет), при клиентских переходах — из пререндеренного _payload.json
type PageData = import('~/utils/tilda-css').TildaPageData
/** старые шапка/меню/подвал страниц заменены общими PfhHeader/PfhFooter (layout) и новые T131-блоки шапки/подвала уже в layout */
const CHROME = new Set([
  'rec774067934', 'rec1120433846', 'rec592229670', 'rec1120432771', 'rec1120448561', // старые: фикс-шапка, Zero-шапка, меню T450, sticky-подвал, Zero-подвал
  'rec5322139701', 'rec5322252501', 'rec5322288101', 'rec5322369201', 'rec5322387701', 'rec5322426201', // новые T131 шапки и подвала (если есть в данных страницы)
])
const { data } = await useAsyncData('tilda:' + file, async () => {
  const page = await $fetch<PageData>('/api/tilda/' + file.replace('.html', '.json'))
  return { ...page, blocks: page.blocks.filter((b) => !CHROME.has(b.id)) }
})
// отладка гидрации (только dev): ?blocks=2-5 — отрисовать часть блоков
if (import.meta.dev && typeof route.query.blocks === 'string' && data.value) {
  const [a, b] = route.query.blocks.split('-').map(Number)
  data.value = { ...data.value, blocks: data.value.blocks.filter((_, i) => i >= (a || 0) && i <= (b ?? 999)) }
}
</script>

<template>
  <NuxtLayout name="default">
    <TildaPage v-if="data" :data="data" />
  </NuxtLayout>
</template>
