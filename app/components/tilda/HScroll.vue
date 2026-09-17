<script setup lang="ts">
// Горизонтальный скролл Zero Block (замена скриптов romanyu/scrollbooster из T123): у блока со скроллом
// артборд уже overflow-x:auto (ovrflw=auto), здесь — прокрутка «за мышку» (drag) и стрелки .arrow-left/.arrow-right
// в соседнем блоке, сдвигающие на shift px. Рендерит ничего — только вешает обработчики после монтирования.
export interface HScrollConfig { scroll: string; arrows?: string | null; shift: number }
const props = defineProps<{ items: HScrollConfig[] }>()

const cleanups: Array<() => void> = []
onMounted(() => {
  for (const cfg of props.items) {
    const viewport = document.getElementById(cfg.scroll)
    if (!viewport) continue
    viewport.classList.add('tz-hscroll')
    // перетаскивание мышью (тач-скролл нативный)
    let down = false, startX = 0, startLeft = 0, moved = false
    const onDown = (e: PointerEvent) => { if (e.pointerType !== 'mouse' || e.button !== 0) return; down = true; moved = false; startX = e.clientX; startLeft = viewport.scrollLeft; viewport.classList.add('tz-hscroll--drag') }
    const onMove = (e: PointerEvent) => { if (!down) return; const dx = e.clientX - startX; if (Math.abs(dx) > 3) moved = true; viewport.scrollLeft = startLeft - dx }
    const onUp = () => { down = false; viewport.classList.remove('tz-hscroll--drag') }
    const onClick = (e: MouseEvent) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false } }
    viewport.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp); viewport.addEventListener('click', onClick, true)
    cleanups.push(() => { viewport.removeEventListener('pointerdown', onDown); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); viewport.removeEventListener('click', onClick, true) })
    // стрелки
    const arrowsRoot = cfg.arrows ? document.getElementById(cfg.arrows) : null
    if (arrowsRoot) {
      const bind = (sel: string, dir: number) => arrowsRoot.querySelectorAll<HTMLElement>(sel).forEach((a) => {
        const h = (e: Event) => { e.preventDefault(); viewport.scrollBy({ left: dir * cfg.shift, behavior: 'smooth' }) }
        a.addEventListener('click', h); a.style.cursor = 'pointer'
        cleanups.push(() => a.removeEventListener('click', h))
      })
      bind('.arrow-left', -1); bind('.arrow-right', 1)
    }
  }
})
onBeforeUnmount(() => cleanups.forEach((f) => f()))
</script>

<template><span hidden /></template>

<style>
.tz-hscroll { cursor: grab; scrollbar-width: none; }
.tz-hscroll::-webkit-scrollbar { display: none; }
.tz-hscroll--drag { cursor: grabbing; user-select: none; }
</style>
