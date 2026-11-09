<script setup lang="ts">
// Cookie-баннер на страницах, у которых нет своих данных Zero Block (главная, /open, /close, /speakers):
// на Тильде баннер приходил из «Шапки» (page36666832, блок rec2019524321) — берём тот же блок из её данных.
import type { TildaPageData } from '~/utils/tilda-css'
const { data } = await useAsyncData('pf:cookie-block', async () => {
  const page = await $fetch<TildaPageData>('/api/tilda/page36666832.json')
  return page.blocks.find((b) => b.id === 'rec2019524321') ?? null
})
</script>

<template>
  <CookieBanner v-if="data" :block="data" />
</template>
