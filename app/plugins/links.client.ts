// Правило ссылок (просьба заказчика 18.09): страницы этого сайта — в той же вкладке, все внешние — в новой;
// якоря (#…) — плавная прокрутка (scroll-behavior: smooth в CSS). Работает для любой разметки (Zero Block, HTML типовых
// блоков, попапы): цель выставляется в момент клика, до перехода.
export default defineNuxtPlugin(() => {
  const own = new Set(['popovichfit.ru', 'www.popovichfit.ru', location.hostname])
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href]')
    if (!a) return
    const href = a.getAttribute('href') || ''
    if (!/^https?:\/\//i.test(href)) { // относительные, #якоря, tg:, mailto: — как есть, но свои страницы не в новой вкладке
      if (a.target === '_blank' && (href.startsWith('/') || href.startsWith('#'))) a.removeAttribute('target')
      return
    }
    let host = ''
    try { host = new URL(href).hostname } catch { return }
    if (own.has(host)) { if (a.target === '_blank') a.removeAttribute('target') }
    else { a.target = '_blank'; if (!/noopener/.test(a.rel)) a.rel = (a.rel ? a.rel + ' ' : '') + 'noopener' }
  }, true)
})
