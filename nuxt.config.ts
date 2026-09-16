import tailwindcss from '@tailwindcss/vite'

// Статическая генерация всех страниц (nuxt generate) + серверные роуты /api/* для форм и корзины
// (работают при запуске через `nuxt build` + node-server; при чисто статическом хостинге
// формы ходят на NUXT_PUBLIC_API_BASE).
export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  devtools: { enabled: false },
  components: [{ path: '~/components', pathPrefix: false }],
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  app: {
    head: {
      htmlAttrs: { lang: 'ru' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'yandex-verification', content: 'ef3a6b04ad30f479' },
      ],
      link: [{ rel: 'shortcut icon', href: '/favicon.ico', type: 'image/x-icon' }],
    },
  },
  runtimeConfig: {
    // серверные секреты — только через переменные окружения NUXT_*
    telegramBotToken: '',
    telegramChatId: '',
    smtpUrl: '',
    mailTo: 'info@popovichfit.ru',
    cloudpaymentsApiSecret: '',
    public: {
      siteUrl: 'https://popovichfit.ru',
      apiBase: '', // '' = тот же origin (/api/...)
      cloudpaymentsPublicId: '',
      metrikaId: '88400923',
      vkPixelId: 'VK-RTRG-1817271-8E0Ye',
    },
  },
  nitro: {
    prerender: { crawlLinks: true, routes: ['/'], failOnError: false },
  },
  router: { options: { scrollBehaviorType: 'smooth' } },
})
