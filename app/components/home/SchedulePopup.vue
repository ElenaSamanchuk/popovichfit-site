<script setup lang="ts">
// old-site: попап «Расписание потоков» — T1093 #rec1120249991 (#zeropopup) с содержимым Zero Block
// #rec1120250141: две белые карточки (расписание / бот предзаписи), крестик, фото.
import { links } from '~/data/links'
import { schedule } from '~/data/schedule'
const s = schedule.popup
</script>

<template>
  <Modal name="zeropopup" :width="680" overlay="light" bare>
    <div class="relative flex items-start gap-[10px] pr-[38px] max-sm:flex-col max-sm:pr-0 max-sm:pt-[30px]">
      <!-- расписание -->
      <div class="w-[346px] rounded-[10px] bg-white px-[20px] pb-[26px] pt-[20px] max-sm:w-full max-xs:px-[14px]">
        <p class="text-[14px] font-bold leading-[1.35] text-[#9d9da0] max-xs:text-[12px]">{{ s.kicker }}</p>
        <p class="mt-[12px] w-[316px] max-w-full text-[14px] font-bold leading-[1.35] text-ink max-xs:text-[12px]">{{ s.lead }}</p>
        <p class="mt-[30px] text-[14px] font-bold leading-[1.35] text-ink max-xs:mt-[24px] max-xs:text-[12px]">{{ s.listTitle }}</p>
        <ul class="mt-[12px] list-none p-0">
          <li v-for="f in s.flows" :key="f.number" class="mb-[13px] max-xs:mb-[10px]">
            <span class="block text-[14px] font-semibold leading-[1.35] text-[#4f86c4] max-xs:text-[12px]">Поток {{ f.number }}</span>
            <span class="block text-[12px] font-semibold leading-[1.3] text-[#9d9da0] max-xs:text-[10px]">{{ f.dates }}</span>
          </li>
        </ul>
      </div>
      <!-- бот предзаписи -->
      <div class="w-[274px] rounded-[10px] bg-white p-[5px] pb-[20px] max-sm:w-full">
        <img src="/img/home/rectangle_29111.webp" alt="" width="264" height="165" class="h-[165px] w-full rounded-[10px] object-cover">
        <div class="px-[9px]">
          <span class="mt-[14px] inline-flex h-[23px] items-center gap-[9px] rounded-[40px] bg-ink px-[13px] text-[10px] font-bold uppercase leading-[1.3] text-white">
            <img src="/img/home/vector.svg" alt="" width="12" height="11">{{ s.botPill }}
          </span>
          <p class="mt-[12px] text-[14px] font-bold leading-[1.35] text-ink max-xs:text-[12px]">{{ s.botTitle }}</p>
          <p class="mt-[14px] text-[12px] font-semibold leading-[1.3] text-[#9d9da0] max-xs:text-[10px]" v-html="s.botBenefitsHtml" />
          <a :href="links.preorderBot" class="pf-btn-blue mt-[18px] flex h-[41px] w-[246px] max-w-full items-center justify-center rounded-[6px] text-[12px] font-bold uppercase leading-[1.55] text-white shadow-[0_2px_6px_0_rgba(78,83,89,0.2)] max-xs:h-[36px] max-xs:text-[10px]">{{ s.botButton }}</a>
        </div>
      </div>
      <a href="#closepopup" class="absolute right-0 top-0 max-sm:right-[10px] max-sm:top-0" aria-label="Закрыть">
        <img src="/img/home/group_1321319975.svg" alt="" width="28" height="28">
      </a>
    </div>
  </Modal>
</template>
