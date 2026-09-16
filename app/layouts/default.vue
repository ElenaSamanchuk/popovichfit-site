<script setup lang="ts">
// Общий каркас публичных страниц: шапка, мобильное меню, футер, cookie-баннер, кнопка «наверх», виджет Sender.
// Страницы без шапки/футера в оригинале используют layouts/bare.vue.
</script>

<template>
  <div class="pf-site min-h-screen">
    <SiteHeader />
    <MobileMenu />
    <main class="pf-main">
      <slot />
    </main>
    <SiteFooter />
    <CookieBanner />
    <BackToTop />
    <SupportWidget />
  </div>
</template>
