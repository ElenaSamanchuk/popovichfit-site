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

/** запуск анимаций появления: элемент стартует, когда его рамка попадает в окно (как t_animate__startAnimation — по
 *  getBoundingClientRect, без учёта обрезки overflow: IntersectionObserver тут не годится — сдвинутый на 100px вниз элемент
 *  внизу артборда с overflow:hidden «не пересекается» с окном и никогда бы не появился) */
const pending = new Set<HTMLElement>()
let listening = false
let ticking = false
function check() {
  ticking = false
  const vh = window.innerHeight
  for (const el of pending) {
    // как у Тильды: старт, когда верх элемента выше нижней границы окна (в т.ч. элементы выше окна, в fixed-плашках, скрытые)
    if (el.getBoundingClientRect().top < vh) { el.classList.add('tz__ap--in'); pending.delete(el) }
  }
  if (!pending.size && listening) { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); document.removeEventListener('click', onScroll, true); document.removeEventListener('transitionend', onScroll, true); listening = false }
}
function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(check) } }
export function initAppear(root: HTMLElement) {
  const els = [...root.querySelectorAll<HTMLElement>('.tz__ap:not(.tz__ap--in)')]
  if (!els.length) return
  const html = document.documentElement
  const now = (el: HTMLElement) => el.classList.add('tz__ap--now', 'tz__ap--in')
  if (!html.classList.contains('pf-js')) { els.forEach(now); return }
  const mobile = html.classList.contains('pf-nomob')
  for (const el of els) {
    if (mobile && el.classList.contains('tz__ap--desktop')) { now(el); continue }
    // уже пролистано выше экрана (страница открыта по якорю) — без анимации, как у Тильды
    if (el.getBoundingClientRect().bottom < -500) { now(el); continue }
    pending.add(el)
  }
  if (!listening && pending.size) {
    window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll)
    // показ по клику/переходу (вкладки, «показать ещё», плашки): без прокрутки тоже перепроверяем
    document.addEventListener('click', onScroll, true); document.addEventListener('transitionend', onScroll, true)
    listening = true
  }
  onScroll()
}
