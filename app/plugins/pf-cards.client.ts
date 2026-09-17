// Инициализация карточек тарифов после монтирования и при переходах (см. utils/pf-cards.ts).
import { initPfCards } from '~/utils/pf-cards'
export default defineNuxtPlugin((nuxtApp) => {
  // только после гидрации страницы (page:finish): страница асинхронная (Suspense), на app:mounted её DOM ещё не гидрирован
  nuxtApp.hook('page:finish', () => nextTick(() => initPfCards()))
})
