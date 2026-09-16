<script setup lang="ts">
// old-site: мобильное меню T450 #rec592229670 (левая выезжающая панель 260px, тёмный фон,
// пункты 20px белые по правому краю, соцсети, кнопки «ПРЕДЗАПИСЬ» и «ТЕХ.ПОДДЕРЖКА»).
import { mobileNav } from '~/data/nav'
import { links } from '~/data/links'

const { open, closeMenu } = useSiteMenu()
const route = useRoute()

watch(() => route.fullPath, () => closeMenu())

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') closeMenu()
}
onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <div>
    <!-- оверлей -->
    <div
      class="fixed inset-0 z-[99998] bg-black/60 transition-opacity duration-300"
      :class="open ? 'opacity-100' : 'pointer-events-none opacity-0'"
      aria-hidden="true"
      @click="closeMenu"
    />
    <!-- панель -->
    <nav
      class="fixed inset-y-0 left-0 z-[99999] flex w-full max-w-[260px] flex-col overflow-y-auto bg-[#111] px-[40px] pb-[38px] pt-[48px] text-right transition-transform duration-300 ease-in-out"
      :class="open ? 'translate-x-0' : '-translate-x-full'"
      :aria-hidden="!open"
      aria-label="Мобильное меню"
    >
      <button
        type="button"
        class="absolute right-[5px] top-[5px] flex h-[40px] w-[40px] items-center justify-center bg-[#111]"
        aria-label="Закрыть меню"
        @click="closeMenu"
      >
        <span class="relative block h-[20px] w-[24px]">
          <span class="absolute left-0 top-[9px] block h-[2px] w-full rotate-45 bg-white" />
          <span class="absolute left-0 top-[9px] block h-[2px] w-full -rotate-45 bg-white" />
        </span>
      </button>

      <ul class="m-0 list-none p-0">
        <li v-for="item in mobileNav" :key="item.label" class="block">
          <NuxtLink
            :to="item.href"
            class="mb-[15px] inline-block font-involve text-[20px] font-medium text-white transition-opacity duration-300 hover:opacity-60"
            @click="closeMenu"
          >{{ item.label }}</NuxtLink>
        </li>
      </ul>

      <div class="relative mt-auto">
        <ul class="mt-[24px] flex list-none justify-end gap-[8px] p-0" aria-label="Соц. сети">
          <li><a :href="links.instagram" target="_blank" rel="nofollow" aria-label="instagram"><SocialIcon name="instagram" /></a></li>
          <li><a :href="links.telegramNatalya" target="_blank" rel="nofollow" aria-label="telegram"><SocialIcon name="telegram" /></a></li>
          <li><a :href="links.youtube" target="_blank" rel="nofollow" aria-label="youtube"><SocialIcon name="youtube" /></a></li>
        </ul>
        <div class="mt-[15px] flex flex-wrap justify-end gap-x-[5px]">
          <a
            :href="links.preorderBot"
            class="pf-btn-blue-alt mt-[10px] inline-flex h-[45px] items-center justify-center rounded-[8px] px-[24px] text-[12px] font-bold uppercase text-white"
          >ПРЕДЗАПИСЬ</a>
          <a
            :href="links.supportBot"
            target="_blank"
            class="mt-[10px] inline-flex h-[45px] items-center justify-center rounded-[8px] bg-white px-[24px] text-[12px] font-bold uppercase text-[#4f86c4]"
          >ТЕХ.ПОДДЕРЖКА</a>
        </div>
      </div>
    </nav>
  </div>
</template>
