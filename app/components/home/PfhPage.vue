<script setup lang="ts">
// Содержимое новой главной / страниц /open, /close, /speakers: разметка дизайнера как в экспорте (v-html) + скрипты через app/utils/pfh.ts.
// Скрипт запускается при монтировании (в т. ч. при переходе по ссылке без перезагрузки) и снимается при уходе — второй раз не навешивается.
import '~/assets/css/pfh.css'
import { initPage, bindSpaLinks } from '~/utils/pfh'

const props = defineProps<{ html: string; sales?: 'open' | 'closed'; preload?: boolean }>()
// первый экран: фото героя с высоким приоритетом и шрифты заголовков/текста (остальные картинки в разметке ленивые)
if (props.preload) {
  useHead({ link: [
    { rel: 'preload', as: 'image', href: '/home/img/t/t64376362-popovich_fit_2025040.b279b862.webp', fetchpriority: 'high' },
    { rel: 'preload', as: 'font', type: 'font/woff', href: '/home/fonts/involve/Involve-600__Involve-SemiBold.a4acd570.woff', crossorigin: 'anonymous' },
    { rel: 'preload', as: 'font', type: 'font/woff2', href: '/home/fonts/Manrope-500-cyrillic.376e21d8.woff2', crossorigin: 'anonymous' },
  ] })
}
const route = useRoute()
const router = useRouter()
const root = ref<HTMLElement | null>(null)
let page: ReturnType<typeof initPage> | null = null
let off: (() => void) | null = null

function setup() {
  teardown()
  if (!root.value) return
  page = initPage(root.value)
  off = bindSpaLinks(root.value, (to) => router.push(to))
}
function teardown() { page?.destroy(); off?.(); page = null; off = null }

onMounted(setup)
// При гидрации Nuxt временно использует SSR-адрес без query и hash.
onNuxtReady(() => { if (location.hash === '#safety') page?.openSafety() })
// переход на /#safety с этой же страницы (например из подвала) — открыть окно
watch(() => route.hash, (h) => { if (h === '#safety') page?.openSafety() })
watch(() => props.html, () => nextTick(setup), { flush: 'post' })
onBeforeUnmount(teardown)
</script>

<template>
  <div ref="root" class="pfh" :data-sales="sales" v-html="html" />
</template>
