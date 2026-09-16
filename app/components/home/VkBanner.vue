<script setup lang="ts">
// old-site: главная, баннер «Чтобы ничего не потерялось, мы дублируем всю информацию в другие соц. сети»
// — Zero Block #rec2314997581 (артборд 1200×150; 320×75). Синий фон-картинка (main_container.svg),
// иконка ВК, текст, кнопка «ПЕРЕЙТИ В ВК» (на мобиле — маленькая круглая кнопка-стрелка справа сверху).
import { links } from '~/data/links'
</script>

<template>
  <section class="pf-vk-banner relative" aria-label="Мы во ВКонтакте">
    <!-- десктоп / планшет -->
    <div class="relative h-[150px] max-sm:hidden">
      <div class="pf-art h-full">
        <a :href="links.vk" target="_blank" rel="noopener" class="absolute left-[20px] top-[11px] block h-[129px] w-[1160px] max-w-[calc(100%-40px)] rounded-[10px] bg-no-repeat text-white" style="background-image: url('/img/home/main_container.svg'); background-position: 50% 50%; background-size: 102.4% auto">
          <img src="/img/home/rectangle.png" alt="" width="60" height="65" class="absolute left-[40px] top-[32px] h-[65px] w-[60px]">
          <span class="absolute left-[127px] top-[24px] w-[466px] text-[18px] font-bold uppercase leading-[1.35]">Чтобы ничего не потерялось, мы дублируем всю информацию в другие соц. сети.</span>
          <span class="absolute left-[127px] top-[82px] text-[14px] font-medium leading-[1.35]">Если не работает Телеграм — переходите ВК</span>
          <span class="absolute left-[918px] top-[42px] flex h-[46px] w-[200px] items-center justify-center gap-[8px] rounded-[6px] bg-white text-[12px] font-bold uppercase leading-[1.2] text-ink shadow-[0_2px_6px_0_rgba(28,29,30,0.3)] max-lg:left-auto max-lg:right-[20px]">
            Перейти в ВК
            <img src="/img/home/group_1321318787-ad8e58.svg" alt="" width="10" height="10">
          </span>
        </a>
      </div>
    </div>
    <!-- мобайл: артборд 320×75 -->
    <div class="pf-m hidden h-[calc(75*var(--u))] max-sm:block">
      <a :href="links.vk" target="_blank" rel="noopener" class="absolute left-[calc(15*var(--u))] top-[calc(6*var(--u))] block h-[calc(64*var(--u))] w-[calc(290*var(--u))] rounded-[8px] bg-no-repeat text-white" style="background-image: url('/img/home/main_container.svg'); background-position: 6.725% 0; background-size: 198.45% auto">
        <span class="absolute left-[calc(10*var(--u))] top-[calc(10*var(--u))] w-[calc(262*var(--u))] text-[10px] font-bold uppercase leading-[1.35]">Чтобы ничего не потерялось, мы дублируем всю информацию в другие соц. сети.</span>
        <span class="absolute left-[calc(10*var(--u))] top-[calc(42*var(--u))] w-[calc(199*var(--u))] text-[8px] font-medium leading-[1.35]">Если не работает Телеграм — переходите ВК</span>
        <img src="/img/home/rectangle.png" alt="" width="25" height="25" class="absolute left-[calc(260*var(--u))] top-[calc(33*var(--u))] h-[calc(25*var(--u))] w-[calc(25*var(--u))]">
        <span class="absolute left-[calc(270*var(--u))] top-[calc(5*var(--u))] flex h-[calc(15*var(--u))] w-[calc(15*var(--u))] items-center justify-center rounded-full bg-white">
          <img src="/img/home/group_1321318787-ad8e58.svg" alt="" width="7" height="7">
        </span>
      </a>
    </div>
  </section>
</template>
