<script setup lang="ts">
// old-site: главная, «Наталья Попович — тренер, создатель POPOVICHFIT» — Zero Block #rec1120250501 (заголовок,
// 160px / 121 на мобиле) + #rec1120250526 (артборд 1200×510; 320×800): четыре белые карточки 260×197 в две колонки
// и фото 602×408 справа с кнопкой «Подробнее о Наталье». На мобиле карточки и фото в столбик.
import { links } from '~/data/links'
</script>

<template>
  <section class="pf-trainer relative" aria-labelledby="trainer-title">
    <!-- десктоп / планшет -->
    <div class="relative pt-[92px] lg:h-[670px] max-sm:hidden">
      <div class="pf-container">
        <div class="flex items-start justify-between">
          <h2 id="trainer-title" class="w-[560px] max-w-full text-[30px] font-semibold uppercase leading-[1.3] text-ink">Наталья Попович</h2>
          <p class="mt-[25px] whitespace-nowrap text-[10px] font-bold leading-[1.3] text-ink">тренер, создатель POPOVICHFIT</p>
        </div>
        <div class="mt-[29px] flex items-start gap-[24px] max-md:flex-col">
          <div class="grid w-[536px] shrink-0 grid-cols-2 gap-[14px] max-md:w-full">
            <div class="relative h-[197px] rounded-[10px] bg-white">
              <img src="/img/home/group_1321319608.svg" alt="" width="31" height="7" class="absolute left-[20px] top-[20px]">
              <p class="absolute left-[20px] top-[139px] w-[186px] text-[14px] font-bold leading-[1.35] text-ink">POPOVICHFIT — мой путь длиной в 12 лет.</p>
            </div>
            <div class="relative h-[197px] rounded-[10px] bg-white">
              <img src="/img/home/group_1321319634.svg" alt="" width="31" height="7" class="absolute left-[20px] top-[20px]">
              <p class="absolute left-[20px] top-[82px] w-[214px] text-[14px] font-medium leading-[1.35] text-ink">Я создала курсы, которые помогают женщинам вернуть контроль над телом, не сражаясь с собой, а поддерживая.</p>
            </div>
            <div class="relative h-[197px] rounded-[10px] bg-white">
              <img src="/img/home/group_1321319635.svg" alt="" width="31" height="7" class="absolute left-[20px] top-[20px]">
              <p class="absolute left-[20px] top-[82px] w-[214px] text-[14px] font-medium leading-[1.35] text-ink">Тысячи отзывов, десятки запусков, и тысячи благодарных участниц — это не просто программа. Это сообщество.</p>
            </div>
            <div class="relative h-[197px] rounded-[10px] bg-white">
              <p class="absolute left-[20px] top-[20px] text-[10px] font-bold uppercase leading-[1.3] text-[#9d9da0]">#соц сети</p>
              <a :href="links.telegramNatalya" class="absolute left-[20px] top-[45px] flex items-center gap-[10px] text-[12px] font-medium leading-[1.3] text-black"><img src="/img/home/group_1321318754_1.svg" alt="" width="28" height="28">Telegram-канал</a>
              <a :href="links.instagram" target="_blank" rel="noopener" class="absolute left-[20px] top-[80px] flex items-center gap-[10px] text-[12px] font-medium leading-[1.3] text-black"><img src="/img/home/telegram_logo_icon_1.svg" alt="" width="28" height="28">Instagram*</a>
              <a :href="links.youtube" target="_blank" rel="noopener" class="absolute left-[8px] top-[120px] flex h-[69px] w-[244px] items-center rounded-[10px] bg-[#f5f5f4]">
                <img src="/img/home/image_4_1.svg" alt="" width="44" height="44" class="ml-[12px]">
                <span class="ml-[11px] w-[168px] text-[12px] font-medium leading-[1.3] text-black">Бесплатные материалы и&nbsp;тренировки для знакомства с&nbsp;POPOVICHFIT</span>
              </a>
            </div>
          </div>
          <div class="relative h-[408px] w-full overflow-hidden rounded-[8px] bg-no-repeat" style="background-image: url('/img/home/image_4.webp'); background-size: 100% auto" role="img" aria-label="Наталья Попович">
            <NuxtLink to="/about" class="absolute left-[22px] top-[355px] flex h-[31px] w-[180px] items-center justify-between rounded-[50px] bg-white/[0.13] pl-[13px] pr-[13px] text-[12px] font-bold leading-[1.3] text-white shadow-[0_2px_6px_0_rgba(40,40,41,0.4)] transition-colors hover:bg-white/30">
              Подробнее о Наталье
              <img src="/img/home/group_1321318787-ad8e58.svg" alt="" width="11" height="11">
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- мобайл: артборды 320×121 + 320×800 -->
    <div class="pf-m hidden h-[calc(921*var(--u))] max-sm:block">
      <h2 class="absolute left-[calc(15*var(--u))] top-[calc(61*var(--u))] text-[18px] font-semibold uppercase leading-[1.3] text-ink">Наталья Попович</h2>
      <p class="absolute left-[calc(15*var(--u))] top-[calc(89*var(--u))] text-[10px] font-bold leading-[1.3] text-ink">тренер, создатель POPOVICHFIT</p>
      <div class="absolute left-[calc(15*var(--u))] top-[calc(121*var(--u))] h-[calc(109*var(--u))] w-[calc(290*var(--u))] rounded-[10px] bg-white">
        <img src="/img/home/group_1321319608.svg" alt="" width="31" height="7" class="absolute left-[calc(15*var(--u))] top-[calc(16*var(--u))]">
        <p class="absolute left-[calc(15*var(--u))] top-[calc(62*var(--u))] w-[calc(196*var(--u))] text-[12px] font-bold leading-[1.35] text-ink">POPOVICHFIT — мой путь длиной в 12 лет.</p>
      </div>
      <div class="absolute left-[calc(15*var(--u))] top-[calc(241*var(--u))] h-[calc(125*var(--u))] w-[calc(290*var(--u))] rounded-[10px] bg-white">
        <img src="/img/home/group_1321319634.svg" alt="" width="31" height="7" class="absolute left-[calc(15*var(--u))] top-[calc(15*var(--u))]">
        <p class="absolute left-[calc(15*var(--u))] top-[calc(61*var(--u))] w-[calc(255*var(--u))] text-[12px] font-medium leading-[1.35] text-ink">Я создала курсы, которые помогают женщинам вернуть контроль над телом, не сражаясь с собой, а поддерживая.</p>
      </div>
      <div class="absolute left-[calc(15*var(--u))] top-[calc(375*var(--u))] h-[calc(125*var(--u))] w-[calc(290*var(--u))] rounded-[10px] bg-white">
        <img src="/img/home/group_1321319635.svg" alt="" width="31" height="7" class="absolute left-[calc(15*var(--u))] top-[calc(15*var(--u))]">
        <p class="absolute left-[calc(15*var(--u))] top-[calc(63*var(--u))] w-[calc(267*var(--u))] text-[12px] font-medium leading-[1.35] text-ink">Тысячи отзывов, десятки запусков, и тысячи благодарных участниц — это не просто программа. Это сообщество.</p>
      </div>
      <div class="absolute left-[calc(15*var(--u))] top-[calc(511*var(--u))] h-[calc(154*var(--u))] w-[calc(290*var(--u))] rounded-[10px] bg-white">
        <p class="absolute left-[calc(15*var(--u))] top-[calc(15*var(--u))] text-[10px] font-bold uppercase leading-[1.3] text-[#9d9da0]">#соц сети</p>
        <a :href="links.telegramNatalya" class="absolute left-[calc(15*var(--u))] top-[calc(43*var(--u))] flex items-center gap-[calc(7*var(--u))] text-[10px] font-medium leading-[1.3] text-black"><img src="/img/home/group_1321318754_1.svg" alt="" width="25" height="25" class="h-[calc(25*var(--u))] w-[calc(25*var(--u))]">Telegram-канал</a>
        <a :href="links.instagram" target="_blank" rel="noopener" class="absolute left-[calc(155*var(--u))] top-[calc(43*var(--u))] flex items-center gap-[calc(9*var(--u))] text-[10px] font-medium leading-[1.3] text-black"><img src="/img/home/telegram_logo_icon_1.svg" alt="" width="25" height="25" class="h-[calc(25*var(--u))] w-[calc(25*var(--u))]">Instagram*</a>
        <a :href="links.youtube" target="_blank" rel="noopener" class="absolute left-[calc(15*var(--u))] top-[calc(83*var(--u))] flex h-[calc(56*var(--u))] w-[calc(260*var(--u))] items-center rounded-[10px] bg-[#f5f5f4]">
          <img src="/img/home/image_4_1.svg" alt="" width="36" height="36" class="ml-[calc(10*var(--u))] h-[calc(36*var(--u))] w-[calc(36*var(--u))]">
          <span class="ml-[calc(10*var(--u))] w-[calc(201*var(--u))] text-[10px] font-medium leading-[1.3] text-black">Бесплатные материалы и&nbsp;тренировки для знакомства с&nbsp;POPOVICHFIT</span>
        </a>
      </div>
      <div class="absolute left-[calc(15*var(--u))] top-[calc(675*var(--u))] h-[calc(184*var(--u))] w-[calc(290*var(--u))] overflow-hidden rounded-[8px] bg-no-repeat" style="background-image: url('/img/home/image_4.webp'); background-position: 47.216% 30.726%; background-size: 137.808% auto" role="img" aria-label="Наталья Попович">
        <NuxtLink to="/about" class="absolute left-[calc(12*var(--u))] top-[calc(140*var(--u))] flex h-[calc(31*var(--u))] w-[calc(180*var(--u))] items-center justify-between rounded-[50px] bg-white/[0.13] pl-[calc(13*var(--u))] pr-[calc(12*var(--u))] text-[12px] font-bold leading-[1.3] text-white shadow-[0_2px_6px_0_rgba(40,40,41,0.4)]">
          Подробнее о Наталье
          <img src="/img/home/group_1321318787-ad8e58.svg" alt="" width="11" height="11">
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
