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
const { data } = await useAsyncData('tilda:' + file, () => $fetch<import('~/utils/tilda-css').TildaPageData>('/api/tilda/' + file.replace('.html', '.json')))
</script>

<template>
  <NuxtLayout :name="meta.layout === 'bare' ? 'bare' : 'default'">
    <TildaPage v-if="data" :data="data" />
  </NuxtLayout>
</template>
