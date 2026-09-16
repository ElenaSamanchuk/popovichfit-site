/**
 * Попапы по hash-ссылкам, как на Тильде: href="#popup:name", "#zeropopup", "#zeropopup1", "#app", "#dop",
 * "#tarif1", "#about1"… открывают попап с таким именем, "#closepopup" закрывает. Один активный попап.
 * Компонент <Modal name="…"> регистрирует своё имя; клик по ссылке с этим hash перехватывается глобально.
 */
const HASH_CLOSE = '#closepopup'

export function useModal() {
  const active = useState<string | null>('pf-modal-active', () => null)
  const names = useState<string[]>('pf-modal-names', () => [])

  function open(name: string) {
    active.value = name
    if (import.meta.client) document.documentElement.classList.add('pf-modal-open')
  }
  function close() {
    active.value = null
    if (import.meta.client) document.documentElement.classList.remove('pf-modal-open')
  }
  function register(name: string) {
    if (!names.value.includes(name)) names.value.push(name)
  }
  function unregister(name: string) {
    names.value = names.value.filter((n) => n !== name)
    if (active.value === name) close()
  }
  /** hash → имя попапа, если такой зарегистрирован */
  function nameFromHash(hash: string): string | null {
    if (!hash || hash === '#') return null
    const h = decodeURIComponent(hash)
    if (h === HASH_CLOSE) return HASH_CLOSE
    const candidate = h.startsWith('#popup:') ? h.slice(1) : h.slice(1)
    return names.value.includes(candidate) ? candidate : null
  }
  return { active, open, close, register, unregister, nameFromHash, HASH_CLOSE }
}
