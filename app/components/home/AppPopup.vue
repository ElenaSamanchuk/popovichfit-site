<script setup lang="ts">
// old-site: попап «Скачать мобильное приложение» — T1093 #rec1120250471 (#app) с Zero Block #rec1120250466:
// белая карточка 292×162, крестик, иконки App Store / Google Play.
import { links } from '~/data/links'
</script>

<template>
  <Modal name="app" :width="292" overlay="light" bare>
    <div class="relative rounded-[10px] bg-white px-[21px] pb-[24px] pt-[25px]">
      <a href="#closepopup" class="absolute -right-[4px] -top-[12px]" aria-label="Закрыть">
        <img src="/img/home/group_1321319975.svg" alt="" width="28" height="28">
      </a>
      <p class="w-[250px] text-[14px] font-bold leading-[1.35] text-ink max-xs:text-[12px]">Скачать мобильное приложение <span class="text-[#4f86c4]">«POPOVICHFIT - умный фитнес»</span></p>
      <div class="mt-[24px] flex justify-center gap-[54px] max-xs:gap-[40px]">
        <a :href="links.appStore" target="_blank" rel="noopener" class="flex flex-col items-center gap-[8px] text-[12px] font-medium leading-[1.3] text-ink max-xs:text-[10px]">
          <img src="/img/home/group_1321318877.svg" alt="" width="30" height="30">App Store
        </a>
        <a :href="links.googlePlay" target="_blank" rel="noopener" class="flex flex-col items-center gap-[8px] text-[12px] font-medium leading-[1.3] text-ink max-xs:text-[10px]">
          <img src="/img/home/group_1321318878.svg" alt="" width="30" height="30">Google Play
        </a>
      </div>
    </div>
  </Modal>
</template>
