<script setup lang="ts">
// old-site: главная, «Выбирайте курс под свои цели» — Zero Block #rec1120250416 (артборд 1200×664; 320×990).
// Якорь: шапка и кнопки ведут на «/#courses»; старый якорь «#rec1120250416» сохранён как алиас.
// Две карточки курсов с фото, видео-карточка (#popup:embedcode, Kinescope) и баннер бота предзаписи.
import { links } from '~/data/links'
</script>

<template>
  <section id="courses" class="pf-courses relative scroll-mt-[44px]" aria-labelledby="courses-title">
    <span id="rec1120250416" class="absolute top-0" aria-hidden="true" />

    <!-- ===== десктоп / планшет (≥640) ===== -->
    <div class="relative pt-[90px] pb-[10px] lg:h-[664px] max-sm:hidden">
      <div class="pf-container relative">
        <div class="flex items-start justify-between">
          <h2 id="courses-title" class="w-[327px] max-w-full text-[30px] font-semibold uppercase leading-[1.3] text-ink">Выбирайте курс под свои цели</h2>
          <p class="mt-[65px] w-[142px] text-right text-[10px] font-bold uppercase leading-[1.3] text-[#9d9da0]">#курсы</p>
        </div>
        <div class="mt-[30px] grid grid-cols-2 gap-[24px] max-md:grid-cols-1">
          <div class="relative h-[320px] overflow-hidden rounded-[10px] bg-no-repeat" style="background-image: url('/img/home/image-1c6d82.webp'); background-position: 0 55.448%; background-size: 100% auto">
            <h3 class="absolute left-[25px] top-[199px] text-[30px] font-semibold uppercase leading-[1.2] text-white">Коррекция</h3>
            <p class="absolute left-[25px] top-[241px] w-[346px] text-[14px] font-medium leading-[1.25] text-white">Освобождение от зажимов, работа с осанкой, дыханием, тазовым дном. Идеально для восстановления и заботы о себе.</p>
            <NuxtLink to="/course_correction" class="absolute left-[385px] top-[249px] flex h-[46px] w-[156px] items-center justify-center rounded-[6px] bg-white text-[12px] font-bold leading-[1.55] text-ink shadow-[0_2px_6px_0_rgba(28,29,30,0.3)] transition-opacity hover:opacity-90 max-lg:left-auto max-lg:right-[25px]">ПОДРОБНЕЕ</NuxtLink>
          </div>
          <div class="relative h-[320px] overflow-hidden rounded-[10px] bg-no-repeat" style="background-image: url('/img/home/image_1.webp'); background-position: 0 75.886%; background-size: 100% auto">
            <h3 class="absolute left-[25px] top-[199px] text-[30px] font-semibold uppercase leading-[1.2] text-white">Силовой</h3>
            <p class="absolute left-[25px] top-[241px] w-[330px] text-[14px] font-medium leading-[1.25] text-white">Укрепление тела, рельеф и сила. Для тех, кто хочет поработать не только над осанкой, но и над формами.</p>
            <NuxtLink to="/course_power" class="absolute left-[385px] top-[249px] flex h-[46px] w-[156px] items-center justify-center rounded-[6px] bg-white text-[12px] font-bold leading-[1.55] text-ink shadow-[0_2px_6px_0_rgba(28,29,30,0.3)] transition-opacity hover:opacity-90 max-lg:left-auto max-lg:right-[25px]">ПОДРОБНЕЕ</NuxtLink>
          </div>
        </div>
        <div class="mt-[24px] flex items-start gap-[24px] max-md:flex-col">
          <a href="#popup:embedcode" class="relative block h-[111px] w-[432px] shrink-0 rounded-[8px] bg-white max-md:w-full">
            <span class="absolute left-[9px] top-[10px] block h-[94px] w-[189px] overflow-hidden rounded-[8px] bg-no-repeat" style="background-image: url('/img/home/image-0a747b.webp'); background-size: 100% auto">
              <img src="/img/home/group_1321319633.png" alt="" width="36" height="36" class="absolute left-[77px] top-[29px] h-[36px] w-[36px] rounded-full">
            </span>
            <span class="absolute left-[213px] top-[14px] w-[221px] text-[16px] font-semibold leading-[1.35] text-ink">«Коррекция и Силовой: какой курс выбрать»</span>
            <span class="absolute left-[213px] top-[76px] flex h-[23px] w-[50px] items-center justify-center rounded-[30px] bg-ink text-[10px] font-bold leading-[1.55] text-white">7 мин</span>
          </a>
          <a :href="links.preorderBot" class="relative block h-[112px] w-full rounded-[8px] bg-white">
            <span class="absolute left-[18px] top-[18px] w-[587px] max-w-[calc(100%-90px)] text-[16px] font-semibold leading-[1.3] text-ink">Не пропустите старт нового потока —<span class="text-[#4f86c4]"> подпишитесь в бот предзаписи!</span></span>
            <span class="absolute left-[18px] top-[45px] w-[578px] max-w-[calc(100%-90px)] text-[12px] font-medium leading-[1.25] text-[#9d9da0]">Бот предзаписи&nbsp;— это ваш персональный помощник. <strong>Он&nbsp;напомнит о&nbsp;старте продаж, даст полезные материалы и&nbsp;откроет доступ к&nbsp;бонусам. В&nbsp;нём проходят розыгрыши, бесплатные уроки и&nbsp;первые анонсы!</strong></span>
            <span class="pf-btn-blue absolute right-[42px] top-[42px] flex h-[28px] w-[28px] items-center justify-center rounded-full">
              <img src="/img/home/group_1321318787-7f8d9a.svg" alt="" width="10" height="10">
            </span>
          </a>
        </div>
      </div>
    </div>

    <!-- ===== мобайл (<640): артборд 320×990 ===== -->
    <div class="pf-m hidden h-[calc(990*var(--u))] max-sm:block">
      <h2 class="absolute left-[calc(15*var(--u))] top-[calc(40*var(--u))] w-[calc(200*var(--u))] text-[18px] font-semibold uppercase leading-[1.3] text-ink">Выбирайте курс под свои цели</h2>
      <p class="absolute left-[calc(273*var(--u))] top-[calc(73*var(--u))] text-[8px] font-bold uppercase leading-[1.3] text-[#9d9da0]">#курсы</p>
      <div class="absolute left-[calc(15*var(--u))] top-[calc(112*var(--u))] h-[calc(234*var(--u))] w-[calc(290*var(--u))] overflow-hidden rounded-[8px] bg-no-repeat" style="background-image: url('/img/home/image-1c6d82.webp'); background-position: 65.119% 57.946%; background-size: 121.4% auto">
        <h3 class="absolute left-[calc(15*var(--u))] top-[calc(93*var(--u))] text-[18px] font-semibold uppercase leading-[1.2] text-white">Коррекция</h3>
        <p class="absolute left-[calc(15*var(--u))] top-[calc(119*var(--u))] w-[calc(255*var(--u))] text-[12px] font-medium leading-[1.25] text-white">Освобождение от зажимов, работа с осанкой, дыханием, тазовым дном. Идеально для восстановления и заботы о себе.</p>
        <NuxtLink to="/course_correction" class="absolute left-[calc(15*var(--u))] top-[calc(184*var(--u))] flex h-[calc(34*var(--u))] w-[calc(146*var(--u))] items-center justify-center rounded-[6px] bg-white text-[10px] font-bold leading-[1.55] text-ink">ПОДРОБНЕЕ</NuxtLink>
      </div>
      <div class="absolute left-[calc(15*var(--u))] top-[calc(354*var(--u))] h-[calc(234*var(--u))] w-[calc(290*var(--u))] overflow-hidden rounded-[8px] bg-no-repeat" style="background-image: url('/img/home/image_1.webp'); background-position: 11.165% 0; background-size: 143.227% auto">
        <h3 class="absolute left-[calc(15*var(--u))] top-[calc(107*var(--u))] text-[18px] font-semibold uppercase leading-[1.2] text-white">Силовой</h3>
        <p class="absolute left-[calc(15*var(--u))] top-[calc(133*var(--u))] w-[calc(237*var(--u))] text-[12px] font-medium leading-[1.25] text-white">Укрепление тела, рельеф и сила. Для тех, кто хочет поработать не только над осанкой, но и над формами.</p>
        <NuxtLink to="/course_power" class="absolute left-[calc(15*var(--u))] top-[calc(186*var(--u))] flex h-[calc(34*var(--u))] w-[calc(146*var(--u))] items-center justify-center rounded-[6px] bg-white text-[10px] font-bold leading-[1.55] text-ink">ПОДРОБНЕЕ</NuxtLink>
      </div>
      <a href="#popup:embedcode" class="absolute left-[calc(15*var(--u))] top-[calc(601*var(--u))] block h-[calc(240*var(--u))] w-[calc(290*var(--u))] rounded-[8px] bg-white">
        <span class="absolute left-[calc(9*var(--u))] top-[calc(9*var(--u))] block h-[calc(142*var(--u))] w-[calc(272*var(--u))] overflow-hidden rounded-[8px] bg-no-repeat" style="background-image: url('/img/home/image-0a747b.webp'); background-size: 100% auto">
          <img src="/img/home/group_1321319633.png" alt="" width="36" height="36" class="absolute left-[calc(118*var(--u))] top-[calc(52*var(--u))] h-[calc(36*var(--u))] w-[calc(36*var(--u))] rounded-full">
        </span>
        <span class="absolute left-[calc(9*var(--u))] top-[calc(160*var(--u))] w-[calc(245*var(--u))] text-[14px] font-semibold leading-[1.35] text-ink">«Коррекция и Силовой: какой курс выбрать»</span>
        <span class="absolute left-[calc(9*var(--u))] top-[calc(211*var(--u))] flex h-[calc(19*var(--u))] w-[calc(45*var(--u))] items-center justify-center rounded-[30px] bg-ink text-[8px] font-bold leading-[1.55] text-white">7 мин</span>
      </a>
      <a :href="links.preorderBot" class="absolute left-[calc(15*var(--u))] top-[calc(851*var(--u))] block h-[calc(134*var(--u))] w-[calc(290*var(--u))] rounded-[8px] bg-white">
        <span class="absolute left-[calc(9*var(--u))] top-[calc(9*var(--u))] w-[calc(248*var(--u))] text-[14px] font-semibold leading-[1.3] text-ink">Не пропустите старт нового потока —<span class="text-[#4f86c4]"> подпишитесь в бот предзаписи!</span></span>
        <span class="pf-btn-blue absolute left-[calc(256*var(--u))] top-[calc(9*var(--u))] flex h-[calc(25*var(--u))] w-[calc(25*var(--u))] items-center justify-center rounded-full">
          <img src="/img/home/group_1321318787-7f8d9a.svg" alt="" width="8" height="8">
        </span>
        <span class="absolute left-[calc(9*var(--u))] top-[calc(65*var(--u))] w-[calc(264*var(--u))] text-[10px] font-medium leading-[1.25] text-[#9d9da0]">Бот предзаписи&nbsp;— это ваш персональный помощник. <strong>Он&nbsp;напомнит о&nbsp;старте продаж, даст полезные материалы и&nbsp;откроет доступ к&nbsp;бонусам. В&nbsp;нём проходят розыгрыши, бесплатные уроки и&nbsp;первые анонсы!</strong></span>
      </a>
    </div>

    <!-- попап с видео «Коррекция и Силовой: какой курс выбрать» (T868 #rec789318585) -->
    <Modal name="popup:embedcode" :width="960" bare>
      <VideoEmbed kind="kinescope" id="iv769rTaa71GS556RpcQdn" autoplay />
    </Modal>
  </section>
</template>
