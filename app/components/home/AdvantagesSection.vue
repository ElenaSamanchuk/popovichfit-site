<script setup lang="ts">
// old-site: главная, «Преимущества POPOVICHFIT» — Zero Block #rec1120250396 (артборд 1200×450; 320×729).
// Белая карточка на всю ширину: слева текст, две высокие синие карточки с фото, справа две широкие синие.
// Мобайл: всё в столбик внутри белой карточки (на мобиле фото стоит в карточке «Обновляемые курсы»).
</script>

<template>
  <section class="pf-advantages relative" aria-labelledby="advantages-title">
    <!-- ===== десктоп / планшет (≥640) ===== -->
    <div class="relative pt-[90px] pb-[10px] lg:h-[450px] max-sm:hidden">
      <div class="pf-container relative">
        <div class="flex items-start justify-between">
          <h2 id="advantages-title" class="w-[560px] max-w-full text-[30px] font-semibold leading-[1.3] text-ink">Преимущества POPOVICHFIT</h2>
          <p class="mt-[26px] w-[117px] text-[10px] font-bold uppercase leading-[1.3] text-[#9d9da0]">#о курсах</p>
        </div>
        <div class="relative mt-[30px] h-[281px] rounded-[10px] bg-white max-lg:h-auto max-lg:pb-[4px]">
          <div class="absolute left-[20px] top-[20px] w-[232px] text-[14px] font-medium leading-[1.25] text-ink max-lg:static max-lg:p-[20px]">Откройте для себя умный и безопасный подход к фитнесу с комплексной поддержкой и комфортом.</div>
          <div class="absolute left-[20px] top-[197px] w-[256px] text-[12px] font-medium leading-[1.35] text-[#9d9da0] max-lg:static max-lg:px-[20px] max-lg:pb-[20px]">Здесь можно быть собой, со своими целями, состоянием и ритмом. Мы создаём пространство, где хочется заниматься.</div>
          <div class="absolute left-[285px] top-[4px] flex gap-[6px] max-lg:static max-lg:flex-wrap max-lg:px-[4px]">
            <!-- Комплексный подход -->
            <div class="relative h-[273px] w-[247px] rounded-[8px] bg-[#4f86c4] text-white">
              <div class="absolute left-[5px] top-[5px] h-[115px] w-[237px] rounded-[8px] bg-no-repeat" style="background-image: url('/img/home/image-837f05.webp'); background-position: 42.959% 64.913%; background-size: 132.8% auto" role="img" aria-label="" />
              <p class="absolute left-[16px] top-[183px] w-[165px] text-[14px] font-bold leading-[1.35]">Комплексный подход к тренировкам:</p>
              <p class="absolute left-[16px] top-[225px] w-[222px] text-[12px] font-medium leading-[1.35]">улучшение осанки, дыхания и силы с заботой о здоровье и красоте</p>
            </div>
            <!-- Обновляемые курсы -->
            <div class="relative h-[273px] w-[247px] rounded-[8px] bg-[#4f86c4] text-white">
              <p class="absolute left-[16px] top-[16px] w-[165px] text-[14px] font-bold leading-[1.35]">Обновляемые курсы без стагнации:</p>
              <p class="absolute left-[16px] top-[58px] w-[222px] text-[12px] font-medium leading-[1.35]">каждый поток тренировки обновляются. Курс «Коррекция» обновляется на 30%, а курс Силовой на 50%</p>
              <div class="absolute left-[5px] top-[153px] h-[115px] w-[237px] rounded-[8px] bg-no-repeat" style="background-image: url('/img/home/image-1.webp'); background-position: 60.833% 41.681%; background-size: 124.6% auto" role="img" aria-label="" />
            </div>
            <!-- справа: две широкие -->
            <div class="flex w-[366px] flex-col gap-[5px]">
              <div class="relative h-[134px] rounded-[8px] bg-[#4f86c4] text-white">
                <p class="absolute left-[16px] top-[47px] text-[14px] font-bold leading-[1.35]">Высокое качество видео:</p>
                <p class="absolute left-[16px] top-[70px] w-[313px] text-[12px] font-medium leading-[1.35]">занимайтесь в&nbsp;любое время и&nbsp;смотрите качественные видео в&nbsp;личном кабинете на&nbsp;сайте, в&nbsp;приложении или подключите к&nbsp;TV</p>
              </div>
              <div class="relative h-[134px] rounded-[8px] bg-[#4f86c4] text-white">
                <p class="absolute left-[16px] top-[47px] text-[14px] font-bold leading-[1.35]">Безопасные тренировки:</p>
                <p class="absolute left-[16px] top-[70px] w-[338px] text-[12px] font-medium leading-[1.35]">курс «Коррекция»&nbsp;— для восстановления, здоровья и&nbsp;лёгкости в&nbsp;теле, а&nbsp;курс «Силовой»&nbsp;— не&nbsp;только для осанки, но&nbsp;и&nbsp;для рельефа, формы и&nbsp;роста мышц</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== мобайл (<640): артборд 320×729 ===== -->
    <div class="pf-m hidden h-[calc(729*var(--u))] max-sm:block">
      <h2 class="absolute left-[calc(10*var(--u))] top-[calc(50*var(--u))] w-[calc(160*var(--u))] text-[18px] font-semibold leading-[1.3] text-ink">Преимущества POPOVICHFIT</h2>
      <p class="absolute left-[calc(220*var(--u))] top-[calc(84*var(--u))] text-[10px] font-bold uppercase leading-[1.3] text-[#9d9da0]">#о курсах</p>
      <div class="absolute left-[calc(10*var(--u))] top-[calc(121*var(--u))] h-[calc(601*var(--u))] w-[calc(300*var(--u))] rounded-[10px] bg-white" />
      <p class="absolute left-[calc(24*var(--u))] top-[calc(135*var(--u))] w-[calc(258*var(--u))] text-[12px] font-medium leading-[1.25] text-ink">Откройте для себя умный и безопасный подход к фитнесу с комплексной поддержкой и комфортом.</p>
      <p class="absolute left-[calc(24*var(--u))] top-[calc(196*var(--u))] w-[calc(270*var(--u))] text-[10px] font-medium leading-[1.35] text-[#9d9da0]">Здесь можно быть собой, со своими целями, состоянием и ритмом. Мы создаём пространство, где хочется заниматься.</p>
      <div class="absolute left-[calc(15*var(--u))] top-[calc(253*var(--u))] h-[calc(72*var(--u))] w-[calc(290*var(--u))] rounded-[8px] bg-[#4f86c4] text-white">
        <p class="absolute left-[calc(12*var(--u))] top-[calc(11*var(--u))] w-[calc(243*var(--u))] text-[12px] font-bold leading-[1.35]">Комплексный подход к тренировкам:</p>
        <p class="absolute left-[calc(12*var(--u))] top-[calc(32*var(--u))] w-[calc(183*var(--u))] text-[10px] font-medium leading-[1.35]">улучшение осанки, дыхания и силы с заботой о здоровье и красоте</p>
      </div>
      <div class="absolute left-[calc(15*var(--u))] top-[calc(328*var(--u))] h-[calc(208*var(--u))] w-[calc(290*var(--u))] rounded-[8px] bg-[#4f86c4] text-white">
        <p class="absolute left-[calc(12*var(--u))] top-[calc(13*var(--u))] w-[calc(246*var(--u))] text-[12px] font-bold leading-[1.35]">Обновляемые курсы без стагнации:</p>
        <p class="absolute left-[calc(12*var(--u))] top-[calc(32*var(--u))] w-[calc(255*var(--u))] text-[10px] font-medium leading-[1.35]">каждый поток тренировки обновляются. Курс «Коррекция» обновляется на 30%, а курс Силовой на 50%</p>
        <div class="absolute left-[calc(5*var(--u))] top-[calc(86*var(--u))] h-[calc(117*var(--u))] w-[calc(280*var(--u))] rounded-[8px] bg-no-repeat" style="background-image: url('/img/home/image-837f05.webp'); background-position: 42.959% 64.913%; background-size: 132.8% auto" role="img" aria-label="" />
      </div>
      <div class="absolute left-[calc(15*var(--u))] top-[calc(542*var(--u))] h-[calc(86*var(--u))] w-[calc(290*var(--u))] rounded-[8px] bg-[#4f86c4] text-white">
        <p class="absolute left-[calc(11*var(--u))] top-[calc(12*var(--u))] text-[12px] font-bold leading-[1.35]">Безопасные тренировки:</p>
        <p class="absolute left-[calc(11*var(--u))] top-[calc(32*var(--u))] w-[calc(279*var(--u))] text-[10px] font-medium leading-[1.35]">курс «Коррекция»&nbsp;— для восстановления, здоровья и&nbsp;лёгкости в&nbsp;теле, а&nbsp;курс «Силовой»&nbsp;— не&nbsp;только для осанки, но&nbsp;и&nbsp;для рельефа, формы и&nbsp;роста мышц</p>
      </div>
      <div class="absolute left-[calc(15*var(--u))] top-[calc(632*var(--u))] h-[calc(86*var(--u))] w-[calc(290*var(--u))] rounded-[8px] bg-[#4f86c4] text-white">
        <p class="absolute left-[calc(12*var(--u))] top-[calc(11*var(--u))] text-[12px] font-bold leading-[1.35]">Высокое качество видео:</p>
        <p class="absolute left-[calc(12*var(--u))] top-[calc(32*var(--u))] w-[calc(262*var(--u))] text-[10px] font-medium leading-[1.35]">занимайтесь в&nbsp;любое время и&nbsp;смотрите качественные видео в&nbsp;личном кабинете на&nbsp;сайте, в&nbsp;приложении или подключите к&nbsp;TV</p>
      </div>
    </div>
  </section>
</template>
