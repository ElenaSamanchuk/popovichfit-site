<script setup lang="ts">
// old-site: кнопка «наверх» T890 #rec541441588 (слева снизу, 50×50, белый круг 90%, тень), появляется
// после прокрутки на высоту экрана.
const visible = ref(false)
function onScroll() {
  visible.value = window.scrollY > window.innerHeight
}
onMounted(() => { onScroll(); window.addEventListener('scroll', onScroll, { passive: true }) })
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
function toTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <button
    type="button"
    class="fixed bottom-[20px] left-[20px] z-[99990] h-[50px] w-[50px] origin-bottom-left scale-[0.8] transition-[opacity,transform] duration-300"
    :class="visible ? 'opacity-100' : 'pointer-events-none opacity-0'"
    aria-label="Вернуться к началу страницы"
    @click="toTop"
  >
    <svg width="50" height="50" fill="none" xmlns="http://www.w3.org/2000/svg" role="presentation" class="drop-shadow-[0_0_10px_rgba(0,0,0,0.2)]">
      <rect width="50" height="50" rx="50" fill="#ffffff" fill-opacity="0.9" />
      <path d="M14 28L25 18l10 10" stroke="#000000" stroke-width="1" fill="none" />
    </svg>
  </button>
</template>
