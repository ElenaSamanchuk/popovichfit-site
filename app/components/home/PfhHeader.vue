<script setup lang="ts">
// Новая общая шапка и мобильное меню дизайнера (T131 «Шапка», page36666832). Одна на все страницы сайта вместо старой шапки Zero Block и меню T450.
// Разметка — как в экспорте (html/header*.html), поведение — app/utils/pfh.ts. На /open ссылки курсов ведут на /predcor, /predpow (шапка той страницы).
import '~/assets/css/pfh.css'
import headerHtml from './html/header.html?raw'
import headerOpenHtml from './html/header-open.html?raw'
import { SALES_OPEN } from '~/data/sales'
import { initMenu, decorateLinks, bindSpaLinks } from '~/utils/pfh'

/** шапка с кнопками /predcor, /predpow — на /open и на «/» в режиме «продажи открыты» */
const isOpenVariant = (path: string) => { const p = path.replace(/\/+$/, '') || '/'; return p === '/open' || p === '/pred' || (p === '/' && SALES_OPEN) }
const route = useRoute()
const router = useRouter()
const root = ref<HTMLElement | null>(null)
const html = computed(() => (isOpenVariant(route.path) ? headerOpenHtml : headerHtml))

let menu: ReturnType<typeof initMenu> | null = null
let offLinks: (() => void) | null = null
let offHook: (() => void) | null = null

/** «Вопрос/ответ» (#next) есть только на главной, /open и /close: на остальных страницах ведём на /#next, чтобы ссылка не была мёртвой */
function fixNext() {
  if (!root.value) return
  const here = !!document.getElementById('next')
  root.value.querySelectorAll<HTMLAnchorElement>('a[data-next], a[href="#next"], a[href="/#next"]').forEach((a) => {
    a.dataset.next = '1'
    a.setAttribute('href', here ? '#next' : '/#next')
  })
}
function setup() {
  teardown()
  if (!root.value) return
  menu = initMenu(root.value)
  offLinks = bindSpaLinks(root.value, (to) => { menu?.close(); router.push(to) })
  decorateLinks(root.value)
  fixNext()
}
function teardown() { menu?.destroy(); offLinks?.(); menu = null; offLinks = null }

onMounted(() => {
  setup()
  offHook = useNuxtApp().hook('page:finish', () => nextTick(() => { menu?.close(); fixNext() }))
})
watch(html, () => nextTick(setup), { flush: 'post' })
onBeforeUnmount(() => { teardown(); offHook?.() })
</script>

<template>
  <div ref="root" class="pfh pfh-hdr" v-html="html" />
</template>
