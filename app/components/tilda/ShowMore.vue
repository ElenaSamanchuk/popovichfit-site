<script setup lang="ts">
// «Показ скрытых блоков по клику» (замена скрипта mo-ti.ru из T123): блоки класса cls скрыты (tabshide),
// клик по ссылке href их показывает/прячет; опционально прячет кнопку или её блок.
const props = defineProps<{ items: Array<{ href: string; cls: string; hideBtn: boolean; hideBlk: boolean }> }>()
const cleanups: Array<() => void> = []
onMounted(() => {
  for (const cfg of props.items) {
    const blocks = [...document.querySelectorAll<HTMLElement>('.' + cfg.cls)]
    document.querySelectorAll<HTMLAnchorElement>(`a[href="${cfg.href}"]`).forEach((a) => {
      const h = (e: Event) => {
        e.preventDefault()
        a.classList.toggle('more-btn-active')
        if (cfg.hideBtn) a.classList.add('tabshide')
        if (cfg.hideBlk) a.closest<HTMLElement>('[data-tilda-rec]')?.classList.add('tabshide')
        blocks.forEach((b) => b.classList.toggle('tabshide'))
        window.dispatchEvent(new Event('resize'))
      }
      a.addEventListener('click', h); cleanups.push(() => a.removeEventListener('click', h))
    })
  }
})
onBeforeUnmount(() => cleanups.forEach((f) => f()))
</script>

<template><span hidden /></template>
