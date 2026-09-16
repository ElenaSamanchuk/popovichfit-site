/** Состояние мобильного меню (T450 на Тильде): открыто/закрыто, блокировка скролла body. */
export function useSiteMenu() {
  const open = useState('site-menu-open', () => false)

  function setOpen(value: boolean) {
    open.value = value
    if (import.meta.client) {
      document.documentElement.classList.toggle('pf-menu-open', value)
    }
  }

  return {
    open,
    openMenu: () => setOpen(true),
    closeMenu: () => setOpen(false),
    toggleMenu: () => setOpen(!open.value),
  }
}
