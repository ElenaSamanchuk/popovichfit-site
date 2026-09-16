<script setup lang="ts">
// old-site: главная, секция «Хватит думать — надо делать» — Zero Block #rec1120250196 (десктоп/планшет,
// data-screen-min=480; артборд 1200×533) и мобильная версия #rec1120250226 (199) + #rec1120250236 (106,
// горизонтальная лента карточек) + #rec1120250361 (316) — итого 621 в макете 320.
// Примечание: в оригинале на мобильной версии написано «12 тыс.+», на десктопе «21 тыс.+» — воспроизведено как есть.
</script>

<template>
  <section class="pf-join relative" aria-labelledby="join-title">
    <!-- ===== десктоп / планшет (≥640) ===== -->
    <div class="relative pt-[100px] pb-[10px] lg:h-[533px] max-sm:hidden">
      <div class="pf-container relative">
        <h2 id="join-title" class="w-[560px] max-w-full text-[30px] font-semibold uppercase leading-[1.3] text-ink">
          хватит думать - надо делать<br><span class="text-[#4f86c4]">присоединяйся!</span>
        </h2>
        <div class="relative mt-[33px] flex items-start gap-[35px] max-md:flex-col max-md:gap-[22px]">
          <!-- фото «21 тыс.+» -->
          <div class="relative h-[315px] w-[532px] shrink-0 overflow-hidden rounded-[10px] bg-no-repeat shadow-[0_4px_30px_0_rgba(91,93,108,0.2)] max-lg:h-[449px] max-lg:w-[515px] max-md:h-[212px] max-md:w-[408px]" style="background-image: url('/img/home/group_1321319685.webp'); background-position: 3.727% 36.176%; background-size: 135.694% auto">
            <div class="absolute left-[19px] top-[27px] flex h-[62px] w-[176px] items-center gap-[4px] rounded-[50px] bg-white/[0.18] pl-[4px] shadow-[0_4px_30px_0_rgba(91,93,108,0.2)]">
              <span class="h-[54px] w-[54px] rounded-full bg-no-repeat" style="background-image: url('/img/home/img_4802_1.webp'); background-position: 47.944% 16.078%; background-size: 223.182% auto" />
              <span class="h-[54px] w-[54px] rounded-full bg-no-repeat" style="background-image: url('/img/home/img_4809_1.webp'); background-position: 36.285% 39.724%; background-size: 284.62% auto" />
              <span class="h-[54px] w-[54px] rounded-full bg-no-repeat" style="background-image: url('/img/home/img_4806_1.webp'); background-position: 0 39.045%; background-size: 223.059% auto" />
            </div>
            <p class="absolute left-[23px] top-[107px] text-[40px] font-medium leading-[1.3] text-white">21 тыс.+</p>
            <p class="absolute left-[29px] top-[157px] w-[200px] text-[14px] font-semibold leading-[1.35] text-white">участников на март 2025 г.</p>
          </div>
          <!-- факты + совет -->
          <div class="relative w-full">
            <p class="mb-[16px] text-[10px] font-bold uppercase leading-[1.3] text-[#9d9da0] max-md:mb-[12px]">#о курсах</p>
            <div class="flex gap-[16px] max-md:flex-wrap">
              <a href="#courses" class="relative flex h-[120px] w-[187px] flex-col rounded-[8px] bg-white p-[20px] transition-shadow hover:shadow-[0_4px_20px_rgba(91,93,108,0.15)]">
                <span class="text-[40px] font-bold leading-[1.3] text-ink">2</span>
                <span class="w-[170px] text-[12px] font-semibold uppercase leading-[1.35] text-ink">курса на выбор: Силовой и Коррекция</span>
                <span class="absolute right-[12px] top-[12px] flex h-[28px] w-[28px] items-center justify-center rounded-full bg-[#ededed]"><img src="/img/home/group_1321318855-152ede.svg" alt="" width="10" height="10"></span>
              </a>
              <div class="relative flex h-[120px] w-[187px] flex-col rounded-[8px] bg-white p-[20px]">
                <span class="text-[40px] font-bold leading-[1.3] text-ink">5</span>
                <span class="w-[152px] text-[12px] font-semibold uppercase leading-[1.35] text-ink">недель - длительность потока</span>
              </div>
              <div class="relative flex h-[120px] w-[187px] flex-col rounded-[8px] bg-no-repeat p-[20px] shadow-[0_1px_3px_0_rgba(190,190,190,0.4)]" style="background-image: url('/img/home/image.webp'); background-position: 0.595% 68.236%; background-size: 187.697% auto">
                <span class="text-[40px] font-bold leading-[1.3] text-white">3</span>
                <span class="w-[132px] text-[12px] font-semibold uppercase leading-[1.35] text-white">победителя каждый поток</span>
                <span class="absolute right-[12px] top-[12px] flex h-[28px] w-[28px] items-center justify-center rounded-full bg-[#ededed]"><img src="/img/home/img_.svg" alt="" width="7" height="10"></span>
              </div>
            </div>
            <div class="mt-[95px] max-md:mt-[24px]">
              <p class="text-[20px] font-semibold uppercase leading-[1.3] text-ink">совет перед покупкой</p>
              <div class="mt-[10px] flex items-start justify-between gap-[20px] max-md:flex-col">
                <p class="w-[338px] max-w-full text-[14px] font-thin leading-[1.25] text-ink">Если вы новичок — начните с «Коррекции». Почувствуете тело, восстановите подвижность — и будете готовы к следующему уровню.</p>
                <a href="#courses" class="pf-btn-blue flex h-[46px] w-[187px] shrink-0 items-center justify-center rounded-[8px] text-[14px] font-semibold uppercase leading-[1.55] text-white shadow-[0_2px_6px_0_rgba(107,103,110,0.2)]">Выбрать курс</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== мобайл (<640): три артборда 320 подряд ===== -->
    <div class="pf-m hidden h-[calc(621*var(--u))] max-sm:block">
      <h2 class="absolute left-[calc(15*var(--u))] top-[calc(100*var(--u))] w-[calc(290*var(--u))] text-[18px] font-semibold uppercase leading-[1.3] text-ink">хватит думать - надо делать<br><span class="text-[#4f86c4]">присоединяйся!</span></h2>
      <p class="absolute left-[calc(15*var(--u))] top-[calc(171*var(--u))] text-[10px] font-bold uppercase leading-[1.3] text-[#9d9da0]">#о курсах</p>

      <!-- лента карточек (overflow auto, как в оригинале) -->
      <div class="absolute left-0 top-[calc(199*var(--u))] h-[calc(106*var(--u))] w-full overflow-x-auto overflow-y-hidden" style="scrollbar-width: none">
        <div class="relative h-[calc(86*var(--u))] w-[calc(512*var(--u))]">
          <a href="#courses" class="absolute left-[calc(15*var(--u))] top-0 h-[calc(86*var(--u))] w-[calc(154*var(--u))] rounded-[6px] bg-white">
            <span class="absolute left-[calc(15*var(--u))] top-[calc(15*var(--u))] text-[25px] font-bold leading-[1.3] text-ink">2</span>
            <span class="absolute left-[calc(15*var(--u))] top-[calc(44*var(--u))] w-[calc(133*var(--u))] text-[10px] font-semibold uppercase leading-[1.35] text-ink">курса на выбор: Силовой и Коррекция</span>
            <span class="absolute left-[calc(117*var(--u))] top-[calc(9*var(--u))] flex h-[calc(28*var(--u))] w-[calc(28*var(--u))] items-center justify-center rounded-full bg-[#ededed]"><img src="/img/home/group_1321318855-152ede.svg" alt="" width="8" height="8"></span>
          </a>
          <div class="absolute left-[calc(179*var(--u))] top-0 h-[calc(86*var(--u))] w-[calc(154*var(--u))] rounded-[6px] bg-white">
            <span class="absolute left-[calc(14*var(--u))] top-[calc(15*var(--u))] text-[25px] font-bold leading-[1.3] text-ink">5</span>
            <span class="absolute left-[calc(14*var(--u))] top-[calc(44*var(--u))] w-[calc(126*var(--u))] text-[10px] font-semibold uppercase leading-[1.35] text-ink">недель - длительность потока</span>
          </div>
          <div class="absolute left-[calc(343*var(--u))] top-0 h-[calc(86*var(--u))] w-[calc(154*var(--u))] rounded-[6px] bg-no-repeat" style="background-image: url('/img/home/image.webp'); background-position: 0.595% 68.236%; background-size: 187.697% auto">
            <span class="absolute left-[calc(14*var(--u))] top-[calc(15*var(--u))] text-[25px] font-bold leading-[1.3] text-white">3</span>
            <span class="absolute left-[calc(14*var(--u))] top-[calc(44*var(--u))] w-[calc(126*var(--u))] text-[10px] font-semibold uppercase leading-[1.35] text-white">победителя каждый поток</span>
            <span class="absolute left-[calc(-44*var(--u))] top-[calc(9*var(--u))] flex h-[calc(25*var(--u))] w-[calc(25*var(--u))] items-center justify-center rounded-full bg-[#ededed]"><img src="/img/home/img_.svg" alt="" width="6" height="8"></span>
          </div>
        </div>
      </div>

      <p class="absolute left-[calc(15*var(--u))] top-[calc(305*var(--u))] text-[12px] font-semibold uppercase leading-[1.3] text-ink">совет перед покупкой</p>
      <p class="absolute left-[calc(15*var(--u))] top-[calc(327*var(--u))] w-[calc(301*var(--u))] text-[10px] font-thin leading-[1.25] text-ink">Если вы новичок — начните с «Коррекции». Почувствуете тело, восстановите подвижность — и будете готовы к следующему уровню.</p>
      <a href="#courses" class="pf-btn-blue absolute left-[calc(15*var(--u))] top-[calc(381*var(--u))] flex h-[calc(34*var(--u))] w-[calc(147*var(--u))] items-center justify-center rounded-[6px] text-[10px] font-semibold uppercase leading-[1.55] text-white shadow-[0_2px_6px_0_rgba(107,103,110,0.2)]">Выбрать курс</a>

      <div class="absolute left-[calc(15*var(--u))] top-[calc(440*var(--u))] h-[calc(171*var(--u))] w-[calc(290*var(--u))] overflow-hidden rounded-[10px] bg-no-repeat" style="background-image: url('/img/home/group_1321319685.webp'); background-position: 0 33.105%; background-size: 131.274% auto">
        <div class="absolute left-[calc(14*var(--u))] top-[calc(14*var(--u))] flex h-[calc(34*var(--u))] w-[calc(98*var(--u))] items-center gap-[calc(2*var(--u))] rounded-[50px] bg-white/[0.18] pl-[calc(1*var(--u))]">
          <span class="h-[calc(30*var(--u))] w-[calc(30*var(--u))] rounded-full bg-no-repeat" style="background-image: url('/img/home/img_4802_1.webp'); background-position: 47.944% 16.078%; background-size: 223.182% auto" />
          <span class="h-[calc(30*var(--u))] w-[calc(30*var(--u))] rounded-full bg-no-repeat" style="background-image: url('/img/home/img_4809_1.webp'); background-position: 36.285% 39.724%; background-size: 284.62% auto" />
          <span class="h-[calc(30*var(--u))] w-[calc(30*var(--u))] rounded-full bg-no-repeat" style="background-image: url('/img/home/img_4806_1.webp'); background-position: 0 39.045%; background-size: 223.059% auto" />
        </div>
        <p class="absolute left-[calc(11*var(--u))] top-[calc(59*var(--u))] text-[25px] font-medium leading-[1.3] text-white">12 тыс.+</p>
        <p class="absolute left-[calc(15*var(--u))] top-[calc(87*var(--u))] w-[calc(104*var(--u))] text-[10px] font-semibold leading-[1.35] text-white">участников на март 2025 г.</p>
      </div>
    </div>
  </section>
</template>
