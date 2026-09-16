// Карточки тарифов (замена скрипта T123 PF_CARDS Тильды). В Zero Block группы имеют классы
// pf-card pf-card--<ключ>, внутри — .pf-option (варианты 1/3/6 потоков), .pf-price-new, .pf-price-old, .pf-buy.
// Данные (цены, ссылки на checkout ЛК) — app/data/tariffs.ts. Клик по варианту подсвечивает его,
// подставляет цены и ссылку «Купить» (элемент «Купить» становится <a>, как делал скрипт Тильды).
import { tariffs } from '~/data/tariffs'

export function initPfCards(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('.pf-card').forEach((card) => {
    if (card.dataset.pfInited === '1') return
    const key = [...card.classList].find((c) => c.startsWith('pf-card--'))?.slice(9) || card.getAttribute('data-pf-card')
    const config = key ? tariffs[key] : undefined
    if (!config) return
    const options = [...card.querySelectorAll<HTMLElement>('.pf-option')]
    const priceNew = card.querySelector<HTMLElement>('.pf-price-new')
    const priceOld = card.querySelector<HTMLElement>('.pf-price-old')
    let buy = card.querySelector<HTMLElement>('.pf-buy')
    if (!options.length || !priceNew || !priceOld || !buy) return
    if (buy.tagName !== 'A') {
      const a = document.createElement('a')
      a.className = buy.className
      a.innerHTML = buy.innerHTML
      buy.replaceWith(a)
      buy = a
    }
    const link = buy as HTMLAnchorElement
    const select = (index: number) => {
      const opt = config.options[index]
      if (!opt) return
      options.forEach((el, i) => el.classList.toggle('pf-active', i === index))
      priceNew.innerHTML = opt.newPrice
      priceOld.innerHTML = opt.oldPrice ? `<s>${opt.oldPrice}</s>` : ''
      link.href = opt.link
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
    }
    options.forEach((el, i) => el.addEventListener('click', (e) => { e.preventDefault(); select(i) }))
    card.dataset.pfInited = '1'
    // начальное состояние уже отрисовано на сервере (ZeroNode/ZeroElem) — ничего не трогаем до клика
  })
}
