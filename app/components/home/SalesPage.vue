<script setup lang="ts">
// Страница продаж (/pred, /predcor, /predpow): отдаётся только при SALES_OPEN=true (иначе её перехватывает middleware/sales.global.ts).
// Содержимое — данные экспорта app/data/tilda/<файл>.json (как у остальных страниц). Пока файла нет — 404.
import { pages } from '~/data/pages'
import type { TildaPageData } from '~/utils/tilda-css'
import { SALES_OPEN, SALES_PAGES } from '~/data/sales'

definePageMeta({ layout: false })
const route = useRoute()
const file = SALES_PAGES[route.path.replace(/\/+$/, '').toLowerCase()]
if (!SALES_OPEN || !file) throw createError({ statusCode: 404, statusMessage: 'Страница не найдена', fatal: true })
if (pages[file]) usePageMeta(file)
const { data } = await useAsyncData('sales:' + file, () => $fetch<TildaPageData>('/api/tilda/' + file.replace('.html', '.json')).catch(() => null))
if (!data.value) throw createError({ statusCode: 404, statusMessage: 'Страница не найдена', fatal: true })
const CHROME = new Set(['rec774067934', 'rec1120433846', 'rec592229670', 'rec1120432771', 'rec1120448561', 'rec5322139701', 'rec5322252501', 'rec5322288101', 'rec5322369201', 'rec5322387701', 'rec5322426201'])
const page = computed(() => ({ ...data.value!, blocks: data.value!.blocks.filter((b) => !CHROME.has(b.id)) }))
</script>

<template>
  <NuxtLayout name="default">
    <TildaPage :data="page" />
  </NuxtLayout>
</template>
