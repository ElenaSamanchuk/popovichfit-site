<script setup lang="ts">
// Универсальный рендер Zero Block (T396) из данных экспорта (app/data/tilda/*.json).
// Секция фиксированной высоты артборда (по 5 диапазонам ширин), элементы позиционируются абсолютно
// CSS-правилами из utils/tilda-css.ts — то же поведение, что у Тильды, без её runtime.
import { zeroBlockCss, type TildaBlock, type ZeroElem, type ZeroNode } from '~/utils/tilda-css'
import { initPfCards } from '~/utils/pf-cards'

const props = defineProps<{ block: TildaBlock }>()
const css = computed(() => zeroBlockCss(props.block))
useHead({ style: [{ key: 'zb-' + props.block.id, innerHTML: css.value }] })

const elemMap = computed(() => new Map((props.block.elems ?? []).map((e) => [e.id, e as ZeroElem])))
/** дерево (новые данные) или плоский список (совместимость) */
const tree = computed<ZeroNode[]>(() => props.block.tree ?? (props.block.elems ?? []).map((e) => ({ kind: 'elem', id: e.id })))
const fixedStyle = computed(() => {
  const a = props.block.artboard
  if (!a?.fixed) return undefined
  return { position: 'fixed', left: 0, width: '100%', zIndex: 1000, [a.fixedPos === 'bottom' ? 'bottom' : 'top']: 0 } as Record<string, string | number>
})
const root = ref<HTMLElement | null>(null)
// карточки тарифов внутри блока — после гидрации этого компонента (плагин может отработать раньше)
onMounted(() => { if (root.value?.querySelector('.pf-card')) nextTick(() => initPfCards(root.value!)) })
const isEmpty = computed(() => !(props.block.elems?.length || props.block.groups?.length))
/** отступы t-rec (padding-top/bottom) — артборд лежит внутри секции с этими отступами */
const padStyle = computed(() => {
  const p = props.block.pad || {}
  const st: Record<string, string> = {}
  if (p['padding-top']) st.paddingTop = p['padding-top'] + 'px'
  // сайт-wide правка из T123 экспорта: .t-rec_pb_75 { padding-bottom: 0 !important } (на 178 страницах)
  if (p['padding-bottom'] && p['padding-bottom'] !== 75) st.paddingBottom = p['padding-bottom'] + 'px'
  return st
})
</script>

<template>
  <section
    v-if="!isEmpty"
    :id="block.id"
    ref="root"
    class="tz relative w-full overflow-visible box-content"
    :class="block.uc"
    :style="[fixedStyle, block.bg ? { backgroundColor: block.bg } : undefined, block.artboard?.ovrflw === 'auto' ? { overflowX: 'auto', overflowY: 'hidden' } : undefined, padStyle]"
    :data-tilda-rec="block.id"
  >
    <div class="tz__art relative w-full">
      <ZeroNode v-for="(n, i) in tree" :key="n.id + i" :node="n" :elems="elemMap" />
    </div>
  </section>
</template>

<style>
.tz .tz__el { position: absolute; box-sizing: border-box; }
.tz .tz__flex { position: relative !important; left: auto !important; top: auto !important; right: auto !important; height: fit-content; flex-shrink: 0; }
.tz .tz__group.absolute { position: absolute; }
.tz .tz__el--text { overflow-wrap: break-word; }
.tz .tz__el--button { display: flex; align-items: center; justify-content: center; text-align: center; white-space: nowrap; column-gap: 8px; }
.tz .tz__icon { display: inline-block; flex-shrink: 0; background-color: currentColor; -webkit-mask-size: contain; mask-size: contain; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; -webkit-mask-position: center; mask-position: center; }
.tz .tz__el--image img, .tz .tz__el--vector svg { display: block; width: 100%; height: auto; }
.tz .tz__el--shape { background-repeat: no-repeat; }
.tz .tz__el--video, .tz .tz__el--html { overflow: hidden; }
.tz .tz__el--html > div { position: relative; width: 100%; height: 100%; }
.tz a.tz__el, .tz .tz__el a { color: inherit; text-decoration: none; }
.tz .tz__el--text a { text-decoration: none; }
</style>
