/** Анимация появления Zero Block (t-animate Тильды: data-animate-style / duration / delay / distance / scale / mobile).
 *  Классы: .tz__ap .tz__ap--<style> (+ .tz__ap--desktop, если без data-animate-mobile="y" — на экранах < 1200 не анимируется);
 *  параметры — CSS-переменные --ap-* в правиле элемента (utils/tilda-css.ts appearVars), запуск — initAppear (IntersectionObserver).
 *  Скрытое состояние включается только при html.pf-js (скрипт в <head>, см. nuxt.config): без JS, для Playwright
 *  (navigator.webdriver) и при prefers-reduced-motion всё видно сразу. */
export const APPEAR_STYLES = new Set(['fadein', 'fadeinup', 'fadeindown', 'fadeinleft', 'fadeinright', 'zoomin', 'zoomout'])

export function appearClass(anim?: Record<string, string> | null): string {
  const s = anim?.style
  if (!s || !APPEAR_STYLES.has(s)) return ''
  return `tz__ap tz__ap--${s}${anim!.mobile === 'y' ? '' : ' tz__ap--desktop'}`
}

/** CSS-переменные анимации появления для правила элемента/группы */
export function appearVars(anim?: Record<string, string> | null): string {
  const s = anim?.style
  if (!s || !APPEAR_STYLES.has(s)) return ''
  const num = (v: string | undefined, d: number) => { const n = parseFloat(v || ''); return Number.isFinite(n) ? n : d }
  let css = `--ap-dur:${num(anim!.duration, 1)}s;--ap-delay:${num(anim!.delay, 0)}s;--ap-ease:cubic-bezier(.19,1,.22,1);`
  if (anim!.distance) css += `--ap-dist:${num(anim!.distance, 100)}px;`
  if (anim!.scale) css += `--ap-scale:${num(anim!.scale, s === 'zoomout' ? 1.1 : 0.9)};`
  return css
}

/** запуск анимаций появления внутри корня: элемент стартует, когда попадает в окно (как t_animate__startAnimation) */
export function initAppear(root: HTMLElement) {
  const els = [...root.querySelectorAll<HTMLElement>('.tz__ap:not(.tz__ap--in)')]
  if (!els.length) return
  const html = document.documentElement
  const now = (el: HTMLElement) => el.classList.add('tz__ap--now', 'tz__ap--in')
  if (!html.classList.contains('pf-js')) { els.forEach(now); return }
  const mobile = html.classList.contains('pf-nomob')
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) { (en.target as HTMLElement).classList.add('tz__ap--in'); io.unobserve(en.target) }
  }, { threshold: 0 })
  for (const el of els) {
    if (mobile && el.classList.contains('tz__ap--desktop')) { now(el); continue }
    // уже пролистано выше экрана (страница открыта по якорю) — без анимации, как у Тильды
    if (el.getBoundingClientRect().bottom < -500) { now(el); continue }
    io.observe(el)
  }
}
