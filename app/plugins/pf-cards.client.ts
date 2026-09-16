// Инициализация карточек тарифов после монтирования и при переходах (см. utils/pf-cards.ts).
import { initPfCards } from '~/utils/pf-cards'
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => nextTick(() => initPfCards()))
  nuxtApp.hook('page:finish', () => nextTick(() => initPfCards()))
})
