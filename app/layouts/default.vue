<script setup lang="ts">
// Общий каркас публичных страниц: мобильное меню (T450), кнопка «наверх», виджет Sender. Шапка/футер/cookie/ВК — блоки страницы.
// Страницы без шапки/футера в оригинале используют layouts/bare.vue.
</script>

<template>
  <div class="pf-site min-h-screen">
    <!-- шапка, футер, cookie и плашка ВК — Zero Block'и страницы (данные экспорта), см. tilda/TildaPage.vue -->
    <MobileMenu />
    <main class="pf-main">
      <slot />
    </main>
    <BackToTop />
    <SupportWidget />
  </div>
</template>
