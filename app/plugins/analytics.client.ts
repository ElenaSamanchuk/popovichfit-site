// Аналитика как на Тильде: Яндекс.Метрика 88400923 (clickmap, trackLinks, accurateTrackBounce, webvisor,
// ecommerce dataLayer) + VK-пиксель VK-RTRG-1817271-8E0Ye. Загружается с задержкой 2 с (как в экспорте),
// при клиентской навигации отправляет hit. В dev-режиме не грузится.
declare global {
  interface Window {
    ym?: (...args: unknown[]) => void
    dataLayer?: unknown[]
    VK?: { Retargeting: { Init: (id: string) => void; Hit: () => void } }
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.dev) return
  const { metrikaId, vkPixelId } = useRuntimeConfig().public
  const router = useRouter()

  setTimeout(() => {
    if (metrikaId) {
      window.dataLayer = window.dataLayer || []
      ;(function (m: any, e: Document, t: string, r: string, i: string) {
        m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments) }
        m[i].l = 1 * (new Date() as unknown as number)
        const k = e.createElement(t) as HTMLScriptElement
        const a = e.getElementsByTagName(t)[0]
        k.async = true
        k.src = r
        a?.parentNode?.insertBefore(k, a)
      })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym')
      window.ym?.(metrikaId, 'init', {
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
        webvisor: true,
        ecommerce: 'dataLayer',
      })
      router.afterEach((to, from) => {
        if (to.fullPath !== from.fullPath) window.ym?.(metrikaId, 'hit', to.fullPath, { referer: from.fullPath })
      })
    }
    if (vkPixelId) {
      const s = document.createElement('script')
      s.type = 'text/javascript'
      s.async = true
      s.src = 'https://vk.com/js/api/openapi.js?169'
      s.onload = () => {
        window.VK?.Retargeting.Init(vkPixelId)
        window.VK?.Retargeting.Hit()
      }
      document.head.appendChild(s)
    }
  }, 2000)

  nuxtApp.hook('app:mounted', () => {
    // <noscript>-пиксель Метрики добавлять не нужно: без JS не будет и Nuxt-приложения
  })
})
