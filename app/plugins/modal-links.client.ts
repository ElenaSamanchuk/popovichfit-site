// Перехват hash-ссылок попапов (как t-popup на Тильде): клик по <a href="#popup:x">/#zeropopup/#app…
// открывает зарегистрированный <Modal name="…">, #closepopup — закрывает. При загрузке страницы с таким
// hash (внешняя ссылка вида /course_correction#popup:mygallery_svt) попап открывается сам.
export default defineNuxtPlugin((nuxtApp) => {
  const modal = useModal()

  function handle(hash: string): boolean {
    const name = modal.nameFromHash(hash)
    if (!name) return false
    if (name === modal.HASH_CLOSE) modal.close()
    else modal.open(name)
    return true
  }

  nuxtApp.hook('app:mounted', () => {
    document.addEventListener('click', (e) => {
      const a = (e.target as HTMLElement | null)?.closest('a[href]') as HTMLAnchorElement | null
      if (!a) return
      const href = a.getAttribute('href') || ''
      const idx = href.indexOf('#')
      if (idx < 0) return
      const hash = href.slice(idx)
      // ссылка на другую страницу с hash — не наша забота
      const path = href.slice(0, idx)
      if (path && path !== location.pathname && path !== location.origin + location.pathname && !path.endsWith(location.pathname)) return
      if (handle(hash)) e.preventDefault()
    }, true)

    // открыть попап по hash при загрузке (попапы регистрируются после монтирования страницы)
    setTimeout(() => { if (location.hash) handle(location.hash) }, 300)
  })
})
