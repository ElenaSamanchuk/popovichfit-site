<script setup lang="ts">
// old-site: T674 «фиксированный фон» (на 77 страницах, например #rec1120251051 на главной):
// слой на весь экран под контентом (z-index -1) с картинкой-текстурой (repeat), body — #dbdbdb.
defineProps<{ image: string; color?: string; mode?: 'repeat' | 'cover' }>()
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[calc(100vh+120px)]"
    :class="mode === 'cover' ? 'bg-cover bg-center bg-no-repeat' : 'bg-repeat bg-center'"
    :style="{ backgroundImage: `url('${image}')`, backgroundColor: color ?? '#dbdbdb' }"
    aria-hidden="true"
  />
</template>
