<script setup lang="ts">
// old-site: шапка Zero Block #rec1120433846 (на 178 страницах).
// Десктоп (≥960): серая полоса 44px (#f5f5f5) с белой полоской 10px сверху, белая плашка логотипа слева
// (109×43, скругление справа снизу), пункты меню 10px uppercase, справа белая плашка с тёмной кнопкой
// «Личный кабинет». Мобайл (<960): белая полоса 44px (34px на <480), логотип, кнопка ЛК, гамбургер.
import { headerNav } from '~/data/nav'
import { links } from '~/data/links'

const { toggleMenu } = useSiteMenu()
</script>

<template>
  <header class="pf-header fixed inset-x-0 top-0 z-[1000] h-[44px] bg-bar max-md:bg-white max-xs:h-[34px]">
    <!-- белая полоска сверху (только десктоп) -->
    <div class="absolute inset-x-0 top-0 h-[10px] bg-white max-md:hidden" aria-hidden="true" />

    <!-- логотип -->
    <NuxtLink
      to="/"
      class="absolute left-0 top-0 flex h-[43px] w-[109px] items-center gap-[7px] rounded-br-[6px] bg-white pl-[13px] max-md:left-[12px] max-md:w-auto max-md:bg-transparent max-md:pl-0 max-xs:left-[8px] max-xs:h-[34px]"
      aria-label="Popovichfit — на главную"
    >
      <img src="/img/home/group_1321318777.svg" alt="" width="14" height="14" class="h-[14px] w-[14px] max-xs:h-[13px] max-xs:w-[13px]">
      <span class="pt-[1px] text-[10px] font-medium uppercase leading-[1.2] tracking-[0.02em] text-ink max-xs:text-[9px]">Popovichfit</span>
    </NuxtLink>

    <!-- меню (десктоп): белая плашка 499×34 по центру сетки (group #175006465878646380) -->
    <nav
      class="absolute left-[calc(50%-248px)] top-[10px] flex h-[34px] w-[499px] items-center gap-[16px] rounded-b-[6px] bg-white px-[20px] py-[9px] max-md:hidden"
      aria-label="Основное меню"
    >
      <template v-for="item in headerNav" :key="item.label">
        <a
          v-if="item.external"
          :href="item.href"
          class="pf-header__link"
          :class="item.accent && 'pf-header__link--accent'"
        >{{ item.label }}</a>
        <NuxtLink
          v-else
          :to="item.href"
          class="pf-header__link"
          :class="item.accent && 'pf-header__link--accent'"
        >{{ item.label }}</NuxtLink>
      </template>
    </nav>

    <!-- правая часть: белая плашка + кнопка ЛК -->
    <div class="absolute right-0 top-0 flex h-[43px] w-[126px] items-start justify-end rounded-bl-[6px] bg-white pr-[10px] pt-[11px] max-md:right-[54px] max-md:w-auto max-md:bg-transparent max-md:pr-0 max-md:pt-[10px] max-xs:right-[47px] max-xs:pt-[8px]">
      <a
        :href="links.lk"
        class="flex h-[24px] w-[108px] items-center justify-center rounded-[4px] bg-ink text-[10px] font-semibold leading-[1.55] text-white transition-opacity hover:opacity-80 max-xs:h-[19px] max-xs:w-[78px] max-xs:text-[8px]"
      >Личный кабинет</a>
    </div>

    <!-- гамбургер (мобайл) -->
    <button
      type="button"
      class="absolute right-[12px] top-[10px] hidden h-[24px] w-[34px] items-center justify-center rounded-[4px] bg-bar-2 max-md:flex max-xs:right-[8px] max-xs:top-[8px] max-xs:h-[19px] max-xs:w-[26px]"
      aria-label="Открыть меню"
      @click="toggleMenu"
    >
      <span class="flex flex-col gap-[2px]">
        <span class="block h-[2px] w-[14px] rounded bg-ink max-xs:w-[10px]" />
        <span class="block h-[2px] w-[14px] rounded bg-ink max-xs:w-[10px]" />
      </span>
    </button>
  </header>
</template>

<style scoped>
.pf-header__link {
  font-size: 10px;
  line-height: 1.55;
  font-weight: 500;
  text-transform: uppercase;
  color: var(--color-ink);
  transition: opacity 0.2s ease-in-out;
}
.pf-header__link:hover { opacity: 0.7; }
.pf-header__link--accent { color: #f83e60; }
</style>
