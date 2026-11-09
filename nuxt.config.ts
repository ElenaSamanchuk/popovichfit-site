import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { pages } from './app/data/pages'
import { SALES_OPEN, SALES_REDIRECTS } from './app/data/sales'

// все URL экспорта — чтобы пререндер не зависел от обхода ссылок (черновики и legacy-страницы никто не линкует)
const closedSalesRoutes = new Set(SALES_OPEN ? [] : Object.keys(SALES_REDIRECTS))
const prerenderRoutes = Object.values(pages)
  .filter(p => p.published !== false && p.url !== '/404.html' && !closedSalesRoutes.has(p.url))
  .map(p => p.url)
const previewMode = process.env.POPOVICHFIT_PREVIEW === '1'

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
        ...(previewMode ? [{ name: 'robots', content: 'noindex, nofollow, noarchive' }] : []),
      ],
      link: [{ rel: 'shortcut icon', href: '/favicon.ico', type: 'image/x-icon' }],
      // анимации появления (t-animate) включаются только при JS и без prefers-reduced-motion; Playwright (webdriver) — без анимаций и без smooth-scroll
      script: [{ innerHTML: "(function(){var h=document.documentElement;if(navigator.webdriver){h.classList.add('pf-wd')}else if(!matchMedia('(prefers-reduced-motion: reduce)').matches){h.classList.add('pf-js')}if(window.innerWidth<1200)h.classList.add('pf-nomob')})()", tagPosition: 'head' }],
    },
  },
  runtimeConfig: {
    // серверные секреты — только через переменные окружения NUXT_*
    telegramBotToken: '',
    telegramChatId: '',
    smtpUrl: '',
    mailTo: 'info@popovichfit.ru',
    cloudpaymentsApiSecret: '',
    previewToken: '', // NUXT_PREVIEW_TOKEN — просмотр скрытых страниц: /<url>?preview=<токен>
    public: {
      previewMode,
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
    ...Object.fromEntries([...closedSalesRoutes].map(route => [route, { prerender: false }])),
  },
  nitro: {
    // crawlLinks выключен: все адреса заданы списком, а обход ссылок Nitro падает на URI с некорректным % в ссылках экспорта
    prerender: { crawlLinks: false, routes: ['/', '/sitemap.xml', '/open', '/close', '/speakers', ...(SALES_OPEN ? ['/sales-open', '/pred', '/predcor', '/predpow'] : []), ...prerenderRoutes], failOnError: false },
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
