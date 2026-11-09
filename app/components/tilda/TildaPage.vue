<script setup lang="ts">
// Страница из данных экспорта Тильды (app/data/tilda/<file>.json): блоки по порядку.
// Zero Block → ZeroBlock, остальные → TildaBlock. Блоки, которые заменяют общие компоненты сайта
// (шапка/меню/cookie/футер/плашка ВК), пропускаются; блоки-содержимое zero-попапов (T1093 data-popup-rec-ids)
// рендерятся внутри Modal, а не в потоке.
import type { TildaBlock, TildaPageData } from '~/utils/tilda-css'

const props = defineProps<{ data: TildaPageData }>()

/** блоки, за которые отвечают общие компоненты layout */
const SHARED = new Set([
  'rec592229670', // мобильное меню T450 — компонент MobileMenu (открывается по #menu_open)
  'rec2322644301', // скрипт плашки ВК (T123) — поведение в VkNotice
])
const COOKIE = 'rec2019524321' // cookie-баннер (Zero) — рендерится внутри CookieBanner (логика согласия)
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
    try { for (const id of String(JSON.parse(m[1]!).auth || '').split(',')) if (id.trim()) s.add(id.trim().replace(/^#/, '')) } catch { /* noop */ }
  }
  return s
})
/** копии плашки ВК на других страницах: T123 со скриптом top-banner (…--visible/--hiding) указывает на свой #recN —
 *  такой блок не рендерим, показываем общий компонент VkNotice */
const vkCopies = computed(() => {
  const s = new Set<string>()
  for (const b of props.data.blocks) if (/top-banner--visible/.test(b.custom || '')) for (const m of (b.custom || '').matchAll(/#(rec\d+)/g)) s.add(m[1]!)
  return s
})
const vkBlock = computed(() => props.data.blocks.find((b) => b.id === 'rec2322627601' || vkCopies.value.has(b.id)) ?? null)
const cookieBlock = computed(() => props.data.blocks.find((b) => b.id === COOKIE) ?? null)
/** страницы документов (оферта, политика, согласия): шире колонка и форматирование абзацев — просьба заказчика 18.09 */
const DOC_PAGES = new Set(['/oferta', '/part_oferta', '/privacy', '/data-consent', '/consent', '/doc_l'])
/** статьи (/media_*): шире колонка текста — просьба заказчика 18.09 */
const WIDE_PAGES = new Set(['/media_1_otek', '/media_gluteal_muscles', '/media_kor', '/media_mtd2', '/mediah'])
const pagePath = useRoute().path.replace(/\/+$/, '').toLowerCase()
/** страницы со старой альтернативной шапкой (Zero, fixed поверх контента): на живом отступа под шапку нет, у новой шапки он есть только в мобильной версии (.pfh-gap) — убираем */
const OLD_HEADER_PAGES = new Set(['/course_prod', '/course_corprod', '/course_powprod', '/inventory', '/promo', '/nutric-lk', '/data-consent', '/privacy', '/part_oferta'])
const isOldHeader = OLD_HEADER_PAGES.has(pagePath)
const isDoc = DOC_PAGES.has(pagePath)
const isWide = WIDE_PAGES.has(pagePath)
/** /sertif: сертификаты сеткой с просмотром вместо слайдера — просьба заказчика 18.09 */
const isCertGrid = pagePath === '/sertif'
provide('pfDoc', isDoc)
provide('pfCertGrid', isCertGrid)
const flow = computed(() => props.data.blocks.filter((b) => !SHARED.has(b.id) && b.id !== COOKIE && b.id !== 'rec2322627601' && !popupRecs.value.has(b.id) && !membersOnly.value.has(b.id) && !vkCopies.value.has(b.id)))
function popupContent(b: TildaBlock): TildaBlock | null {
  const id = b.popupRecs?.[0]?.split(',')[0]?.trim().replace(/^rec/, '')
  return id ? byId.value.get('rec' + id) ?? null : null
}
</script>

<template>
  <div class="tilda-page" :class="{ 'pf-doc': isDoc, 'pf-wide': isWide, 'pf-oldhdr': isOldHeader }" :data-pf-cards="data.pfCards ? JSON.stringify(data.pfCards) : undefined">
    <!-- плашка ВК и cookie-баннер: содержимое — Zero Block со страницы, поведение — обёртки -->
    <VkNotice v-if="vkBlock" :block="vkBlock" />
    <CookieBanner v-if="cookieBlock" :block="cookieBlock" />
    <template v-for="b in flow" :key="b.id">
      <ZeroBlock v-if="b.type === '396'" :block="b" />
      <Cart v-else-if="b.type === '706'" :block="b" />
      <TildaBlock v-else :block="b" :popup-content="popupContent(b)" />
    </template>
    <HScroll v-if="data.hscroll?.length" :items="data.hscroll" />
    <ShowMore v-if="data.showmore?.length" :items="data.showmore" />
  </div>
</template>
