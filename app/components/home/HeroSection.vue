<script setup lang="ts">
// old-site: главная, hero Zero Block #rec1683443211. Артборды: 1200×751 (десктоп) и 320×783 (мобайл).
// Координаты — измеренные на живом сайте (docs/specs/measured/index-1200.txt, index-390.txt).
// Мобайл: геометрия в единицах макета 320 (--u = 1px макета, масштабируется на ширину экрана как в Тильде),
// шрифты — фиксированные px. Секция-коллаж, поэтому позиционирование абсолютное.
import { links } from '~/data/links'
import { schedule } from '~/data/schedule'
</script>

<template>
  <section class="pf-hero relative" aria-label="POPOVICHFIT — онлайн фитнес-клуб">
    <!-- ===== десктоп / планшет (≥640) ===== -->
    <div class="relative h-[751px] overflow-hidden max-sm:hidden">
      <div class="absolute left-[1%] top-0 h-[750px] w-[98%] rounded-[12px] bg-cover bg-center" style="background-image: url('/img/home/group_1321319637.webp')" />
      <div class="pf-art h-full">
        <img src="/img/home/popovichfit.svg" alt="" width="1154" height="139" class="pointer-events-none absolute left-[21px] top-[116px] w-[1154px] max-w-[calc(100%-42px)]" aria-hidden="true">
        <div class="pointer-events-none absolute left-[722px] top-[85px] h-[666px] w-[500px] bg-no-repeat" style="background-image: url('/img/home/popovich_fit_2025040.webp'); background-position: 80.76% 0; background-size: 121.029% auto" role="img" aria-label="Наталья Попович" />

        <p class="absolute left-[20px] top-[283px] w-[620px] text-[16px] font-bold leading-[1.3] text-white">POPOVICHFIT — онлайн фитнес-клуб, в который хочется возвращаться. <span class="font-thin">«Осанка, пресс, тазовое дно, рельеф тела и любовь к себе — тренировки, которые работают с телом и головой»</span></p>

        <a href="#courses" class="absolute left-[20px] top-[373px] flex h-[42px] w-[149px] items-center rounded-[8px] bg-white/15 pl-[13px] text-[14px] font-semibold leading-[1.3] text-white transition-colors hover:bg-white/25">
          Выбрать курс
          <img src="/img/home/group_1321318787.svg" alt="" width="12" height="11" class="absolute left-[120px] top-[15px]">
        </a>

        <!-- карточка: бот предзаписи -->
        <div class="absolute left-[20px] top-[489px] h-[198px] w-[374px] rounded-[8px] bg-white/15 shadow-[0_5px_10px_0_rgba(45,46,54,0.2)]">
          <span class="absolute left-[20px] top-[20px] flex h-[23px] w-[218px] items-center rounded-[40px] bg-ink pl-[13px] text-[10px] font-bold uppercase leading-[1.3] text-white">
            <img src="/img/home/vector.svg" alt="" width="12" height="11" class="mr-[9px]">{{ schedule.salesStartLabel }}
          </span>
          <span class="absolute left-[247px] top-[15px] h-[95px] w-[112px] rounded-[8px] bg-no-repeat" style="background-image: url('/img/home/image_181.webp'); background-position: 46.187% 47.232%; background-size: 128.1% auto" role="img" aria-label="" />
          <p class="absolute left-[20px] top-[56px] w-[218px] text-[14px] font-semibold leading-[1.3] text-white">Подпишитесь на бот, чтобы приобрести курс по самым выгодным ценам!</p>
          <a :href="links.preorderBot" class="pf-btn-blue absolute left-[20px] top-[131px] flex h-[49px] w-[334px] items-center justify-center rounded-[6px] text-[14px] font-bold uppercase leading-[1.55] text-white">Перейти в бот</a>
        </div>

        <!-- карточка: потоки -->
        <div class="absolute left-[419px] top-[489px] h-[198px] w-[251px] rounded-[8px] bg-white/15 shadow-[0_5px_10px_0_rgba(45,46,54,0.2)]">
          <span class="absolute left-[15px] top-[9px] text-[40px] font-bold leading-[1.3] text-white">{{ schedule.currentFlow.number }}</span>
          <span class="absolute left-[65px] top-[33px] text-[14px] font-semibold leading-[1.25] text-white">поток</span>
          <span class="absolute left-[121px] top-[25px] flex h-[23px] w-[115px] items-center justify-center rounded-[30px] bg-ink text-[10px] font-bold uppercase leading-[1.55] text-white">{{ schedule.currentFlow.badge }}</span>
          <span class="absolute left-[15px] top-[65px] h-px w-[221px] bg-white/[0.17]" />
          <span class="absolute left-[15px] top-[69px] text-[40px] font-bold leading-[1.3] text-white">{{ schedule.nextFlow.number }}</span>
          <span class="absolute left-[65px] top-[93px] text-[14px] font-semibold leading-[1.25] text-white">поток</span>
          <span class="pf-btn-blue absolute left-[120px] top-[85px] flex h-[23px] w-[115px] items-center justify-center rounded-[30px] text-[10px] font-bold uppercase leading-[1.55] text-white">{{ schedule.nextFlow.badge }}</span>
          <a href="#zeropopup" class="absolute left-[15px] top-[139px] flex h-[44px] w-[221px] items-center rounded-[100px] pl-[19px] text-[12px] font-semibold leading-[1.1] text-white shadow-[0_1px_3px_0_rgba(113,113,113,0.2)]" style="background-image: linear-gradient(0.946turn, rgba(241,240,246,0.3) 0%, rgba(255,255,255,0.3) 100%)">
            Расписание потоков
            <span class="absolute left-[185px] top-[8px] flex h-[28px] w-[28px] items-center justify-center rounded-full bg-ink">
              <img src="/img/home/group_1321318855.svg" alt="" width="10" height="10">
            </span>
          </a>
        </div>
      </div>
    </div>

    <!-- ===== мобайл (<640): артборд 320×783, геометрия в --u ===== -->
    <div class="pf-m hidden h-[calc(783*var(--u))] max-sm:block">
      <div class="absolute left-[calc(10*var(--u))] top-0 h-[calc(783*var(--u))] w-[calc(300*var(--u))] rounded-[12px] bg-cover bg-center" style="background-image: url('/img/home/group_1321319637.webp')" />
      <p class="absolute left-0 top-[calc(67*var(--u))] w-full text-center text-[26px] font-thin leading-[1.25] text-white">POPOVICHFIT</p>
      <p class="absolute left-[calc(17*var(--u))] top-[calc(105*var(--u))] w-[calc(287*var(--u))] text-center text-[12px] font-bold leading-[1.3] text-white">Онлайн фитнес-клуб, в&nbsp;который хочется возвращаться. <span class="font-normal">«Осанка, пресс, тазовое дно, рельеф тела и любовь к себе — тренировки, которые работают с телом и головой»</span></p>
      <a href="#courses" class="absolute left-[calc(95*var(--u))] top-[calc(186*var(--u))] flex h-[calc(36*var(--u))] w-[calc(129*var(--u))] items-center rounded-[8px] bg-white/15 pl-[calc(14*var(--u))] text-[12px] font-semibold leading-[1.3] text-white">
        Выбрать курс
        <img src="/img/home/group_1321318787.svg" alt="" width="11" height="10" class="absolute left-[calc(104*var(--u))] top-1/2 -translate-y-1/2">
      </a>
      <div class="pointer-events-none absolute left-[calc(26*var(--u))] top-[calc(228*var(--u))] h-[calc(555*var(--u))] w-[calc(285*var(--u))] bg-no-repeat" style="background-image: url('/img/home/popovich_fit_2025040.webp'); background-position: 55.878% 38.897%; background-size: 147.97% auto" role="img" aria-label="Наталья Попович" />

      <div class="absolute left-[calc(20*var(--u))] top-[calc(517*var(--u))] h-[calc(160*var(--u))] w-[calc(280*var(--u))] rounded-[8px] bg-white/15 shadow-[0_5px_10px_0_rgba(45,46,54,0.2)]">
        <span class="absolute left-[calc(14*var(--u))] top-[calc(14*var(--u))] flex h-[calc(19*var(--u))] w-[calc(170*var(--u))] items-center rounded-[40px] bg-ink pl-[calc(8*var(--u))] text-[8px] font-bold uppercase leading-[1.3] text-white">
          <img src="/img/home/vector.svg" alt="" width="8" height="7" class="mr-[calc(6*var(--u))]">{{ schedule.salesStartLabel }}
        </span>
        <span class="absolute left-[calc(204*var(--u))] top-[calc(14*var(--u))] h-[calc(80*var(--u))] w-[calc(62*var(--u))] rounded-[8px] bg-no-repeat" style="background-image: url('/img/home/image_181.webp'); background-position: 49.2% 0; background-size: 133.811% auto" role="img" aria-label="" />
        <p class="absolute left-[calc(14*var(--u))] top-[calc(43*var(--u))] w-[calc(194*var(--u))] text-[12px] font-semibold leading-[1.3] text-white">Подпишитесь на бот, чтобы приобрести курс по самым выгодным ценам!</p>
        <a :href="links.preorderBot" class="pf-btn-blue absolute left-[calc(14*var(--u))] top-[calc(106*var(--u))] flex h-[calc(40*var(--u))] w-[calc(252*var(--u))] items-center justify-center rounded-[6px] text-[12px] font-bold uppercase leading-[1.55] text-white">Перейти в бот</a>
      </div>

      <div class="absolute left-[calc(20*var(--u))] top-[calc(687*var(--u))] h-[calc(86*var(--u))] w-[calc(280*var(--u))] rounded-[8px] bg-white/15 shadow-[0_5px_10px_0_rgba(45,46,54,0.2)]">
        <span class="absolute left-[calc(14*var(--u))] top-[calc(10*var(--u))] text-[30px] font-bold leading-[1.3] text-white">{{ schedule.nextFlow.number }}</span>
        <span class="absolute left-[calc(53*var(--u))] top-[calc(26*var(--u))] text-[12px] font-semibold leading-[1.25] text-white">поток</span>
        <span class="pf-btn-blue absolute left-[calc(14*var(--u))] top-[calc(53*var(--u))] flex h-[calc(19*var(--u))] w-[calc(90*var(--u))] items-center justify-center rounded-[30px] text-[8px] font-bold uppercase leading-[1.55] text-white">{{ schedule.nextFlow.badge }}</span>
        <a href="#zeropopup" class="absolute left-[calc(119*var(--u))] top-[calc(14*var(--u))] block h-[calc(58*var(--u))] w-[calc(147*var(--u))] rounded-[6px] text-[10px] font-semibold leading-[1.1] text-white shadow-[0_1px_3px_0_rgba(113,113,113,0.2)]" style="background-image: linear-gradient(0.946turn, rgba(241,240,246,0.3) 0%, rgba(255,255,255,0.3) 100%)">
          <span class="absolute left-[calc(18*var(--u))] top-[calc(18*var(--u))] w-[calc(79*var(--u))]">Расписание потоков</span>
          <span class="absolute left-[calc(100*var(--u))] top-[calc(16*var(--u))] flex h-[calc(25*var(--u))] w-[calc(25*var(--u))] items-center justify-center rounded-full bg-ink">
            <img src="/img/home/group_1321318855.svg" alt="" width="8" height="8">
          </span>
        </a>
      </div>
    </div>
  </section>
</template>
