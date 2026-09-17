<script setup lang="ts">
// Страница из данных экспорта Тильды (app/data/tilda/<file>.json): блоки по порядку.
// Zero Block → ZeroBlock, остальные → TildaBlock. Блоки, которые заменяют общие компоненты сайта
// (шапка/меню/cookie/футер/плашка ВК), пропускаются; блоки-содержимое zero-попапов (T1093 data-popup-rec-ids)
// рендерятся внутри Modal, а не в потоке.
import type { TildaBlock, TildaPageData } from '~/utils/tilda-css'

const props = defineProps<{ data: TildaPageData }>()

/** блоки, за которые отвечают общие компоненты layout */
const SHARED = new Set([
  'rec1120433846', // шапка (Zero)
  'rec2019524321', // cookie-баннер (Zero)
  'rec592229670', // мобильное меню T450
  'rec1120448561', // футер (Zero)
  'rec2322627601', 'rec2322644301', // плашка ВК + её скрипт
])
const popupRecs = computed(() => {
  const s = new Set<string>()
  for (const b of props.data.blocks) for (const r of b.popupRecs ?? []) for (const id of r.split(',')) s.add('rec' + id.trim().replace(/^rec/, ''))
  return s
})
const byId = computed(() => new Map(props.data.blocks.map((b) => [b.id, b])))
const flow = computed(() => props.data.blocks.filter((b) => !SHARED.has(b.id) && !popupRecs.value.has(b.id)))
function popupContent(b: TildaBlock): TildaBlock | null {
  const id = b.popupRecs?.[0]?.split(',')[0]?.trim().replace(/^rec/, '')
  return id ? byId.value.get('rec' + id) ?? null : null
}
</script>

<template>
  <div class="tilda-page">
    <template v-for="b in flow" :key="b.id">
      <ZeroBlock v-if="b.type === '396'" :block="b" />
      <TildaBlock v-else :block="b" :popup-content="popupContent(b)" />
    </template>
  </div>
</template>
