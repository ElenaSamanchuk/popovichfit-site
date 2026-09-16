<script setup lang="ts">
// old-site: главная, «#личный кабинет — Проходите курсы с комфортом» — Zero Block #rec1120250436
// (артборд 1200×721; 320×622): синий градиентный блок 98% ширины, телефон-макет, подписи-«стикеры»,
// кнопки «Войти в Личный кабинет» (ЛК) и «Скачать мобильное приложение» (#app → попап AppPopup).
import { links } from '~/data/links'
</script>

<template>
  <section class="pf-lk relative" aria-labelledby="lk-title">
    <!-- десктоп / планшет -->
    <div class="relative h-[721px] max-sm:hidden">
      <div class="pf-btn-blue absolute left-[1%] top-[82px] h-[639px] w-[98%] overflow-hidden rounded-[12px]" />
      <div class="pf-art h-full">
        <div class="absolute left-[574px] top-[141px] h-[580px] w-[415px] bg-cover bg-center" style="background-image: url('/img/home/photo.webp')" role="img" aria-label="Приложение POPOVICHFIT на телефоне" />

        <p class="absolute left-[173px] top-[198px] text-[10px] font-bold uppercase leading-[1.3] text-white/50 max-lg:left-[40px]">#личный кабинет</p>
        <h2 id="lk-title" class="absolute left-[100px] top-[236px] whitespace-nowrap text-[30px] font-semibold leading-[1.3] text-white max-lg:left-[40px]">Проходите курсы <br>с комфортом</h2>

        <div class="absolute left-[42px] top-[380px] h-[96px] w-[383px] rounded-[10px] border border-white/[0.07] bg-white/[0.07]" />
        <a :href="links.lk" class="pf-lk__btn absolute left-[46px] top-[384px] flex h-[88px] w-[185px] items-center justify-center rounded-[10px] px-[20px] text-center text-[14px] font-semibold leading-[1.35] text-white transition-colors hover:bg-white hover:text-ink">Войти в Личный кабинет</a>
        <a href="#app" class="pf-lk__btn absolute left-[236px] top-[384px] flex h-[88px] w-[185px] items-center justify-center rounded-[10px] px-[20px] text-center text-[14px] font-semibold leading-[1.35] text-white transition-colors hover:bg-white hover:text-ink">Скачать мобильное приложение</a>
        <p class="absolute left-[101px] top-[542px] w-[266px] text-[14px] font-medium leading-[1.35] text-white max-lg:left-[40px]">Тренировки проходят на платформе и в приложении Popovichfit для удобства пользователей</p>

        <!-- стикеры -->
        <div class="absolute left-[469px] top-[237px] flex h-[35px] w-[35px] items-center justify-center rounded-full bg-white"><img src="/img/home/heart.svg" alt="" width="21" height="19"></div>
        <img src="/img/home/vector_8.svg" alt="" width="162" height="50" class="absolute left-[481px] top-[289px] w-[162px]">
        <p class="absolute left-[489px] top-[342px] w-[149px] text-[12px] font-semibold leading-[1.35] text-white">Добавляйте тренировки в избранное</p>
        <div class="absolute left-[788px] top-[221px] flex h-[61px] w-[164px] items-center justify-center rounded-[10px] bg-white/[0.43] shadow-[4px_4px_6px_0_rgba(21,52,99,0.2)]"><img src="/img/home/group_1321318934_1.png" alt="" width="118" height="28"></div>
        <p class="absolute left-[973px] top-[236px] w-[149px] text-[12px] font-semibold leading-[1.35] text-white">Отслеживайте свой прогресс</p>
        <p class="absolute left-[954px] top-[459px] w-[238px] text-[12px] font-semibold leading-[1.35] text-white">Все дополнительные материалы собраны в вашем телефоне</p>
        <img src="/img/home/frame_1321319082_1.png" alt="" width="524" height="113" class="absolute left-[656px] top-[508px] w-[524px]">
      </div>
    </div>

    <!-- мобайл: артборд 320×622 -->
    <div class="pf-m hidden h-[calc(622*var(--u))] max-sm:block">
      <div class="pf-btn-blue absolute left-[calc(10*var(--u))] top-[calc(43*var(--u))] h-[calc(580*var(--u))] w-[calc(300*var(--u))] rounded-[12px]" />
      <p class="absolute left-[calc(122*var(--u))] top-[calc(88*var(--u))] text-[8px] font-bold uppercase leading-[1.3] text-white/50">#личный кабинет</p>
      <h2 class="absolute left-[calc(77*var(--u))] top-[calc(122*var(--u))] w-[calc(166*var(--u))] text-center text-[18px] font-semibold leading-[1.3] text-white">Проходите курсы <br>с комфортом</h2>
      <div class="absolute left-[calc(33*var(--u))] top-[calc(203*var(--u))] h-[calc(64*var(--u))] w-[calc(253*var(--u))] rounded-[8px] border border-white/[0.07] bg-white/[0.07]" />
      <a :href="links.lk" class="absolute left-[calc(36*var(--u))] top-[calc(207*var(--u))] flex h-[calc(57*var(--u))] w-[calc(121*var(--u))] items-center justify-center rounded-[8px] px-[calc(8*var(--u))] text-center text-[10px] font-semibold leading-[1.35] text-white">Войти в Личный кабинет</a>
      <a href="#app" class="absolute left-[calc(161*var(--u))] top-[calc(207*var(--u))] flex h-[calc(57*var(--u))] w-[calc(121*var(--u))] items-center justify-center rounded-[8px] px-[calc(8*var(--u))] text-center text-[10px] font-semibold leading-[1.35] text-white">Скачать мобильное приложение</a>
      <p class="absolute left-[calc(40*var(--u))] top-[calc(303*var(--u))] w-[calc(241*var(--u))] text-center text-[12px] font-medium leading-[1.35] text-white">Тренировки проходят на платформе и в приложении Popovichfit для удобства пользователей</p>
      <div class="absolute left-[calc(70*var(--u))] top-[calc(372*var(--u))] h-[calc(251*var(--u))] w-[calc(180*var(--u))] bg-cover bg-center" style="background-image: url('/img/home/photo.webp')" role="img" aria-label="Приложение POPOVICHFIT на телефоне" />
      <div class="absolute left-[calc(28*var(--u))] top-[calc(399*var(--u))] flex h-[calc(22*var(--u))] w-[calc(22*var(--u))] items-center justify-center rounded-full bg-white"><img src="/img/home/heart.svg" alt="" width="14" height="13"></div>
      <div class="absolute left-[calc(163*var(--u))] top-[calc(409*var(--u))] flex h-[calc(24*var(--u))] w-[calc(64*var(--u))] items-center justify-center rounded-[5px] bg-white/[0.43]"><img src="/img/home/group_1321318934_1.png" alt="" width="46" height="11" class="w-[calc(46*var(--u))]"></div>
      <p class="absolute left-[calc(234*var(--u))] top-[calc(409*var(--u))] w-[calc(78*var(--u))] text-[8px] font-semibold leading-[1.35] text-white">Отслеживайте свой прогресс</p>
      <img src="/img/home/vector_8.svg" alt="" width="79" height="21" class="absolute left-[calc(36*var(--u))] top-[calc(431*var(--u))] w-[calc(79*var(--u))]">
      <p class="absolute left-[calc(38*var(--u))] top-[calc(459*var(--u))] w-[calc(80*var(--u))] text-[8px] font-semibold leading-[1.35] text-white">Добавляйте тренировки в избранное</p>
      <p class="absolute left-[calc(208*var(--u))] top-[calc(491*var(--u))] w-[calc(90*var(--u))] text-[8px] font-semibold leading-[1.35] text-white">Все дополнительные материалы собраны в вашем телефоне</p>
      <img src="/img/home/frame_1321319082_1.png" alt="" width="197" height="43" class="absolute left-[calc(104*var(--u))] top-[calc(528*var(--u))] w-[calc(197*var(--u))]">
    </div>
    <AppPopup />
  </section>
</template>
