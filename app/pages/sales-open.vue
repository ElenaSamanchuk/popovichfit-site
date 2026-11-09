<script setup lang="ts">
// Служебный маркер режима продаж для nginx: страница существует (и пререндерится в sales-open/index.html) только при SALES_OPEN=true.
// nginx отдаёт /pred, /predcor, /predpow, если файл есть, и редиректит (302), если файла нет. Не индексируется.
import { SALES_OPEN } from '~/data/sales'
definePageMeta({ layout: false })
if (!SALES_OPEN) throw createError({ statusCode: 404, statusMessage: 'Страница не найдена', fatal: true })
useSeoMeta({ title: 'sales-open', robots: 'noindex' })
</script>

<template>
  <span>sales-open</span>
</template>
