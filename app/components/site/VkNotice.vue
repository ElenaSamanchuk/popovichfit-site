<script setup lang="ts">
// Плашка «Дублируем информацию в других соцсетях» — Zero Block со страницы (rec2322627601 и копии) + поведение из
// скрипта T123: блок fixed, выезжает слева (десктоп, top 40px) / сверху (мобайл ≤768, top 30px), сам уезжает через 15 с,
// крестик прячет навсегда (localStorage `kochfit_top_banner_closed` — ключ как в оригинале). Клик по плашке не доходит
// до глобального обработчика cookie-баннера.
import type { TildaBlock } from '~/utils/tilda-css'
const props = defineProps<{ block: TildaBlock }>()

const STORAGE_KEY = 'kochfit_top_banner_closed'
const SHOW_DURATION = 15000
const mounted = ref(false)
const visible = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | undefined
/** крестик — кнопка без ссылки и текста внутри блока */
const closeSel = computed(() => { const b = props.block.elems?.find((e) => e.type === 'button' && !e.href && !(e.text || '').trim()); return b ? '.e' + b.id : '' })

function hide() { visible.value = false; if (hideTimer) clearTimeout(hideTimer) }
function onClick(e: MouseEvent) {
  e.stopImmediatePropagation() // как на Тильде: клик по плашке не считается «согласием» с cookie
  if (closeSel.value && (e.target as HTMLElement).closest(closeSel.value)) { e.preventDefault(); hide(); try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* noop */ } }
}
onMounted(() => {
  let closed = false
  try { closed = localStorage.getItem(STORAGE_KEY) === '1' } catch { closed = false }
  if (closed) return
  mounted.value = true
  // крестик рисуется раньше круглой подложки (порядок слоёв экспорта) — поднимаем его, иначе клик уходит в подложку (на живом сайте z-index 200)
  nextTick(() => { const btn = closeSel.value ? document.querySelector<HTMLElement>('.pf-vk-notice ' + closeSel.value) : null; if (btn) { btn.style.zIndex = '200'; btn.style.cursor = 'pointer' } })
  setTimeout(() => { requestAnimationFrame(() => { visible.value = true }); hideTimer = setTimeout(hide, SHOW_DURATION) }, 500)
})
onBeforeUnmount(() => { if (hideTimer) clearTimeout(hideTimer) })
</script>

<template>
  <div v-if="mounted" class="pf-vk-notice" :class="visible ? 'pf-vk-notice--visible' : ''" @click.capture="onClick">
    <ZeroBlock :block="block" />
  </div>
</template>

<style>
/* CSS из T123 экспорта (#rec2322627601): fixed поверх страницы, transform-переходы */
.pf-vk-notice { position: fixed; z-index: 1000010; pointer-events: none; will-change: transform; transition: transform 1.5s cubic-bezier(0.4, 0, 0.2, 1); }
.pf-vk-notice .tz { padding: 0 !important; }
.pf-vk-notice .tz .tz__art { overflow: visible; }
@media (max-width: 768px) {
  .pf-vk-notice { top: 30px; left: 0; right: 0; width: 100%; transform: translate3d(0, calc(-100% - 35px), 0); }
  .pf-vk-notice--visible { transform: translate3d(0, 0, 0); pointer-events: auto; }
}
@media (min-width: 769px) {
  .pf-vk-notice { top: 40px; left: 0; width: 1200px; max-width: calc(100vw - 32px); transform: translate3d(calc(-100% - 32px), 0, 0); }
  .pf-vk-notice--visible { transform: translate3d(0, 0, 0); pointer-events: auto; }
}
</style>
