<script setup lang="ts">
// /close — page345934909 (экспорт 09.11.2026): продажи закрыты. Разметка 1:1, как на Тильде (в т. ч. прежние тексты про беременность и окно data-open="contra").
import closeHtml from '~/components/home/html/close.html?raw'
const { siteUrl } = useRuntimeConfig().public
const title = 'POPOVICHFIT. Онлайн фитнес-клуб Натальи Попович'
const description = 'Онлайн фитнес-клуб, в который хочется возвращаться. «Осанка, пресс, тазовое дно, рельеф тела и любовь к себе — тренировки, которые работают с телом и головой»'
useSeoMeta({ title, description, ogTitle: title, ogDescription: description, ogUrl: siteUrl + '/close', ogType: 'website' })
useHead({ link: [{ rel: 'canonical', href: siteUrl + '/close' }] })
</script>

<template>
  <div>
    <PfhPage preload :html="closeHtml" sales="closed" />
    <PfhCookie />
  </div>
</template>
