<script setup lang="ts">
// Блоки экспорта, кроме Zero Block: типовые блоки Тильды рендерятся из вычищенного HTML экспорта
// (без скриптов) + блочного CSS экспорта (#recNNN …). Попапы (T868/T331/T390/T746/T702/T1093) — через Modal
// по hash-хуку; фиксированный фон T674 — FixedBackground; T131 (HTML-код) — только если это видимый контент
// без скриптов; служебные (T270/T890/T450/T215/T887/T367) — не рендерятся (их заменяют общие компоненты).
import type { TildaBlock } from '~/utils/tilda-css'

const props = defineProps<{ block: TildaBlock; popupContent?: TildaBlock | null }>()
const b = props.block
const POPUP_TYPES = new Set(['868', '331', '390', '746', '702', '1093', '702'])
const SKIP = new Set(['270', '890', '450', '215', '887', '367', '806'])
const isPopup = computed(() => POPUP_TYPES.has(b.type) && !!b.hooks?.length)
const popupName = computed(() => (b.hooks?.[0] || '').replace(/^#/, ''))

/** содержимое попапа: внутренняя часть .t-popup__container */
const popupHtml = computed(() => {
  const h = b.html || ''
  const m = h.match(/<div class="t-popup__container[^"]*"[^>]*>([\s\S]*)<\/div>\s*<\/div>\s*<\/div>\s*$/)
  return m ? m[1] : h
})
/** YouTube-попап T331: id видео из data-videolazy-id */
const youtubeId = computed(() => b.html?.match(/data-videolazy-id="([^"]+)"/)?.[1] || b.html?.match(/youtube\.com\/embed\/([\w-]+)/)?.[1])
/** T674: картинка фиксированного фона */
const bgImage = computed(() => b.html?.match(/data-src="([^"]+)"/)?.[1] || b.html?.match(/url\('([^']+)'\)/)?.[1])
/** HTML-код (T123): показываем только видимую разметку без скриптов (скрипты Тильды/фрилансеров не переносятся) */
const customHtml = computed(() => (b.custom || '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<!--[\s\S]*?-->/g, '').trim())
const customVisible = computed(() => b.type === '131' && /<(div|iframe|img|p|a|span|table|h\d|ul)\b/.test(customHtml.value))

if (b.css) useHead({ style: [{ key: 'tb-' + b.id, innerHTML: b.css }] })
const anchorId = computed(() => b.type === '215' ? b.html?.match(/name="([^"]+)"/)?.[1] : undefined)

// интерактив стандартных блоков без runtime Тильды: аккордеон T585 и табы T395
const root = ref<HTMLElement | null>(null)
onMounted(() => {
  const el = root.value
  if (!el) return
  if (b.type === '585') {
    el.querySelectorAll<HTMLElement>('.t585__header').forEach((header) => {
      const content = header.nextElementSibling as HTMLElement | null
      header.addEventListener('click', () => {
        const open = header.classList.toggle('t585__opened')
        header.querySelector('.t585__trigger-button')?.setAttribute('aria-expanded', String(open))
        if (content) { content.hidden = !open; content.style.display = open ? 'block' : 'none' }
      })
    })
  }
  if (b.type === '395') {
    const tabs = [...el.querySelectorAll<HTMLElement>('.t395__tab')]
    const panels = [...el.querySelectorAll<HTMLElement>('.t395__content')]
    tabs.forEach((tab, i) => tab.addEventListener('click', () => {
      tabs.forEach((t, j) => t.classList.toggle('t395__tab_active', i === j))
      panels.forEach((p, j) => { p.style.display = i === j ? 'block' : 'none' })
    }))
    panels.forEach((p, j) => { p.style.display = j === 0 ? 'block' : 'none' })
  }
})
</script>

<template>
  <!-- якорь T215 -->
  <span v-if="b.type === '215'" :id="anchorId" class="block scroll-mt-[44px]" :data-tilda-rec="b.id" />

  <!-- фиксированный фон T674 -->
  <FixedBackground v-else-if="b.type === '674' && bgImage" :image="bgImage" />

  <!-- попапы -->
  <Modal v-else-if="isPopup" :name="popupName" :width="b.type === '331' || b.type === '868' ? 960 : 640" :bare="b.type === '331' || b.type === '868' || b.type === '1093'" :overlay="b.type === '1093' || b.type === '390' ? 'light' : 'dark'">
    <ZeroBlock v-if="b.type === '1093' && popupContent" :block="popupContent" />
    <VideoEmbed v-else-if="b.type === '331' && youtubeId" kind="youtube" :id="youtubeId" autoplay />
    <div v-else class="tb tb--popup p-[30px] max-xs:p-[16px]" :data-tilda-rec="b.id" v-html="popupHtml" />
  </Modal>

  <!-- HTML-код с видимым содержимым (плашки, iframe) -->
  <div v-else-if="b.type === '131' && customVisible" class="tb tb--custom" :data-tilda-rec="b.id" v-html="customHtml" />
  <template v-else-if="b.type === '131'" />

  <!-- служебные блоки — их заменяют общие компоненты -->
  <template v-else-if="SKIP.has(b.type)" />

  <!-- остальные типовые блоки Тильды -->
  <div
    v-else
    :id="b.id"
    ref="root"
    class="tb t-rec"
    :class="'t-rec-' + b.type"
    :style="{ paddingTop: b.pad['padding-top'] != null ? b.pad['padding-top'] + 'px' : undefined, paddingBottom: b.pad['padding-bottom'] != null ? b.pad['padding-bottom'] + 'px' : undefined, backgroundColor: b.bg || undefined }"
    :data-tilda-rec="b.id"
    v-html="b.html"
  />
</template>
