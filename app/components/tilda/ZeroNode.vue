<script setup lang="ts">
// Узел дерева Zero Block: элемент или группа (tn-group). Группа = абсолютный контейнер (.g<id>) с молекулой
// (.tz__mol — flex-раскладка из CSS экспорта); элементы/группы с флагом flex — flex-дети молекулы
// (position: relative, как .t396__elem-flex у Тильды), остальные — абсолютные по своим координатам.
// Карточки тарифов (pf-card--<ключ>): ключ передаётся вниз через provide, чтобы SSR сразу отрисовал
// выбранный по умолчанию вариант (pf-active), цены и ссылку «Купить» из app/data/tariffs.ts.
import type { ZeroElem, ZeroNode } from '~/utils/tilda-css'
import { tariffs } from '~/data/tariffs'

const props = defineProps<{ node: ZeroNode; elems: Map<string, ZeroElem>; optionIndex?: number }>()

const parentKey = inject<string | null>('pfKey', null)
const ownKey = computed(() => (props.node.kind === 'group' ? props.node.cls.split(' ').find((c) => c.startsWith('pf-card--'))?.slice(9) ?? null : null))
const pfKey = computed(() => ownKey.value ?? parentKey)
provide('pfKey', pfKey.value)

const isOption = computed(() => props.node.kind === 'group' && props.node.cls.split(' ').includes('pf-option'))
const isActive = computed(() => isOption.value && pfKey.value && tariffs[pfKey.value] && (tariffs[pfKey.value]!.defaultOption || 0) === (props.optionIndex ?? -1))

/** индекс pf-option среди детей (для подсветки варианта по умолчанию) */
function optionIndexOf(children: ZeroNode[], i: number) {
  let n = -1
  for (let j = 0; j <= i; j++) { const c = children[j]!; if (c.kind === 'group' && c.cls.split(' ').includes('pf-option')) n++ }
  return n
}
</script>

<template>
  <template v-if="node.kind === 'elem'">
    <ZeroElem v-if="elems.get(node.id)" :elem="elems.get(node.id)!" />
  </template>
  <div v-else class="tz__group" :class="['g' + node.id, node.cls, node.flex ? 'tz__flex' : 'absolute', isActive ? 'pf-active' : '']">
    <div class="tz__mol relative h-full w-full">
      <ZeroNode v-for="(child, i) in node.children" :key="child.id + i" :node="child" :elems="elems" :option-index="optionIndexOf(node.children, i)" />
    </div>
  </div>
</template>
