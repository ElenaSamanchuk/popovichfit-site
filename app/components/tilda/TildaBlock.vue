<script setup lang="ts">
// Блоки экспорта, кроме Zero Block: типовые блоки Тильды рендерятся из вычищенного HTML экспорта
// (без скриптов) + блочного CSS экспорта (#recNNN …). Попапы (T868/T331/T390/T746/T702/T1093) — через Modal
// по hash-хуку; фиксированный фон T674 — FixedBackground; T131 (HTML-код) — только если это видимый контент
// без скриптов; служебные (T270/T890/T450/T215/T887/T367) — не рендерятся (их заменяют общие компоненты).
import type { TildaBlock } from '~/utils/tilda-css'
import { visCss, padResCss } from '~/utils/tilda-css'

const props = defineProps<{ block: TildaBlock; popupContent?: TildaBlock | null }>()
const b = props.block
const POPUP_TYPES = new Set(['868', '331', '390', '746', '702', '1093', '702'])
const SKIP = new Set(['270', '890', '450', '215', '887', '367', '806', '706']) // 706 — корзина, см. site/Cart.vue
const isPopup = computed(() => POPUP_TYPES.has(b.type) && !!b.hooks?.length)
const popupName = computed(() => (b.hooks?.[0] || '').replace(/^#/, ''))

/** содержимое попапа: внутренняя часть .t-popup__container; у галереи T746 — плюс стрелки слайдера (они лежат в .t-popup рядом с контейнером) */
const popupHtml = computed(() => {
  const h = b.html || ''
  const m = h.match(/<div class="t-popup__container[^"]*"[^>]*>([\s\S]*)<\/div>\s*<\/div>\s*<\/div>\s*$/)
  const inner = m ? m[1] : h
  const arrows = b.type === '746' ? h.match(/<ul class="t-slds__arrow_container[\s\S]*?<\/ul>/)?.[0] || '' : ''
  return arrows + inner
})
/** YouTube-попап T331: id видео из data-videolazy-id */
const youtubeId = computed(() => b.html?.match(/data-videolazy-id="([^"]+)"/)?.[1] || b.html?.match(/youtube\.com\/embed\/([\w-]+)/)?.[1])
/** T674: картинка фиксированного фона */
const bgImage = computed(() => b.html?.match(/data-src="([^"]+)"/)?.[1] || b.html?.match(/url\('([^']+)'\)/)?.[1])
/** HTML-код (T123): показываем только видимую разметку без скриптов (скрипты Тильды/фрилансеров не переносятся) */
const customHtml = computed(() => (b.custom || '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<!--[\s\S]*?-->/g, '').trim())
// прелоадеры (NOLIM NLM048 «nl_reploader», mt-webdesign) — оверлей на 3 с, в статике не нужен → блок пропускаем
const isPreloader = computed(() => /NLM048|nl_reploader|simple-preloader/i.test(b.custom || ''))
const customVisible = computed(() => b.type === '131' && !isPreloader.value && /<(div|iframe|img|p|a|span|table|h\d|ul)\b/.test(customHtml.value))

// стили видимого кастомного HTML (виджеты вроде розыгрыша #pf-pl-v1) — свои, со скоупом по id; у невидимых T123 не нужны
const customCss = computed(() => (b.type === '131' && customVisible.value ? [...(b.custom || '').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n') : ''))
const blockCss = (b.css || '') + visCss('#' + b.id, b.vis) + padResCss('#' + b.id, b.padRes) + customCss.value  // CSS блока из экспорта + видимость + отступы для экранов
if (blockCss) useHead({ style: [{ key: 'tb-' + b.id, innerHTML: blockCss }] })
const popupRoot = ref<HTMLElement | null>(null)
/** подложка zero-попапа T1093 из CSS блока (#rec .t1093 .t-popup__bg{…}): у Тильды по умолчанию она прозрачная, у части попапов
 *  rgba(0,0,0,.2/.3), почти у всех — backdrop-filter: blur(4px) */
const overlayStyle = computed(() => {
  if (b.type !== '1093') return undefined
  const m = (b.css || '').match(/\.t-popup__bg\{([^}]*)\}/)
  const body = m?.[1] || ''
  const bg = body.match(/(?:^|;)\s*background-color:([^;]+)/)?.[1]?.trim()
  const bf = body.match(/(?:^|;)\s*backdrop-filter:([^;]+)/)?.[1]?.trim()
  return { backgroundColor: bg || 'transparent', backdropFilter: bf || 'none', WebkitBackdropFilter: bf || 'none' }
})
function onPopupOpen() { nextTick(() => { if (popupRoot.value) initSlider(popupRoot.value) }) }
const anchorId = computed(() => b.type === '215' ? b.html?.match(/name="([^"]+)"/)?.[1] : undefined)

// интерактив стандартных блоков без runtime Тильды: аккордеон T585, табы T395, слайдер t-slds (галереи T746/T663)
const root = ref<HTMLElement | null>(null)
/** слайдер Тильды (.t-slds) без её runtime: порт t_slds_SliderWidth / t746_imageHeight / t746_arrowWidth / t_slds_UpdateSliderArrowsHeight —
 * ширина слайда = ширина контейнера, высота картинки — padding-bottom разделителя по data-slider-image-width/height,
 * показываем активный слайд (остальные display:none), стрелки и буллеты листают по кругу */
function initSlider(el: HTMLElement) {
  el.querySelectorAll<HTMLElement>('.t-slds').forEach((slds) => {
    if (slds.dataset.pfInit) return
    slds.dataset.pfInit = '1'
    const rec = (slds.closest<HTMLElement>('.tb') || el)
    const wrapper = slds.querySelector<HTMLElement>('.t-slds__items-wrapper')
    const items = [...slds.querySelectorAll<HTMLElement>('.t-slds__item:not(.t-slds__item_dummy)')]
    if (!items.length || !wrapper) return
    // без зацикливания (t-slds__nocycle): Тильда добавляет по краям слайды-«пустышки», а CSS прячет первый/последний
    // (opacity:0) — без пустышек прозрачным становится первый настоящий слайд, поэтому добавляем их так же
    const nocycle = wrapper.classList.contains('t-slds__nocycle')
    if (nocycle) {
      for (const pos of ['afterbegin', 'beforeend'] as const) { const d = document.createElement('div'); d.className = 't-slds__item t-slds__item_dummy'; d.setAttribute('aria-hidden', 'true'); wrapper.insertAdjacentHTML(pos, d.outerHTML) }
    }
    // высота картинок: как t746_imageHeight/t604_imageHeight/t670_imageHeight
    slds.querySelectorAll<HTMLElement>('[data-slider-image-width][data-slider-image-height]').forEach((sep) => {
      const w = parseInt(sep.getAttribute('data-slider-image-width') || '0'), h = parseInt(sep.getAttribute('data-slider-image-height') || '0')
      if (w && h) sep.style.paddingBottom = `${(h / w) * 100}%`
    })
    const arrows = [...rec.querySelectorAll<HTMLElement>('.t-slds__arrow_wrapper')]
    const bullets = [...slds.querySelectorAll<HTMLElement>('.t-slds__bullet')]
    const inRow = () => { const c = parseInt(wrapper.getAttribute('data-slider-items-in-row') || '1') || 1; return window.innerWidth <= 640 ? 1 : window.innerWidth <= 960 && c > 1 ? 2 : c }
    let i = Math.max(0, items.findIndex((it) => it.classList.contains('t-slds__item_active')))
    const layout = () => {
      // t_slds_SliderWidth: ширина слайда = ширина .t-slds__container без паддингов (делённая на число в ряду)
      const cont = slds.querySelector<HTMLElement>('.t-slds__container')
      const cs = cont ? getComputedStyle(cont) : null
      const cw = cont ? cont.clientWidth - ((parseInt(cs!.paddingLeft) || 0) + (parseInt(cs!.paddingRight) || 0)) : 0
      const n = inRow()
      if (cw > 0) items.forEach((it) => { it.style.width = `${cw / n}px` })
      wrapper.style.width = ''
      wrapper.style.height = 'auto'
      // t746_arrowWidth: стрелки «у картинки» — ширина обёртки = половина свободного места по бокам слайда (в попапе — относительно окна попапа)
      const slide = items[i]?.querySelector<HTMLElement>('.t-slds__wrapper')
      const host = rec.classList.contains('tb--gallery') ? rec.clientWidth : window.innerWidth
      arrows.forEach((a) => {
        const nearpic = a.closest('.t-slds__arrow_container')?.classList.contains('t-slds__arrow-nearpic')
        a.style.width = window.innerWidth > 960 && nearpic && slide ? `${(host - slide.offsetWidth) / 2}px` : ''
        // t_slds_UpdateSliderArrowsHeight: высота обёртки стрелок = высота активного слайда (у T746 перебивается height:auto!important)
        const ah = items[i]?.clientHeight || 0
        if (ah) a.style.height = `${ah}px`
      })
    }
    const show = (n: number) => {
      const cnt = inRow()
      i = nocycle ? Math.max(0, Math.min(items.length - cnt, n)) : (n + items.length) % items.length
      if (nocycle) { // без зацикливания стрелки на краях прячутся (как t_slds_updateSlider)
        const l = rec.querySelector<HTMLElement>('.t-slds__arrow_wrapper-left'), r = rec.querySelector<HTMLElement>('.t-slds__arrow_wrapper-right')
        if (l) l.style.display = i > 0 ? 'block' : ''
        if (r) r.style.display = i + cnt >= items.length ? 'none' : ''
      }
      items.forEach((it, j) => {
        const vis = (j - i + items.length) % items.length < cnt
        it.classList.toggle('t-slds__item_active', j === i); it.style.display = vis ? 'block' : 'none'; it.setAttribute('aria-hidden', String(!vis))
      })
      slds.querySelectorAll<HTMLElement>('.t-slds__caption__container').forEach((c, j) => { c.style.display = j === i ? '' : 'none' })
      bullets.forEach((bl, j) => { bl.classList.toggle('t-slds__bullet_active', j === i); bl.querySelector('button')?.setAttribute('aria-current', j === i ? 'true' : 'false') })
      layout()
    }
    slds.style.visibility = 'visible'
    show(i)
    requestAnimationFrame(layout)
    rec.querySelector('.t-slds__arrow_wrapper-left')?.addEventListener('click', () => show(i - 1))
    rec.querySelector('.t-slds__arrow_wrapper-right')?.addEventListener('click', () => show(i + 1))
    bullets.forEach((bl, j) => bl.addEventListener('click', () => show(j)))
    slds.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') show(i - 1); if (e.key === 'ArrowRight') show(i + 1) })
    window.addEventListener('resize', layout)
    // свайп
    let x0 = 0
    wrapper.addEventListener('touchstart', (e) => { x0 = e.touches[0]!.clientX }, { passive: true })
    wrapper.addEventListener('touchend', (e) => { const dx = e.changedTouches[0]!.clientX - x0; if (Math.abs(dx) > 40) show(dx < 0 ? i + 1 : i - 1) })
  })
}
onMounted(() => {
  const el = root.value
  if (!el) return
  initSlider(el)
  if (b.type === '585') {
    const headers = [...el.querySelectorAll<HTMLElement>('.t585__header')]
    const setOpen = (header: HTMLElement, open: boolean) => {
      header.classList.toggle('t585__opened', open)
      header.querySelector('.t585__trigger-button')?.setAttribute('aria-expanded', String(open))
      const content = header.nextElementSibling as HTMLElement | null
      if (content) { content.hidden = !open; content.style.display = open ? 'block' : 'none' }
    }
    headers.forEach((header) => header.addEventListener('click', () => {
      const open = !header.classList.contains('t585__opened')
      headers.forEach((h) => { if (h !== header) setOpen(h, false) }) // как на Тильде: открыт только один вопрос
      setOpen(header, open)
    }))
  }
  if (b.type === '395' || b.type === '1281') {
    const t = 't' + b.type // T395 и T1281 (табы-карусель) устроены одинаково: .tNNN__tab[data-tab-rec-ids], .tNNN__tab_active
    const tabs = [...el.querySelectorAll<HTMLElement>(`.${t}__tab`)]
    const panels = [...el.querySelectorAll<HTMLElement>(`.${t}__content`)]
    const select = el.querySelector<HTMLSelectElement>(`.${t}__select`)
    // «табы из блоков»: у вкладок data-tab-rec-ids — показываем блоки активной вкладки, остальные прячем (t395__off)
    const recIds = tabs.map((t) => (t.getAttribute('data-tab-rec-ids') || '').split(',').map((x) => x.trim()).filter(Boolean))
    const activate = (i: number) => {
      tabs.forEach((tab, j) => { tab.classList.toggle(`${t}__tab_active`, i === j); tab.classList.toggle(`${t}__tab-style1_active`, i === j && b.type === '1281'); tab.querySelector('button')?.setAttribute('aria-selected', String(i === j)) })
      panels.forEach((p, j) => { p.style.display = i === j ? 'block' : 'none' })
      recIds.forEach((ids, j) => ids.forEach((id) => document.getElementById('rec' + id)?.classList.toggle('t395__off', i !== j)))
      if (select) select.selectedIndex = i
    }
    tabs.forEach((tab, i) => tab.addEventListener('click', () => activate(i)))
    select?.addEventListener('change', () => activate(select.selectedIndex))
    const cur = Number(el.querySelector('[data-tab-current]')?.getAttribute('data-tab-current') || 1) - 1
    if (panels.length) panels.forEach((p, j) => { p.style.display = j === cur ? 'block' : 'none' })
  }
})
</script>

<template>
  <!-- якорь T215 -->
  <span v-if="b.type === '215'" :id="anchorId" class="block scroll-mt-[44px]" :data-tilda-rec="b.id" />

  <!-- фиксированный фон T674 -->
  <FixedBackground v-else-if="b.type === '674' && bgImage" :image="bgImage" />

  <!-- попапы -->
  <Modal v-else-if="isPopup" :name="popupName" :width="b.type === '331' || b.type === '868' ? 960 : b.type === '746' ? 960 : 640" :bare="b.type === '331' || b.type === '868' || b.type === '1093' || b.type === '746'" :overlay="b.type === '1093' ? 'dim' : b.type === '390' ? 'light' : 'dark'" :overlay-style="overlayStyle" @open="onPopupOpen">
    <ZeroBlock v-if="b.type === '1093' && popupContent" :block="popupContent" />
    <VideoEmbed v-else-if="b.type === '331' && youtubeId" kind="youtube" :id="youtubeId" autoplay />
    <div v-else ref="popupRoot" class="tb tb--popup" :class="b.type === '746' ? 'tb--gallery t746' : 'p-[30px] max-xs:p-[16px]'" :data-tilda-rec="b.id" v-html="popupHtml" />
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
    :class="['t-rec-' + b.type, b.tabHidden ? 't395__off' : '', b.showHidden ? 'tabshide' : '']"
    :style="{ paddingTop: b.pad['padding-top'] != null ? b.pad['padding-top'] + 'px' : undefined, paddingBottom: b.pad['padding-bottom'] != null ? b.pad['padding-bottom'] + 'px' : undefined, backgroundColor: b.bg || undefined }"
    :data-tilda-rec="b.id"
    v-html="b.html"
  />
</template>
