<script setup lang="ts">
// Аккордеон в стиле T585 Тильды: пункт = border-top #dbdbdb, кнопка с padding 27px 50px 27px 0, заголовок
// 13px/1.35 600, иконка «плюс» справа (при наведении/открытии — синий круг #4f86c4, плюс поворачивается в крест).
// Рендерится «display: contents», чтобы пункты были прямыми детьми сетки родителя (как t-col в Тильде).
import type { FaqItem } from '~/data/faq'
defineProps<{ items: FaqItem[] }>()
</script>

<template>
  <div class="pf-accordion contents">
    <details v-for="(item, i) in items" :key="i" class="pf-accordion__item group self-start border-t border-[#dbdbdb]">
      <summary class="relative block cursor-pointer list-none py-[27px] pr-[50px] [&::-webkit-details-marker]:hidden max-xs:py-[15px]">
        <span class="block text-[13px] font-semibold leading-[1.35] text-ink max-xs:text-[12px]">{{ item.title }}</span>
        <span class="pf-accordion__icon absolute right-0 top-1/2 flex h-[40px] w-[40px] -translate-y-1/2 items-center justify-center rounded-full transition-colors group-hover:bg-[#4f86c4]">
          <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="presentation" class="transition-transform duration-300 group-open:-rotate-45">
            <path d="M12 4v16M4 12h16" stroke="#303030" stroke-width="1.2" class="group-hover:stroke-white" />
          </svg>
        </span>
      </summary>
      <div class="pb-[20px] pr-[10px]">
        <div class="pf-accordion__text text-[11px] font-light leading-[1.55] text-[#9d9da0] max-xs:text-[10px]" v-html="item.html" />
      </div>
    </details>
  </div>
</template>

<style scoped>
.pf-accordion__item[open] .pf-accordion__icon { background-color: #4f86c4; }
.pf-accordion__item[open] .pf-accordion__icon path { stroke: #fff; }
.pf-accordion__text :deep(a) { color: #4f86c4; text-decoration: underline; }
</style>
