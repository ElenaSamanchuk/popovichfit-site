<script setup lang="ts">
// Общий каркас публичных страниц: новая шапка + меню и подвал дизайнера (один источник на все страницы, components/home),
// кнопка «наверх», виджет Sender. Cookie и плашка ВК — блоки страницы (tilda/TildaPage.vue) или PfhCookie.
</script>

<template>
  <div class="pf-site min-h-screen">
    <PfhHeader />
    <main class="pf-main">
      <slot />
    </main>
    <PfhFooter />
    <BackToTop />
    <ImageZoom />
    <SupportWidget />
  </div>
</template>
