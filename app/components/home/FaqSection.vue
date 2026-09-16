<script setup lang="ts">
// old-site: «Ответы на вопросы» — Zero Block #rec2011844911 (заголовок + розовая пилюля «ТЕХ. ПОДДЕРЖКА», 80px)
// и аккордеон T585 (#rec2011845191 на главной, 593px): сетка t-col_3 — 4 колонки по 260px с промежутками 40px,
// пункты идут по строкам. Якорь #question-answer — на него ведут шапка и меню.
import { faq } from '~/data/faq'
import { links } from '~/data/links'

const props = defineProps<{ faqKey: string }>()
const items = computed(() => faq[props.faqKey] ?? [])
</script>

<template>
  <section id="question-answer" class="pf-faq relative scroll-mt-[44px] pt-[8px] pb-[90px] max-sm:pb-[40px] max-sm:pt-0" aria-labelledby="faq-title">
    <div class="pf-container max-sm:px-[calc(10*var(--u))] max-sm:[--u:0.3125vw]">
      <div class="flex items-center justify-between max-sm:relative max-sm:h-[calc(52*var(--u))] max-sm:items-start">
        <h2 id="faq-title" class="w-[545px] max-w-full text-[30px] font-semibold uppercase leading-[1.1] text-ink max-sm:absolute max-sm:left-0 max-sm:top-[calc(11*var(--u))] max-sm:w-[calc(205*var(--u))] max-sm:text-[17px]">Ответы на вопросы</h2>
        <a :href="links.supportBot" target="_blank" class="flex h-[26px] w-[130px] shrink-0 items-center justify-between rounded-[40px] bg-[#f83e60] pl-[7px] pr-[5px] text-[10px] font-bold uppercase leading-none text-white transition-opacity hover:opacity-90 max-sm:absolute max-sm:left-[calc(199*var(--u))] max-sm:top-[calc(11*var(--u))] max-sm:h-[calc(20*var(--u))] max-sm:w-[calc(101*var(--u))] max-sm:pl-[calc(6*var(--u))] max-sm:pr-[calc(4*var(--u))] max-sm:text-[8px]">
          ТЕХ. ПОДДЕРЖКА
          <img src="/img/home/group_1321318843.svg" alt="" width="18" height="18" class="max-sm:w-[12px]">
        </a>
      </div>
      <div class="pf-faq__grid mt-[39px] grid items-start max-sm:mt-[calc(10*var(--u))]">
        <Accordion :items="items" />
      </div>
    </div>
  </section>
</template>

<style scoped>
/* сетка Тильды (t-container / t-col_3): >1200px — 4×260 с промежутками 40; 960–1200 — контейнер 960, 4×220 с 20;
   640–959 — 2 колонки; <640 — одна */
.pf-faq__grid { grid-template-columns: repeat(4, 260px); column-gap: 40px; justify-content: space-between; }
@media (max-width: 1200px) { .pf-faq__grid { grid-template-columns: repeat(4, 220px); column-gap: 20px; justify-content: center; } }
@media (max-width: 959.98px) { .pf-faq__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 20px; } }
@media (max-width: 639.98px) { .pf-faq__grid { grid-template-columns: minmax(0, 1fr); } }
</style>
