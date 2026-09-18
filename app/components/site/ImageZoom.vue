<script setup lang="ts">
// Просмотр картинки крупно (замена tilda-zoom): клик по img[data-zoomable="yes"] (статьи, галереи T979) открывает
// оверлей с картинкой на весь экран; стрелки/клавиши листают картинки того же блока, Esc/клик по фону закрывает.
const open = ref(false)
const list = ref<string[]>([])
const idx = ref(0)
const src = computed(() => list.value[idx.value] || '')
function show(img: HTMLImageElement) {
  const scope = img.closest<HTMLElement>('[data-tilda-rec], .tz, .tb') || document.body
  const imgs = [...scope.querySelectorAll<HTMLImageElement>('img[data-zoomable="yes"]')]
  list.value = (imgs.length ? imgs : [img]).map((i) => i.currentSrc || i.src)
  idx.value = Math.max(0, imgs.indexOf(img))
  open.value = true
  document.documentElement.classList.add('pf-modal-open')
}
function close() { open.value = false; document.documentElement.classList.remove('pf-modal-open') }
function step(d: number) { if (list.value.length > 1) idx.value = (idx.value + d + list.value.length) % list.value.length }
function onClick(e: MouseEvent) {
  const img = (e.target as HTMLElement | null)?.closest<HTMLImageElement>('img[data-zoomable="yes"]')
  if (!img || img.closest('a[href]')) return
  e.preventDefault(); show(img)
}
function onKey(e: KeyboardEvent) {
  if (!open.value) return
  if (e.key === 'Escape') close()
  if (e.key === 'ArrowRight') step(1)
  if (e.key === 'ArrowLeft') step(-1)
}
onMounted(() => { document.addEventListener('click', onClick); document.addEventListener('keydown', onKey) })
onBeforeUnmount(() => { document.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey) })
</script>

<template>
  <Teleport to="body">
    <Transition name="pf-modal">
      <div v-if="open" class="pf-zoom fixed inset-0 z-[100001] flex items-center justify-center bg-black/90" role="dialog" aria-modal="true" aria-label="Просмотр изображения" @click.self="close">
        <button type="button" class="fixed right-[20px] top-[20px] z-[2] flex h-[23px] w-[23px] items-center justify-center max-xs:right-[12px] max-xs:top-[12px]" aria-label="Закрыть" @click="close">
          <svg width="23" height="23" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg" role="presentation"><g fill="#fff" fill-rule="evenodd"><rect transform="translate(11.313708, 11.313708) rotate(-45) translate(-11.313708, -11.313708)" x="10.3137085" y="-3.6862915" width="2" height="30" /><rect transform="translate(11.313708, 11.313708) rotate(-315) translate(-11.313708, -11.313708)" x="10.3137085" y="-3.6862915" width="2" height="30" /></g></svg>
        </button>
        <button v-if="list.length > 1" type="button" class="pf-zoom__arrow left-[10px]" aria-label="Предыдущая" @click.stop="step(-1)"><svg viewBox="0 0 7.3 13" width="12" height="22" role="presentation"><polyline fill="none" stroke="#fff" stroke-width="1.2" points="6.5,0.5 0.5,6.5 6.5,12.5" /></svg></button>
        <button v-if="list.length > 1" type="button" class="pf-zoom__arrow right-[10px]" aria-label="Следующая" @click.stop="step(1)"><svg viewBox="0 0 7.3 13" width="12" height="22" role="presentation"><polyline fill="none" stroke="#fff" stroke-width="1.2" points="0.5,0.5 6.5,6.5 0.5,12.5" /></svg></button>
        <Transition name="pf-zoom-img" mode="out-in">
          <img :key="src" :src="src" alt="" class="pf-modal__box pf-zoom__img" @click.stop="step(1)">
        </Transition>
        <div v-if="list.length > 1" class="fixed bottom-[16px] left-0 right-0 text-center text-[13px] text-white/70">{{ idx + 1 }} / {{ list.length }}</div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.pf-zoom__img { max-width: calc(100vw - 40px); max-height: calc(100vh - 40px); width: auto; height: auto; object-fit: contain; cursor: zoom-out; border-radius: 4px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5); }
.pf-zoom__arrow { position: fixed; top: 50%; transform: translateY(-50%); width: 44px; height: 44px; border-radius: 50%; background: rgba(255, 255, 255, 0.15); display: flex; align-items: center; justify-content: center; transition: background-color 0.2s ease-in-out; }
.pf-zoom__arrow:hover { background: rgba(255, 255, 255, 0.3); }
.pf-zoom-img-enter-active, .pf-zoom-img-leave-active { transition: opacity 0.2s ease; }
.pf-zoom-img-enter-from, .pf-zoom-img-leave-to { opacity: 0; }
</style>
