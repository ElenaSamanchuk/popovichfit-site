<script setup lang="ts">
// /pred — страница продаж «открыты» (в экспорте Тильды файла нет, на живом сайте 404): разметка из копии 06.11.2026
// (popovichfit-home-tilda/work/2026-11-06-all-published-final/pred-desktop.html, блок 5325187701), очищена от следов runtime,
// FAQ/#safety/тег как на текущей главной; кнопки ведут на /predcor#tariff, /predpow#tariff. Шапка/подвал — «открытый» вариант.
// Пока SALES_OPEN=false адрес редиректится на «/» (middleware/sales.global.ts).
import predHtml from '~/components/home/html/pred.html?raw'
import { SALES_OPEN } from '~/data/sales'
if (!SALES_OPEN) throw createError({ statusCode: 404, statusMessage: 'Страница не найдена', fatal: true })
const { siteUrl } = useRuntimeConfig().public
const title = 'POPOVICHFIT. Онлайн фитнес-клуб Натальи Попович'
const description = 'Онлайн фитнес-клуб, в который хочется возвращаться. «Осанка, пресс, тазовое дно, рельеф тела и любовь к себе — тренировки, которые работают с телом и головой»'
useSeoMeta({ title, description, ogTitle: title, ogDescription: description, ogUrl: siteUrl + '/pred', ogType: 'website' })
useHead({ link: [{ rel: 'canonical', href: siteUrl + '/pred' }] })
</script>

<template>
  <div>
    <PfhPage preload :html="predHtml" sales="open" />
    <PfhCookie />
  </div>
</template>
