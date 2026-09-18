<script setup lang="ts">
// Виджет тарифов (репозиторий popovichfit-tariffs) нативно, без iframe: разметка/логика — сгенерированный
// app/utils/tariffs-widget.js, стили — app/assets/css/tariffs-widget.css (с префиксом #pf-inline-wrap), конфиг — /api/tariffs/<course>.
import '~/assets/css/tariffs-widget.css'
const props = defineProps<{ course: 'korrekciya' | 'silovye' }>()
const ready = ref(false)
onMounted(async () => {
  try {
    const [cfg, mod] = await Promise.all([$fetch<Record<string, unknown>>(`/api/tariffs/${props.course}`), import('~/utils/tariffs-widget.js')])
    document.documentElement.dataset.course = props.course
    mod.initTariffsWidget(cfg)
    ready.value = true
  } catch (e) { console.error('[tariffs]', e) }
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
