<script setup lang="ts">
// Новый общий подвал дизайнера (T131 «Подвал», page27583923), один на все страницы вместо старого подвала Zero Block.
import '~/assets/css/pfh.css'
import footerHtml from './html/footer.html?raw'
import footerOpenHtml from './html/footer-open.html?raw'
import { SALES_OPEN } from '~/data/sales'
import { decorateLinks, bindSpaLinks } from '~/utils/pfh'

const route = useRoute()
const router = useRouter()
const root = ref<HTMLElement | null>(null)
const html = computed(() => (((route.path.replace(/\/+$/, '') || '/') === '/open' || (route.path.replace(/\/+$/, '') || '/') === '/pred' || ((route.path.replace(/\/+$/, '') || '/') === '/' && SALES_OPEN)) ? footerOpenHtml : footerHtml))
let off: (() => void) | null = null
function setup() {
  off?.()
  if (!root.value) return
  off = bindSpaLinks(root.value, (to) => router.push(to))
  decorateLinks(root.value)
}
onMounted(setup)
watch(html, () => nextTick(setup), { flush: 'post' })
onBeforeUnmount(() => off?.())
</script>

<template>
  <div ref="root" class="pfh pfh-foot" v-html="html" />
</template>
