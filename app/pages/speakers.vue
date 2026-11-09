<script setup lang="ts">
// /speakers — страница спикеров из прототипа дизайнера (site/new/speakers/index.html). На Тильде такой страницы нет:
// noindex, нет в меню и sitemap. Шапка и подвал — общие (layout), картинки — public/home/img/speakers.
import '~/assets/css/pfh-speakers.css'
import speakersHtml from '~/components/home/html/speakers.html?raw'
useSeoMeta({
  title: 'Спикеры проекта POPOVICHFIT',
  description: 'Спикеры проекта POPOVICHFIT: врачи, кинезиологи, стилисты. Лекции и уроки в клубе.',
  robots: 'noindex',
})
</script>

<template>
  <div>
    <PfhPage :html="speakersHtml" />
    <PfhCookie />
  </div>
</template>
