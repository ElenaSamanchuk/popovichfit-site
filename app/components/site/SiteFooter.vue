<script setup lang="ts">
// old-site: футер Zero Block #rec1120448561 (на 196 страницах), тёмный #1d1d1d, высота 583 (1200) /
// 533 (960) / 652 (640) / 612 (480) / 553 (320). «Прилипающий» эффект (uc-sticky-footer): секция задаёт
// высоту, а сам футер fixed внизу и открывается при прокрутке (clip-path на обёртке).
import { footerNav, footerLegal } from '~/data/nav'
import { links } from '~/data/links'
</script>

<template>
  <div class="pf-footer-wrap relative h-[583px] max-lg:h-[533px] max-md:h-[652px] max-sm:h-[612px] max-xs:h-[553px]" style="clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%)">
    <footer class="fixed bottom-0 left-0 z-0 h-[583px] w-full bg-[#1d1d1d] text-white max-lg:h-[533px] max-md:h-[652px] max-sm:h-[612px] max-xs:h-[553px]">
      <div class="relative mx-auto h-full w-full max-w-[1200px] max-lg:max-w-[960px] max-md:max-w-[640px] max-sm:max-w-[480px] max-xs:max-w-[320px]">
        <!-- навигация -->
        <nav
          class="absolute left-[20px] top-[51px] flex items-start gap-[34px] max-lg:left-[10px] max-md:w-[85px] max-md:flex-wrap max-md:gap-[15px] max-xs:left-[15px] max-xs:top-[25px] max-xs:gap-[6px]"
          aria-label="Меню в подвале"
        >
          <template v-for="item in footerNav" :key="item.label">
            <a v-if="item.external" :href="item.href" class="pf-footer__link">{{ item.label }}</a>
            <NuxtLink v-else :to="item.href" class="pf-footer__link">{{ item.label }}</NuxtLink>
          </template>
        </nav>

        <!-- соцсети -->
        <div class="absolute left-[871px] top-[51px] flex gap-[5px] max-lg:left-[641px] max-md:left-[331px] max-sm:left-[334px] max-sm:top-[155px] max-xs:left-[195px] max-xs:top-[116px]">
          <a :href="links.telegramNatalya" aria-label="telegram"><img src="/img/home/telegram_logo_icon_1-6b45b2.svg" alt="" width="30" height="30" class="max-xs:h-[25px] max-xs:w-[25px]"></a>
          <a :href="links.youtube" aria-label="youtube"><img src="/img/home/iconfinder-youtube-4.svg" alt="" width="30" height="30" class="max-xs:h-[25px] max-xs:w-[25px]"></a>
          <a :href="links.instagram" aria-label="instagram"><img src="/img/home/instagram_black_logo.svg" alt="" width="30" height="30" class="max-xs:h-[25px] max-xs:w-[25px]"></a>
          <a :href="links.email" aria-label="e-mail"><img src="/img/home/mail.svg" alt="" width="30" height="30" class="max-xs:h-[25px] max-xs:w-[25px]"></a>
        </div>
        <img src="/img/home/vector-61b992.svg" alt="" width="6" height="6" class="absolute left-[966px] top-[46px] max-lg:left-[734px] max-lg:top-[45px] max-md:left-[427px] max-md:top-[48px] max-sm:left-[430px] max-sm:top-[151px] max-xs:left-[276px] max-xs:top-[113px]">
        <p class="absolute left-[874px] top-[101px] m-0 whitespace-nowrap text-[8px] font-normal leading-[1.55] text-white/30 max-lg:left-[644px] max-md:left-[334px] max-sm:left-[337px] max-sm:top-[200px] max-xs:left-[179px] max-xs:top-[149px]">
          *Meta признана экстремистской<br>организацией на территории РФ
        </p>

        <!-- кнопки -->
        <a
          :href="links.lk"
          class="pf-btn-blue absolute left-[1030px] top-[51px] flex h-[39px] w-[150px] items-center justify-center rounded-[8px] text-[12px] font-bold leading-[1.55] text-white max-lg:left-[800px] max-md:left-[480px] max-sm:left-[320px] max-xs:left-[189px] max-xs:top-[25px] max-xs:h-[34px] max-xs:w-[116px] max-xs:text-[10px]"
        >Личный кабинет</a>
        <a
          :href="links.preorderBot"
          class="absolute left-[1030px] top-[101px] flex h-[39px] w-[150px] items-center justify-center rounded-[8px] border border-[#9d9da0] text-[12px] font-bold leading-[1.55] text-white transition-colors hover:border-white max-lg:left-[800px] max-md:left-[480px] max-sm:left-[320px] max-xs:left-[189px] max-xs:top-[67px] max-xs:h-[34px] max-xs:w-[116px] max-xs:text-[10px]"
        >Предзапись</a>

        <!-- реквизиты и юрдоки (opacity .15 как в оригинале) -->
        <div class="pf-footer__legal absolute left-[10px] top-[209px] w-[199px] max-lg:left-[10px] max-md:top-[394px] max-sm:top-[355px] max-xs:left-[15px] max-xs:top-[290px] max-xs:w-[312px]">
          <p>ИП Попович Наталья Викторовна ИНН: 780528255230</p>
          <p class="mt-[34px] max-md:mt-[84px] max-sm:mt-[84px] max-xs:mt-[104px]">e-mail: info@popovichfit.ru</p>
        </div>
        <div class="pf-footer__legal absolute left-[349px] top-[209px] w-[208px] max-lg:left-[259px] max-md:left-[359px] max-md:top-[394px] max-sm:left-[249px] max-sm:top-[355px] max-xs:left-[15px] max-xs:top-[315px] max-xs:w-[309px]">
          <NuxtLink :to="footerLegal[2]!.href">{{ footerLegal[2]!.label }}</NuxtLink>
          <NuxtLink :to="footerLegal[0]!.href" class="mt-[19px] block whitespace-nowrap max-md:absolute max-md:left-[-349px] max-md:top-[60px] max-sm:left-[-239px] max-xs:static max-xs:mt-[10px]">{{ footerLegal[0]!.label }}</NuxtLink>
        </div>
        <div class="pf-footer__legal absolute left-[658px] top-[209px] w-[208px] max-lg:left-[502px] max-md:left-[359px] max-md:top-[494px] max-sm:left-[249px] max-sm:top-[455px] max-xs:left-[15px] max-xs:top-[435px] max-xs:w-[309px]">
          <NuxtLink :to="footerLegal[3]!.href">{{ footerLegal[3]!.label }}</NuxtLink>
          <NuxtLink :to="footerLegal[4]!.href" class="mt-[19px] block max-md:mt-[9px]">{{ footerLegal[4]!.label }}</NuxtLink>
        </div>
        <div class="pf-footer__legal absolute left-[940px] top-[209px] w-[242px] max-lg:left-[719px] max-md:left-[359px] max-md:top-[446px] max-sm:left-[249px] max-sm:top-[407px] max-xs:left-[15px] max-xs:top-[365px] max-xs:w-[233px]">
          <NuxtLink :to="footerLegal[1]!.href">{{ footerLegal[1]!.label }}</NuxtLink>
        </div>

        <!-- большой логотип -->
        <img
          src="/img/home/popovichfit-135d93.svg"
          alt="POPOVICHFIT"
          width="1154"
          height="139"
          class="absolute left-[23px] top-[313px] w-[1154px] max-lg:left-[17px] max-lg:w-[926px] max-md:left-[14px] max-md:top-[280px] max-md:w-[612px] max-sm:left-[13px] max-sm:top-[270px] max-sm:w-[454px] max-xs:left-[15px] max-xs:top-[230px] max-xs:w-[290px]"
        >
        <div class="absolute left-[20px] top-[495px] h-px w-[1160px] bg-white/[0.27] max-lg:left-[10px] max-lg:top-[468px] max-lg:w-[940px] max-md:top-[578px] max-md:w-[620px] max-sm:top-[535px] max-sm:w-[460px] max-xs:left-[15px] max-xs:top-[486px] max-xs:w-[290px]" />
        <a :href="links.shumann" class="absolute left-[545px] top-[526px] opacity-60 max-lg:left-[425px] max-lg:top-[490px] max-md:left-[265px] max-md:top-[613px] max-sm:left-[185px] max-sm:top-[570px] max-xs:left-[105px] max-xs:top-[513px]" aria-label="Сделано в shumann.ru">
          <img src="/img/home/img_-144731.svg" alt="shumann" width="110" height="11">
        </a>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.pf-footer__link {
  font-size: 12px;
  line-height: 1.55;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  transition: opacity 0.2s ease-in-out;
}
.pf-footer__link:hover { opacity: 0.7; }
.pf-footer__legal, .pf-footer__legal a, .pf-footer__legal p {
  font-size: 12px;
  line-height: 1.3;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.15);
  margin: 0;
}
.pf-footer__legal a { display: block; transition: color 0.2s ease-in-out; }
.pf-footer__legal a:hover { color: rgba(255, 255, 255, 0.5); }
@media (max-width: 479.98px) {
  .pf-footer__link { font-size: 10px; }
  .pf-footer__legal, .pf-footer__legal a, .pf-footer__legal p { font-size: 10px; }
}
@media (min-width: 480px) and (max-width: 639.98px) {
  .pf-footer__link { font-size: 11px; }
  .pf-footer__legal, .pf-footer__legal a, .pf-footer__legal p { font-size: 11px; }
}
</style>
