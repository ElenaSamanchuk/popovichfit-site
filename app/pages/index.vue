<script setup lang="ts">
// Главная — old-site/page36594700.html: тот же универсальный рендерер, что и остальные страницы (данные экспорта).
import type { TildaPageData } from '~/utils/tilda-css'
usePageMeta('page36594700.html')
const { data } = await useAsyncData('tilda:page36594700.html', () => $fetch<TildaPageData>('/api/tilda/page36594700.json'))
</script>

<template>
  <TildaPage v-if="data" :data="data" />
</template>
