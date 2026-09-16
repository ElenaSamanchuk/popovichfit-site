<script setup lang="ts">
// old-site: плашка «Дублируем информацию в других соцсетях» — Zero Block #rec2322627601 + скрипт T123
// (docs/tilda-custom-code/216_*.html): блок fixed поверх страницы, выезжает слева (десктоп, top 40px) /
// сверху (мобайл, top 30px), сам уезжает через 15 с, крестик прячет навсегда (localStorage
// `kochfit_top_banner_closed` — ключ оставлен как в оригинале, чтобы не показывать плашку тем, кто её закрыл).
// Клик по плашке не доходит до глобального обработчика cookie-баннера (stopImmediatePropagation).
import { links } from '~/data/links'

const STORAGE_KEY = 'kochfit_top_banner_closed'
const SHOW_DURATION = 15000

const mounted = ref(false)
const visible = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | undefined

function hide() {
  visible.value = false
  if (hideTimer) clearTimeout(hideTimer)
}
function close() {
  hide()
  try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* noop */ }
}
function onClick(e: MouseEvent) {
  // как на Тильде: любой клик по плашке не считается «согласием» с cookie
  e.stopImmediatePropagation()
}

onMounted(() => {
  let closed = false
  try { closed = localStorage.getItem(STORAGE_KEY) === '1' } catch { closed = false }
  if (closed) return
  mounted.value = true
  setTimeout(() => {
    requestAnimationFrame(() => { visible.value = true })
    hideTimer = setTimeout(hide, SHOW_DURATION)
  }, 500)
})
onBeforeUnmount(() => { if (hideTimer) clearTimeout(hideTimer) })
</script>

<template>
  <div
    v-if="mounted"
    class="pf-vk-notice fixed left-0 top-[40px] z-[1000010] w-[1200px] max-w-[calc(100vw-32px)] transition-transform duration-[1500ms] ease-[cubic-bezier(0.4,0,0.2,1)] max-md:top-[30px] max-md:w-full max-md:max-w-full"
    :class="visible ? 'translate-x-0 translate-y-0 pointer-events-auto' : 'pointer-events-none max-md:translate-x-0 max-md:-translate-y-[calc(100%+35px)] md:-translate-x-[calc(100%+32px)]'"
    role="region"
    aria-label="Мы в других соцсетях"
    @click.capture="onClick"
  >
    <!-- десктоп: карточка 406×64 у левого края; мобайл (<640): макет 320 — карточка 300×48 на 10px от края, геометрия в --u -->
    <div class="relative ml-[10px] flex h-[64px] w-[406px] max-w-[calc(100vw-20px)] items-center gap-[12px] rounded-[12px] bg-white pl-[18px] pr-[30px] shadow-[0_15px_20px_-12px_rgba(106,106,106,0.15)] max-sm:ml-[calc(10*var(--u))] max-sm:h-[calc(48*var(--u))] max-sm:w-[calc(300*var(--u))] max-sm:gap-[calc(8*var(--u))] max-sm:rounded-[8px] max-sm:pl-[calc(10*var(--u))] max-sm:pr-[calc(24*var(--u))] max-sm:[--u:0.3125vw]">
      <a :href="links.vk" target="_blank" rel="noopener" class="shrink-0" aria-label="ВКонтакте">
        <img src="/img/home/rectangle_1.png" alt="" width="37" height="40" class="h-[40px] w-[37px] max-sm:h-[calc(26*var(--u))] max-sm:w-[calc(22*var(--u))]">
      </a>
      <a :href="links.vk" target="_blank" rel="noopener" class="text-[12px] font-medium leading-[1.35] text-[#4c4c4c] max-sm:text-[10px] max-sm:leading-[1.25] max-sm:tracking-[-0.05px]">
        Дублируем информацию в других соцсетях. <br>Если не работает Телеграм — <strong class="text-[#4f86c4]">переходите сюда</strong><span class="text-[#4369a3]">.</span>
      </a>
      <button type="button" class="absolute right-[12px] top-[10px] flex h-[12px] w-[12px] items-center justify-center max-sm:right-[calc(8*var(--u))] max-sm:top-[calc(8*var(--u))] max-sm:h-[10px] max-sm:w-[10px]" aria-label="Закрыть" @click="close">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" role="presentation">
          <path d="M1 1l10 10M11 1L1 11" stroke="#000" stroke-width="1.2" stroke-linecap="round" />
        </svg>
      </button>
    </div>
  </div>
</template>
