<script setup lang="ts">
// Универсальный попап (замена T1093 zero-попапов, T868/T331 видео-попапов, T390 текстовых, T746 галерей).
// Открывается по hash-ссылке (см. useModal / plugins/modal-links.client.ts) или программно.
const props = withDefaults(defineProps<{
  /** имя из hash без «#»: 'zeropopup', 'popup:embedcode', 'dop', 'app'… */
  name: string
  /** ширина контейнера (px) на десктопе */
  width?: number
  /** оверлей: dark — как у T868/T746 (rgba(0,0,0,.8)), dim — как у zero-попапов T1093 (rgba(0,0,0,.3) на живом сайте), light — белый */
  overlay?: 'dark' | 'light' | 'dim'
  /** без белой подложки (например, для видео) */
  bare?: boolean
}>(), { width: 960, overlay: 'dark', bare: false })

const modal = useModal()
const isOpen = computed(() => modal.active.value === props.name)
const emit = defineEmits<{ open: []; close: [] }>()

onMounted(() => modal.register(props.name))
onBeforeUnmount(() => modal.unregister(props.name))
watch(isOpen, (v) => { v ? emit('open') : emit('close') })

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) modal.close()
}
onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <Transition name="pf-modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[100000] overflow-y-auto"
        :class="overlay === 'dark' ? 'bg-black/80' : overlay === 'dim' ? 'bg-black/30' : 'bg-white/90'"
        role="dialog"
        aria-modal="true"
        @click.self="modal.close()"
      >
        <button
          type="button"
          class="fixed right-[20px] top-[20px] z-[2] flex h-[23px] w-[23px] items-center justify-center max-xs:right-[12px] max-xs:top-[12px]"
          aria-label="Закрыть диалоговое окно"
          @click="modal.close()"
        >
          <svg width="23" height="23" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg" role="presentation">
            <g :fill="overlay === 'light' ? '#000' : '#fff'" fill-rule="evenodd">
              <rect transform="translate(11.313708, 11.313708) rotate(-45) translate(-11.313708, -11.313708)" x="10.3137085" y="-3.6862915" width="2" height="30" />
              <rect transform="translate(11.313708, 11.313708) rotate(-315) translate(-11.313708, -11.313708)" x="10.3137085" y="-3.6862915" width="2" height="30" />
            </g>
          </svg>
        </button>
        <div class="flex min-h-full items-center justify-center px-[20px] py-[60px] max-xs:px-[10px] max-xs:py-[40px]">
          <div
            class="relative w-full"
            :class="bare ? '' : 'rounded-[10px] bg-white'"
            :style="{ maxWidth: width + 'px' }"
            @click.stop
          >
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.pf-modal-enter-active, .pf-modal-leave-active { transition: opacity 0.3s ease; }
.pf-modal-enter-from, .pf-modal-leave-to { opacity: 0; }
html.pf-modal-open, html.pf-modal-open body { overflow: hidden; }
</style>
