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
/** NOLIM NLM607 «скрыть блоки без Tilda Members»: блоки из auth показываются только залогиненным в Tilda Members —
 *  у нас его нет, значит их не будет никогда (бонусные блоки для участников); блоки из off — наоборот, остаются */
const membersOnly = computed(() => {
  const s = new Set<string>()
  for (const b of props.data.blocks) {
    const m = /NLM607-->\s*<!--settings(\{.*?\})settingsend-->/.exec(b.custom || '')
    if (!m) continue
    try { for (const id of String(JSON.parse(m[1]).auth || '').split(',')) if (id.trim()) s.add(id.trim().replace(/^#/, '')) } catch { /* noop */ }
  }
  return s
})
const hasVkNotice = computed(() => props.data.blocks.some((b) => b.id === 'rec2322627601'))
const flow = computed(() => props.data.blocks.filter((b) => !SHARED.has(b.id) && !popupRecs.value.has(b.id) && !membersOnly.value.has(b.id)))
function popupContent(b: TildaBlock): TildaBlock | null {
  const id = b.popupRecs?.[0]?.split(',')[0]?.trim().replace(/^rec/, '')
  return id ? byId.value.get('rec' + id) ?? null : null
}
</script>

<template>
  <div class="tilda-page">
    <!-- плашка ВК (общий компонент) — только на страницах, где есть её блок -->
    <VkNotice v-if="hasVkNotice" />
    <template v-for="b in flow" :key="b.id">
      <ZeroBlock v-if="b.type === '396'" :block="b" />
      <Cart v-else-if="b.type === '706'" :block="b" />
      <TildaBlock v-else :block="b" :popup-content="popupContent(b)" />
    </template>
    <HScroll v-if="data.hscroll?.length" :items="data.hscroll" />
    <ShowMore v-if="data.showmore?.length" :items="data.showmore" />
  </div>
</template>
