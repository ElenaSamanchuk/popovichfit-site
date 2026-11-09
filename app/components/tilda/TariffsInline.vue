<script setup lang="ts">
// Виджет тарифов с конфигом самой страницы (T123 «PopovichFit tariffs inline T123 v2», window.__PF_INLINE_CONFIG__:
// /course_corprod, /course_powprod — цены продления). Логика и стили те же, что у site/TariffsWidget.vue
// (app/utils/tariffs-widget.js, tariffs-widget.css), но конфиг берётся из данных страницы, а не из /api/tariffs.
import '~/assets/css/tariffs-widget.css'
const props = defineProps<{ course: 'korrekciya' | 'silovye'; config: Record<string, unknown> }>()
const ready = ref(false)
onMounted(async () => {
  try {
    const mod = await import('~/utils/tariffs-widget.js')
    document.documentElement.dataset.course = props.course
    mod.initTariffsWidget(props.config)
    ready.value = true
  } catch (e) { console.error('[tariffs-inline]', e) }
})
</script>

<template>
  <div id="pf-inline-wrap" class="pf-tariffs" :class="{ 'pf-tariffs--ready': ready }" :data-course="course">
    <div id="pf-root" />
  </div>
</template>

<style>
.pf-tariffs { display: block; width: 100%; min-height: 600px; }
.pf-tariffs #pf-root { width: 100%; }
</style>
