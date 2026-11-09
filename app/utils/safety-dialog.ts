// Порт inline-скрипта T123 «Противопоказания и безопасность» (rec5324828001 на /course_correction, rec5324841101 на /course_power):
// <dialog id="safety"> открывается кликом по любой ссылке вида #safety на этой же странице и по hash при загрузке; закрытие —
// крестик, клик по подложке, Esc (с анимацией 160 мс), блокировка прокрутки страницы, возврат фокуса, очистка hash.
// В отличие от оригинала, слушатели снимаются при уходе со страницы (SPA-навигация).
export function initSafetyDialog(popup: HTMLDialogElement): () => void {
  if (popup.dataset.ready) return () => {}
  popup.dataset.ready = 'true'
  const hash = '#safety'
  let lastFocus: Element | null = null
  let oldHtmlOverflow = '', oldBodyOverflow = '', closing = false
  const open = (trigger?: Element | null) => {
    if (popup.open) return
    lastFocus = trigger || document.activeElement
    oldHtmlOverflow = document.documentElement.style.overflow
    oldBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    popup.showModal()
    const body = popup.querySelector<HTMLElement>('.pf-contra-body'); if (body) body.scrollTop = 0
  }
  const close = () => {
    if (!popup.open || closing) return
    closing = true
    popup.classList.add('is-closing')
    const delay = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 160
    setTimeout(() => popup.close(), delay)
  }
  const onDocClick = (event: MouseEvent) => {
    const link = (event.target as HTMLElement | null)?.closest?.('a[href]')
    if (!link) return
    let url: URL
    try { url = new URL(link.getAttribute('href') || '', location.href) } catch { return }
    if (url.hash !== hash || url.origin !== location.origin || url.pathname !== location.pathname) return
    event.preventDefault(); event.stopPropagation()
    open(link)
  }
  const onClose = () => {
    popup.classList.remove('is-closing'); closing = false
    if (location.hash === hash) history.replaceState(null, '', location.pathname + location.search)
    document.documentElement.style.overflow = oldHtmlOverflow
    document.body.style.overflow = oldBodyOverflow
    if (lastFocus instanceof HTMLElement && lastFocus.isConnected) lastFocus.focus({ preventScroll: true })
  }
  const onCancel = (event: Event) => { event.preventDefault(); close() }
  const onPopupClick = (event: MouseEvent) => {
    if (event.target !== popup) return
    const r = popup.getBoundingClientRect()
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close()
  }
  const onHash = () => { if (location.hash === hash) open() }
  const btn = popup.querySelector('.pf-contra-close')
  document.addEventListener('click', onDocClick, true)
  btn?.addEventListener('click', close)
  popup.addEventListener('cancel', onCancel)
  popup.addEventListener('click', onPopupClick)
  popup.addEventListener('close', onClose)
  addEventListener('hashchange', onHash)
  if (location.hash === hash) open()
  return () => {
    document.removeEventListener('click', onDocClick, true)
    btn?.removeEventListener('click', close)
    popup.removeEventListener('cancel', onCancel); popup.removeEventListener('click', onPopupClick); popup.removeEventListener('close', onClose)
    removeEventListener('hashchange', onHash)
    if (popup.open) popup.close()
    document.documentElement.style.overflow = oldHtmlOverflow || ''
    document.body.style.overflow = oldBodyOverflow || ''
  }
}
