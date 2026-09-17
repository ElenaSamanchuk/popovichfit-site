import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { pages } from './app/data/pages'

// все URL экспорта — чтобы пререндер не зависел от обхода ссылок (черновики и legacy-страницы никто не линкует)
const prerenderRoutes = Object.values(pages).map((p) => p.url).filter((u) => u !== '/404.html')

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
  // Гибрид: все страницы пререндерятся при сборке (статический HTML), /api/* и sitemap живут в node-server.
  // `nuxt build` → .output (node .output/server/index.mjs); `nuxt generate` → чисто статика (формы через NUXT_PUBLIC_API_BASE).
  routeRules: {
    '/**': { prerender: true },
    '/api/**': { prerender: false, cache: false },
    '/sitemap.xml': { prerender: true },
  },
  nitro: {
    // crawlLinks выключен: все адреса заданы списком, а обход ссылок Nitro падает на URI с некорректным % в ссылках экспорта
    prerender: { crawlLinks: false, routes: ['/', '/sitemap.xml', ...prerenderRoutes], failOnError: false },
    // JSON страниц экспорта — серверные ассеты (лениво, по файлу), см. server/api/tilda/[file].get.ts
    serverAssets: [{ baseName: 'tilda', dir: fileURLToPath(new URL('./app/data/tilda', import.meta.url)) }],  // dir иначе считается от server/
    hooks: {
      // страницы с адресом /pageNNN.html пишем как каталог pageNNN.html/index.html: иначе файл pageNNN.html
      // конфликтует с каталогом для _payload.json (nginx/Nitro отдают $uri/index.html)
      'prerender:generate'(route) {
        if (/\.html$/.test(route.route) && route.fileName && !route.fileName.endsWith('/index.html') && !route.fileName.endsWith('_payload.json')) route.fileName = route.route + '/index.html'
      },
    },
  },
  router: { options: { scrollBehaviorType: 'smooth' } },
})
