/**
 * Корзина (замена T706 Тильды): один товар (data-cart-oneproduct), открывается сразу при добавлении
 * (data-opencart-onorder), не хранится между визитами (data-cart-dontstore). Товар добавляется ссылкой
 * вида href="#order:Название товара=3999" (формат Тильды «добавить в корзину по ссылке»).
 */
export interface CartProduct { name: string; price: number; quantity: number }

export function useCart() {
  const product = useState<CartProduct | null>('pf-cart-product', () => null)
  const isOpen = useState<boolean>('pf-cart-open', () => false)

  function add(p: CartProduct) {
    product.value = p
    isOpen.value = true
    if (import.meta.client) document.documentElement.classList.add('pf-modal-open')
  }
  function close() {
    isOpen.value = false
    if (import.meta.client) document.documentElement.classList.remove('pf-modal-open')
  }
  function clear() { product.value = null; close() }
  /** разбор ссылки #order:<название>=<цена>; null, если это не ссылка корзины */
  function parseOrderHref(href: string): CartProduct | null {
    const i = href.indexOf('#order:')
    if (i < 0) return null
    const body = decodeURIComponent(href.slice(i + 7))
    const eq = body.lastIndexOf('=')
    if (eq < 0) return null
    const price = Number(body.slice(eq + 1).replace(/[^\d.]/g, ''))
    const name = body.slice(0, eq).trim()
    if (!name || !Number.isFinite(price) || price <= 0) return null
    return { name, price, quantity: 1 }
  }
  return { product, isOpen, add, close, clear, parseOrderHref }
}
