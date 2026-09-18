<script setup lang="ts">
// «Показ скрытых блоков по клику» (замена скрипта mo-ti.ru из T123): блоки класса cls скрыты (tabshide),
// клик по ссылке href их показывает/прячет; опционально прячет кнопку или её блок.
const props = defineProps<{ items: Array<{ href: string; cls: string; hideBtn: boolean; hideBlk: boolean }> }>()
const cleanups: Array<() => void> = []
const TR = 'max-height 0.45s ease-in-out, opacity 0.45s ease-in-out'
/** плавно показать блок: снимаем tabshide и раскрываем max-height от 0 до высоты содержимого */
function reveal(b: HTMLElement) {
  b.classList.remove('tabshide')
  Object.assign(b.style, { overflow: 'hidden', maxHeight: '0px', opacity: '0', transition: TR })
  void b.offsetHeight
  Object.assign(b.style, { maxHeight: `${b.scrollHeight}px`, opacity: '1' })
  setTimeout(() => { if (!b.classList.contains('tabshide')) Object.assign(b.style, { overflow: '', maxHeight: '', opacity: '', transition: '' }) }, 480)
}
/** плавно спрятать: max-height к 0, затем класс tabshide (как в исходном скрипте mo-ti.ru) */
function conceal(b: HTMLElement) {
  Object.assign(b.style, { overflow: 'hidden', maxHeight: `${b.scrollHeight}px`, transition: TR })
  void b.offsetHeight
  Object.assign(b.style, { maxHeight: '0px', opacity: '0' })
  setTimeout(() => { b.classList.add('tabshide'); Object.assign(b.style, { overflow: '', maxHeight: '', opacity: '', transition: '' }) }, 480)
}
onMounted(() => {
  for (const cfg of props.items) {
    const blocks = [...document.querySelectorAll<HTMLElement>('.' + cfg.cls)]
    document.querySelectorAll<HTMLAnchorElement>(`a[href="${cfg.href}"]`).forEach((a) => {
      const h = (e: Event) => {
        e.preventDefault()
        a.classList.toggle('more-btn-active')
        if (cfg.hideBtn) a.classList.add('tabshide')
        if (cfg.hideBlk) a.closest<HTMLElement>('[data-tilda-rec]')?.classList.add('tabshide')
        blocks.forEach((b) => (b.classList.contains('tabshide') ? reveal(b) : conceal(b)))
        window.dispatchEvent(new Event('resize'))
      }
      a.addEventListener('click', h); cleanups.push(() => a.removeEventListener('click', h))
    })
  }
})
onBeforeUnmount(() => cleanups.forEach((f) => f()))
</script>

<template><span hidden /></template>
