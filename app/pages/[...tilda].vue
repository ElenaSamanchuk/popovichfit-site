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
definePageMeta({ layout: false })
usePageMeta(file)

// данные блоков — с сервера (серверный ассет), при клиентских переходах — из пререндеренного _payload.json
type PageData = import('~/utils/tilda-css').TildaPageData
const { data } = await useAsyncData('tilda:' + file, async () => {
  const page = await $fetch<PageData>('/api/tilda/' + file.replace('.html', '.json'))
  // шапка и футер главной на всех страницах (просьба заказчика 18.09): у страниц, где их не было в Тильде, подставляем блоки
  // из _chrome.json; из-за фиксированной шапки контенту нужен отступ сверху высотой артборда шапки
  if (meta.layout === 'bare' && !page.blocks.some((b) => b.id === 'rec1120433846')) {
    const chrome = await $fetch<{ header: PageData['blocks']; footer: PageData['blocks'] }>('/api/tilda/_chrome.json')
    return { ...page, blocks: [...chrome.header, ...page.blocks, ...chrome.footer], chromeAdded: true }
  }
  return page
})
// отладка гидрации (только dev): ?blocks=2-5 — отрисовать часть блоков
if (import.meta.dev && typeof route.query.blocks === 'string' && data.value) {
  const [a, b] = route.query.blocks.split('-').map(Number)
  data.value = { ...data.value, blocks: data.value.blocks.filter((_, i) => i >= (a || 0) && i <= (b ?? 999)) }
}
</script>

<template>
  <NuxtLayout name="default">
    <TildaPage v-if="data" :data="data" :class="(data as any).chromeAdded ? 'pf-chrome-added' : ''" />
  </NuxtLayout>
</template>
