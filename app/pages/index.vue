<script setup lang="ts">
// Главная: режим «продажи закрыты» (home.html) или «открыты» (open.html) — app/data/sales.ts.  — новый дизайн, блоки T131 страницы page36594700 (экспорт 09.11.2026):
// разметка 1:1 в components/home/html/home.html, стили assets/css/pfh.css, скрипты utils/pfh.ts. Шапка и подвал — в layout.
import homeHtml from '~/components/home/html/home.html?raw'
import openHtml from '~/components/home/html/open.html?raw'
import { SALES_OPEN } from '~/data/sales'
usePageMeta('page36594700.html')
</script>

<template>
  <div>
    <PfhPage preload :html="SALES_OPEN ? openHtml : homeHtml" :sales="SALES_OPEN ? 'open' : 'closed'" />
    <PfhCookie />
  </div>
</template>
