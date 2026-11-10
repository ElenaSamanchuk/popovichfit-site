// Поведение новых блоков дизайнера (T131 на Тильде: шапка/меню, главная, /open, /close, подвал).
// Разметка и стили — app/components/home + app/assets/css/pfh.css; здесь порт скриптов из экспорта
// (блоки 5322139701/5440846801) без глобальных переменных: каждый init привязан к своему корню, все слушатели
// снимаются через AbortController, поэтому при переходах внутри сайта (без перезагрузки) ничего не дублируется.

const q = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel)
const qa = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)]

const KINESCOPE = 'https://kinescope.io/embed/iv769rTaa71GS556RpcQdn'
const UTM_KEYS = ['r', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const
const SALEBOT = 'https://salebot.site/62b5cbabae0fe1409f44ce65d9274be9_1?utm_content=r%3D'

/** Меню шапки: бургер, закрытие по крестику/фону/ссылке/Escape, снятие блокировки при ширине ≥1024 */
export function initMenu(root: HTMLElement) {
  const burger = q<HTMLButtonElement>('.burger', root)
  const sheet = q('#sheet', root)
  if (!burger || !sheet) return { close() {}, destroy() {} }
  const ac = new AbortController()
  const { signal } = ac
  let timer: ReturnType<typeof setTimeout> | undefined
  const set = (open: boolean) => {
    clearTimeout(timer)
    burger.setAttribute('aria-expanded', String(open))
    document.body.classList.toggle('is-locked', open)
    if (open) {
      sheet.hidden = false
      setTimeout(() => sheet.classList.add('is-open'), 30)
      q('.menu__x', sheet)?.focus({ preventScroll: true })
    } else {
      sheet.classList.remove('is-open')
      timer = setTimeout(() => { sheet.hidden = true }, 300)
    }
  }
  burger.addEventListener('click', () => set(sheet.hidden), { signal })
  sheet.addEventListener('click', (e) => {
    if ((e.target as Element).closest('[data-close],.menu__x,.menu__nav a,.menu__btn')) set(false)
  }, { signal })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !sheet.hidden) { set(false); burger.focus() }
  }, { signal })
  matchMedia('(min-width:1024px)').addEventListener('change', (e) => {
    if (e.matches && !sheet.hidden) { sheet.hidden = true; sheet.classList.remove('is-open'); document.body.classList.remove('is-locked') }
  }, { signal })
  return {
    close() { if (!sheet.hidden) set(false) },
    destroy() { ac.abort(); clearTimeout(timer); document.body.classList.remove('is-locked') },
  }
}

/** r и utm из адреса дописываются в ссылки на этот сайт; ссылка на бот предзаписи при r подменяется на salebot (как в экспорте) */
export function decorateLinks(root: ParentNode) {
  const sp = new URLSearchParams(location.search)
  const params: Record<string, string> = {}
  UTM_KEYS.forEach((k) => { const v = sp.get(k); if (v) params[k] = v })
  if (!Object.keys(params).length) return
  qa<HTMLAnchorElement>('a[href]', root).forEach((a) => {
    const href = a.getAttribute('href') || ''
    if (/^https:\/\/t\.me\/(POPOVICHcourse_bot|popovichfitcourse_bot)/i.test(href)) {
      if (params.r) a.setAttribute('href', SALEBOT + encodeURIComponent(params.r))
      return
    }
    if (href.startsWith('#')) return
    let u: URL
    try { u = new URL(href, location.href) } catch { return }
    if (u.hostname === location.hostname || /^(www\.)?popovichfit\.ru$/.test(u.hostname)) {
      Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v))
      a.setAttribute('href', u.origin === location.origin ? u.pathname + u.search + u.hash : u.toString())
    }
  })
}

/** Ссылки на свои страницы внутри v-html ведём через роутер (без перезагрузки). */
export function bindSpaLinks(root: HTMLElement, go: (to: string) => void) {
  const ac = new AbortController()
  root.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href]')
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return
    let u: URL
    try { u = new URL(a.getAttribute('href') || '', location.href) } catch { return }
    if (u.origin !== location.origin || !/^https?:$/.test(u.protocol)) return
    e.preventDefault()
    go(u.pathname + u.search + u.hash)
  }, { signal: ac.signal })
  return () => ac.abort()
}

/** Содержимое страницы (главная, /open, /close): карусель, плавающая панель, модалки, видео, #safety, появление, FAQ */
export function initPage(root: HTMLElement) {
  const ac = new AbortController()
  const { signal } = ac
  const cleanups: Array<() => void> = []
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

  // карусель «Результаты»
  const track = q('.rail__track', root)
  if (track) {
    qa('.rail__ctl .round', root).forEach((btn) => btn.addEventListener('click', () => {
      const story = q('.story', track)
      if (story) track.scrollBy({ left: Number(btn.dataset.dir) * (story.offsetWidth + 20) * 2, behavior: 'smooth' })
    }, { signal }))
  }

  // нижняя панель на телефоне: показывается, пока не видны ни кнопки первого экрана, ни финальный блок
  const dock = q('#dock', root)
  const heroActions = q('#heroActions', root)
  const final = q('#final', root)
  const vis: Record<string, boolean> = { hero: true, final: false }
  const syncDock = () => {
    if (!dock) return
    const on = !vis.hero && !vis.final
    dock.classList.toggle('is-on', on)
    dock.setAttribute('aria-hidden', String(!on))
    qa('a', dock).forEach((a) => { a.tabIndex = on ? 0 : -1 })
  }
  if (dock && heroActions && final && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { vis[(en.target as HTMLElement).dataset.watch!] = en.isIntersecting })
      syncDock()
    })
    heroActions.dataset.watch = 'hero'
    final.dataset.watch = 'final'
    io.observe(heroActions)
    io.observe(final)
    vis.hero = false
    cleanups.push(() => io.disconnect())
  }

  // модальные окна и видео
  const videoFrame = q('#videoFrame', root)
  qa('[data-open]', root).forEach((btn) => btn.addEventListener('click', () => {
    const id = btn.dataset.open!
    const dlg = (q(`#m-${id}`, root) || q(`#${id}`, root)) as HTMLDialogElement | null
    if (!dlg) return
    if (id === 'video' && videoFrame) {
      videoFrame.innerHTML = `<iframe src="${KINESCOPE}" allow="autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write" allowfullscreen title="Коррекция и Силовой: какой курс выбрать"></iframe>`
    }
    dlg.showModal()
  }, { signal }))
  qa<HTMLDialogElement>('dialog.modal', root).forEach((dlg) => {
    const mo = new MutationObserver(() => { if (!dlg.open && dlg.id === 'm-video' && videoFrame) videoFrame.innerHTML = '' })
    mo.observe(dlg, { attributes: true, attributeFilter: ['open'] })
    cleanups.push(() => mo.disconnect())
  })

  // плавное закрытие окон (Escape, крестик-форма, клик по фону)
  const closeDialog = (dlg: HTMLDialogElement) => {
    if (!dlg.open || dlg.classList.contains('is-closing')) return
    if (reduced) { dlg.close(); return }
    dlg.classList.add('is-closing')
    setTimeout(() => { dlg.classList.remove('is-closing'); dlg.close() }, 240)
  }
  qa<HTMLDialogElement>('dialog.modal', root).forEach((dlg) => {
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); closeDialog(dlg) }, { signal })
    qa('form[method="dialog"]', dlg).forEach((f) => f.addEventListener('submit', (e) => { e.preventDefault(); closeDialog(dlg) }, { signal }))
    dlg.addEventListener('click', (e) => { if (e.target === dlg) closeDialog(dlg) }, { signal })
  })

  // окно «Противопоказания» (#safety): клик по ссылкам, прямой адрес /#safety, смена hash
  const safety = q<HTMLDialogElement>('#safety', root)
  const openSafety = () => { if (safety && !safety.open) safety.showModal() }
  if (safety) {
    qa<HTMLAnchorElement>('a[href="#safety"]', root).forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); openSafety() }, { signal }))
    if (location.hash === '#safety') openSafety()
    addEventListener('hashchange', () => { if (location.hash === '#safety') openSafety() }, { signal })
    safety.addEventListener('close', () => {
      if (location.hash === '#safety') history.replaceState(history.state, '', location.pathname + location.search)
    }, { signal })
  }

  // появление блоков при прокрутке (не в Playwright/при reduced-motion/?static)
  const noMotion = reduced || navigator.webdriver || location.search.includes('static')
  if ('IntersectionObserver' in window && !noMotion) {
    root.classList.add('js-rv')
    const targets = qa('.sec__head,.tools,.approach__ph,.roots,.statement,.club__list,.club__more,.club__media,.course,.choose,.phones__stage,.steps li,.stream,.cover,.xr,.story,.trainer,.opt,.streams,.bonus,.next,.final__card', root)
      .filter((el) => !el.closest('#approach'))
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target) } })
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
    targets.forEach((el, i) => { el.classList.add('rv'); el.style.transitionDelay = `${(i % 4) * 70}ms`; io.observe(el) })
    cleanups.push(() => io.disconnect())
  }

  decorateLinks(root)

  // «Вопросы и ответы»: плавное раскрытие, одновременно открыт один пункт группы
  const toggleQa = (d: HTMLDetailsElement & { _anim?: Animation | null; _closing?: boolean }, open: boolean) => {
    const a = q('.qa__a', d)
    if (!a || reduced || !a.animate) { d.open = open; return }
    d._anim?.cancel()
    if (open) d.open = true
    d._closing = !open
    d.classList.toggle('is-closing', !open)
    const h = a.offsetHeight
    const pb = getComputedStyle(a).paddingBottom
    a.style.overflow = 'hidden'
    const full = { height: h + 'px', paddingBottom: pb, opacity: 1 }
    const zero = { height: '0px', paddingBottom: '0px', opacity: 0 }
    d._anim = a.animate(open ? [zero, full] : [full, zero], { duration: open ? 320 : 240, easing: 'cubic-bezier(.2,.7,.2,1)' })
    d._anim.onfinish = () => { if (!open) d.open = false; d.classList.remove('is-closing'); a.style.overflow = ''; d._anim = null; d._closing = false }
  }
  qa('details.qa > summary', root).forEach((sum) => sum.addEventListener('click', (e) => {
    e.preventDefault()
    const d = sum.parentElement as HTMLDetailsElement & { _closing?: boolean }
    const open = !d.open || !!d._closing
    const name = d.getAttribute('name')
    if (open && name) qa<HTMLDetailsElement>('details.qa', root).forEach((o) => { if (o !== d && o.open && o.getAttribute('name') === name) toggleQa(o, false) })
    toggleQa(d, open)
  }, { signal }))

  return {
    openSafety,
    destroy() { ac.abort(); cleanups.forEach((f) => f()); root.classList.remove('js-rv') },
  }
}
