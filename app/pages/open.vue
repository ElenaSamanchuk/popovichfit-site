<script setup lang="ts">
// /open — page346949309 (экспорт 09.11.2026): продажи открыты. Кнопки и меню ведут на /predcor#tariff, /predpow#tariff (как в экспорте).
import openHtml from '~/components/home/html/open.html?raw'
const { siteUrl } = useRuntimeConfig().public
const title = 'POPOVICHFIT. Онлайн фитнес-клуб Натальи Попович'
const description = 'Онлайн фитнес-клуб, в который хочется возвращаться. «Осанка, пресс, тазовое дно, рельеф тела и любовь к себе — тренировки, которые работают с телом и головой»'
useSeoMeta({ title, description, ogTitle: title, ogDescription: description, ogUrl: siteUrl + '/open', ogType: 'website' })
useHead({ link: [{ rel: 'canonical', href: siteUrl + '/open' }] })
</script>

<template>
  <div>
    <PfhPage preload :html="openHtml" sales="open" />
    <PfhCookie />
  </div>
</template>
