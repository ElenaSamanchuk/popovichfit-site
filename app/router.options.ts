import type { RouterConfig } from '@nuxt/schema'

/** Прокрутка при переходах: якорь (/#rec…) с другой страницы — ждём, пока блок появится в DOM (страница рендерится из данных
 *  после перехода, стандартный scrollBehavior Nuxt ищет элемент раньше и остаётся наверху), затем плавно прокручиваем;
 *  «назад/вперёд» — сохранённая позиция; новая страница — наверх. */
function waitFor(sel: string, ms = 4000): Promise<Element | null> {
  return new Promise((resolve) => {
    const t0 = Date.now()
    const tick = () => {
      let el: Element | null = null
      try { el = document.querySelector(sel) } catch { el = null }
      if (el) return resolve(el)
      if (Date.now() - t0 > ms) return resolve(null)
      setTimeout(tick, 50)
    }
    tick()
  })
}

export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) {
      return waitFor(to.hash).then((el) => (el ? { el: to.hash, behavior: 'smooth' } : (to.path !== from.path ? { left: 0, top: 0 } : undefined)))
    }
    if (to.path !== from.path) return { left: 0, top: 0 }
    return undefined
  },
}
