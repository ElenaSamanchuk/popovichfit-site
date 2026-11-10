<script setup lang="ts">
// Виджет поддержки Sender (решение владельца: только Sender, на всех страницах).
// Скрипт и ключи — из блока T123 экспорта (docs/tilda-custom-code/013_*.html).
useHead({
  script: [
    {
      key: 'sender-widget',
      src: 'https://senndder.ru/popovichfit-widget/widget.js',
      async: true,
      'data-widget-id': 'cmsiry9fw1ef4a7c912b3',
      'data-api-key': 'cmsiry9fxde42d839d1ed',
      'data-api-url': 'https://senndder.ru/api',
      tagPosition: 'bodyClose',
    },
  ],
})
</script>

<template>
  <span hidden data-component="SupportWidget" />
</template>
