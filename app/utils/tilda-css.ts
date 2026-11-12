/**
 * Генерация CSS для Zero Block (T396) из данных app/data/tilda/*.json.
 * Воспроизводит поведение Тильды: 5 артбордов (1200/960/640/480/320), каждый — полный набор правил
 * в своём диапазоне ширин. На мобильных и планшетных артбордах с upscale=window
 * геометрия и размеры текста масштабируются пропорционально ширине окна.
 */
/** half — вычитаемое из calc(50% - half + x): половина артборда (обычный grid) или половина ширины элемента (axisx=center) */
export type Left = { a: 'grid' | 'grid-right' | 'window-left' | 'window-right' | 'center-pct' | 'raw'; x?: number; w?: number; pct?: number; xpct?: number; raw?: string; half?: number }
/** calc — top вида calc(280px - 0px + 0px) / calc(50vh - 40px + 0px) (axisy center/bottom) */
export type Px = number | { pct: number } | { calc: { base: number; unit: 'px' | 'vh'; sub: number; x: number } } | null
export interface Eff { left?: Left | null; top?: Px; width?: Px; height?: Px; style?: Record<string, string> }
export interface ZeroElem {
  id: string; type: 'text' | 'button' | 'image' | 'shape' | 'vector' | 'html' | 'video' | 'form' | 'gallery' | 'tooltip'
  cls?: string; flex?: boolean; eff: Record<string, Eff>; fields: Record<string, string>; anim?: Record<string, string>
  html?: string; text?: string; href?: string; img?: string; bgImg?: string; svg?: string; embed?: string
  /** тег атома у текстов: h1–h6/p (семантика заголовков), иначе div */
  tag?: string
  /** пошаговая анимация Тильды (sbs): steps[0] — начальное состояние (перекрывает opacity/transform стиля),
   *  event hover → последний шаг по наведению (на сам элемент или на trg-элементы) */
  sbs?: { event: string; trg: string[]; steps: Array<{ mx?: number; my?: number; sx?: number; sy?: number; op?: number; ro?: number; ti?: number; ea?: string; dt?: number }> }
  video?: { kind: 'youtube' | 'vimeo' | 'kinescope'; id: string }; form?: unknown[]; formServices?: string[]
}
export interface ZeroGroup { id: string; cls: string; flex?: boolean; molFlex?: boolean; attrs?: Record<string, string>; eff: Record<string, Eff>; mol: Record<string, Record<string, string>>; anim?: Record<string, string> }
export type ZeroNode = { kind: 'elem'; id: string } | { kind: 'group'; id: string; cls: string; flex: boolean; molFlex: boolean; children: ZeroNode[]; anim?: Record<string, string> }
export interface Artboard { h: number | null; bg?: string | null; pos?: string | null; upscale?: string | null; valign?: string | null; hug?: boolean; bgImage?: string | null }
export interface TildaBlock {
  id: string; type: string; vis: { min: number | null; max: number | null }; bg?: string | null
  /** отступы записи для экранов ≤ N px (классы t-rec_pt-res-N_M): { '480': { 'padding-top': 15 } } */
  padRes?: Record<string, Record<string, number>>
  pad: { 'padding-top': number | null; 'padding-bottom': number | null }; uc: string[]
  artboard?: { screens: string; fixed: boolean; fixedPos?: string | null; ovrflw?: string | null; bg: Record<string, string> }
  artboards?: Record<string, Artboard>; elems?: ZeroElem[]; groups?: ZeroGroup[]; tree?: ZeroNode[]
  html?: string; css?: string; hooks?: string[]; popupRecs?: string[]; custom?: string
  /** виджет тарифов inline v2: конфиг страницы (window.__PF_INLINE_CONFIG__) */
  pfInline?: Record<string, any> & { meta?: { courseId?: string } }
  /** блок внутри вкладки T395 «табы из блоков»; tabHidden — вкладка не активна при загрузке */
  tab?: { of: string; index: number }; tabHidden?: boolean
  /** блок класса «показать ещё» (uc-showmore): скрыт до клика по ссылке #showmore */
  showHidden?: boolean
  /** галерея «в ряд» T979: целевая высота ряда и отступ (из t979_init) */
  t979?: { rowH: number; gutter: number }
}
export interface TildaPageData { file: string; blocks: TildaBlock[]; /** карточки тарифов страницы (window.PF_CARDS из T123) */ pfCards?: Record<string, { defaultOption: number; options: Array<{ newPrice: string; oldPrice: string; link: string }> }>; hscroll?: Array<{ scroll: string; arrows?: string | null; shift: number }>; showmore?: Array<{ href: string; cls: string; hideBtn: boolean; hideBlk: boolean }> }

import { appearVars } from '~/utils/appear'

/** переходы анимации появления (opacity/translate/scale по --ap-*); у элементов без неё переменных нет → короткий hover-переход */
const AP_TRANSITION = 'opacity var(--ap-dur,.2s) var(--ap-ease,ease-in-out) var(--ap-delay,0s),translate var(--ap-dur,.2s) var(--ap-ease,ease) var(--ap-delay,0s),scale var(--ap-dur,.2s) var(--ap-ease,ease) var(--ap-delay,0s)'

const RANGES = [
  { scr: '1600', media: '(min-width: 1600px)', artW: 1600 }, // только у блоков с экраном 1600 (artboards['1600']); сетка там = окно
  { scr: '1200', media: '(min-width: 1200px)', artW: 1200 }, // при наличии экрана 1600 — до 1599.98px (см. zeroBlockCss)
  { scr: '960', media: '(min-width: 960px) and (max-width: 1199.98px)', artW: 960 },
  { scr: '640', media: '(min-width: 640px) and (max-width: 959.98px)', artW: 640 },
  { scr: '480', media: '(min-width: 480px) and (max-width: 639.98px)', artW: 480 },
  { scr: '320', media: '(max-width: 479.98px)', artW: 320 },
] as const

// font-family берём из стиля: на сайте кроме Involve есть Manrope, Unbounded, Arial; var(--t-text-font,Arial) на живом
// сайте не определена → Arial (resolveVars подставляет фолбэк); RockStar без @font-face → фолбэк Arial, как на живом
const SKIP_STYLE = new Set(['z-index', 'hover', 'display', 'icon', 'btn-color', 'btn-pad', 'btn-gap', 'opacity', 'background-color']) // opacity/фон — см. opacityCss

function num(v: Px | undefined, mobile: boolean): string | null {
  if (v === null || v === undefined) return null
  if (typeof v === 'object' && 'calc' in v) {
    const c = v.calc, u = (n: number) => (mobile ? `${n} * var(--u)` : `${n}px`)
    return `calc(${c.unit === 'vh' ? c.base + 'vh' : u(c.base)} - ${u(c.sub)} + ${u(c.x)})`
  }
  if (typeof v === 'object') return `${v.pct}%`
  return mobile ? `calc(${v} * var(--u))` : `${v}px`
}

function resolveVars(v: string, st: Record<string, string>): string {
  // background-color:var(--t396-bgcolor-color,transparent) → значение из $bgcolor-color
  return v.replace(/var\(--t396-([\w-]+)(?:,([^)]*))?\)/g, (_m, name, fallback) => {
    const val = st['$' + name]
    return val !== undefined ? val : (fallback ?? 'initial').trim()
  })
}

function posCss(left: Left | null | undefined, mobile: boolean, artW: number, windowContainer = false): string {
  if (!left) return ''
  const x = left.x ?? 0
  const u = (n: number) => (mobile ? `calc(${n} * var(--u))` : `${n}px`)
  switch (left.a) {
    case 'grid': {
      const xp = left.xpct !== undefined ? ` + ${left.xpct}%` : ''
      // элемент с axisx=center: calc(50% - w/2 + x) — центр артборда, а не его левый край
      if (left.half !== undefined && Math.abs(left.half - artW / 2) > 0.5) return `left:calc(50% - ${u(left.half)} + ${u(x)}${xp});`
      return mobile ? `left:calc(${x} * var(--u)${xp});` : `left:calc(50% - ${artW / 2}px + ${x}px${xp});`
    }
    case 'grid-right':
      return mobile ? `right:calc(${-x} * var(--u));` : `right:calc(50% - ${artW / 2}px - ${x}px);`
    case 'window-left': {
      const xp = left.xpct !== undefined ? ` + ${left.xpct}%` : ''
      return `left:calc(${u(x)}${xp});`
    }
    case 'window-right':
      return `right:${u(-x)};`
    case 'center-pct':
      // pct — половина ширины элемента в % сетки; на экранах шире сетки считаем от ширины сетки (artW), как рантайм Тильды
      return mobile || windowContainer ? `left:calc(50% - ${left.pct}% + ${u(x)});` : `left:calc(50% - ${Math.round(artW * (left.pct ?? 0)) / 100}px + ${x}px);`
    default:
      return left.raw ? `left:${left.raw};` : ''
  }
}

/** rgba(цвет, альфа) из #rgb/#rrggbb/rgb()/rgba() */
function withAlpha(color: string, a: number): string {
  const c = color.trim()
  const hex = /^#([0-9a-f]{3,8})$/i.exec(c)
  if (hex) { let h = hex[1]!; if (h.length === 3 || h.length === 4) h = [...h].map((x) => x + x).join(''); const n = parseInt(h.slice(0, 6), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})` }
  const m = /^rgba?\(([^)]+)\)$/.exec(c)
  if (m) { const p = m[1]!.split(',').map((x) => x.trim()); return `rgba(${p[0]},${p[1]},${p[2]},${a})` }
  return color
}
/** прозрачность и фон: слой элемента (anim-hidden / шаг sbs) × слой атома (стиль) — у Тильды это разные элементы;
 *  элемент с backdrop-filter и полупрозрачным фоном Тильда переводит в rgba-фон с opacity 1 (t_animationSBS__chromeFixBackdropFilter) */
function opacityCss(e: ZeroElem, st: Record<string, string>, sbsStep?: number): string {
  const atom = st.opacity !== undefined ? Number(st.opacity) : 1
  let elem = st['$elem-opacity'] !== undefined ? Number(st['$elem-opacity']) : 1
  if (sbsStep !== undefined) elem = sbsStep // пошаговая анимация задаёт прозрачность элемента сама
  else if ((e.cls || '').includes('t396__elem--anim-hidden')) elem = 1 // «скрыт до анимации появления» — конечное состояние
  const resolvedBg = st['background-color'] ? resolveVars(st['background-color'], st) : ''
  const bg = resolvedBg && !/^(initial|transparent|none)$/.test(resolvedBg.trim()) ? resolvedBg : ''
  let css = ''
  // элемент с backdrop-filter: у Тильды blur стоит на элементе (opacity 1), а полупрозрачность и фон — на вложенном атоме;
  // в одном узле opacity глушит и сам blur («матовое стекло» становится просто прозрачным) → прозрачность атома
  // переводим в альфу фона (и тени — см. elemRules), как делает t_animationSBS__chromeFixBackdropFilter
  if (backdropSplit(st)) {
    if (bg) css += `background-color:${withAlpha(bg, atom)};`
    if (elem !== 1) css += `opacity:${elem};`
    return css
  }
  if (bg) css += `background-color:${bg};`
  const v = Math.round(atom * elem * 1000) / 1000
  if (v !== 1 || st.opacity !== undefined || st['$elem-opacity'] !== undefined || sbsStep !== undefined) css += `opacity:${v};`
  return css
}
/** элемент с backdrop-filter и полупрозрачным атомом — прозрачность уходит в альфу фона/тени, а не в opacity */
function backdropSplit(st: Record<string, string>): boolean {
  return !!st['backdrop-filter'] && st.opacity !== undefined && Number(st.opacity) < 1
}
/** тень с альфой, умноженной на прозрачность атома (для backdropSplit) */
function scaleShadowAlpha(shadow: string, a: number): string {
  return shadow
    .replace(/rgba\(([^)]+)\)/g, (_, p: string) => { const q = p.split(',').map((x) => x.trim()); return `rgba(${q[0]},${q[1]},${q[2]},${Math.round(Number(q[3] ?? 1) * a * 1000) / 1000})` })
    .replace(/rgb\(([^)]+)\)/g, (_, p: string) => `rgba(${p},${a})`)
    .replace(/#[0-9a-f]{3,8}\b/gi, (h) => withAlpha(h, a))
}
/** центрированный по оси X элемент: половина ширины в CSS экспорта бывает устаревшей — берём из реальной ширины */
function centeredLeft(e: ZeroElem, eff: Eff): Left | null | undefined {
  const l = eff.left
  if (!l || l.a !== 'grid' || l.half === undefined || e.fields?.axisx !== 'center') return l
  const w = eff.width
  if (typeof w === 'number') return { ...l, half: w / 2 }
  if (w && typeof w === 'object' && 'pct' in w) return { a: 'center-pct', pct: w.pct / 2, x: l.x ?? 0 }
  return l
}

/** Контейнер элемента (grid/window) для экрана: значение res-экрана, иначе ближайшего большего, иначе базовое —
 *  каскад Тильды (data-field-container-res-NNN-value наследуются вниз). У блоков с экраном 1600 базовое значение —
 *  для 1600, а у 1200 своё (напр. фото первого экрана курсов: 1600 — grid 1259px, 1200 — window 98%). */
function containerAt(e: ZeroElem, scr: string): string {
  const order = ['320', '480', '640', '960', '1200', '1600']
  for (let i = Math.max(0, order.indexOf(scr)); i < order.length; i++) { const v = e.fields?.[`container-res-${order[i]}`]; if (v) return v }
  return e.fields?.container || 'grid'
}

function elemRules(sel: string, e: ZeroElem, eff: Eff, mobile: boolean, artW: number, scr: string): string {
  const st = eff.style ?? {}
  // на экране 1600+ у Тильды нет фиксированной сетки: проценты и центрирование считаются от окна
  const windowContainer = containerAt(e, scr) === 'window' || artW >= 1600
  let css = posCss(centeredLeft(e, eff), mobile, artW, windowContainer)
  css += opacityCss(e, st, e.sbs ? sbsRestStep(e.sbs)?.op : undefined)
  const top = num(eff.top, mobile); if (top !== null) css += `top:${top};`
  // ширина в %: для контейнера grid у Тильды это доля сетки артборда (1200/960/…), а не окна — на широких экранах окно
  // шире сетки, поэтому переводим в px; для контейнера window и flex-детей — как есть
  const wv = eff.width
  const gridPct = !mobile && !e.flex && wv && typeof wv === 'object' && 'pct' in wv && !windowContainer
  const w = gridPct ? `${Math.round(artW * (wv as { pct: number }).pct) / 100}px` : num(eff.width, mobile); if (w !== null) css += `width:${w};`
  // html-вставка (iframe с padding-top в %) у Тильды растёт по содержимому (элемент display:table) → min-height
  const h = num(eff.height, mobile); if (h !== null) css += e.type === 'html' ? `min-height:${h};` : `height:${h};`
  // axisy=center у элемента с авто-высотой: экспорт пишет calc(<пол-артборда> - 0px + x), рантайм вычитает
  // половину реальной высоты → translateY(-50%) (если нет своего transform)
  const t = eff.top
  if (t && typeof t === 'object' && 'calc' in t && t.calc.sub === 0 && h === null && !st['transform'] && !e.sbs) css += 'transform:translateY(-50%);'
  if (st['z-index']) css += `z-index:${st['z-index']};`
  // фигура с картинкой (data-original / inline url): картинка + градиент из стиля, как у Тильды
  const shapeImg = e.type === 'shape' ? e.bgImg || e.img : undefined
  if (shapeImg && !(st['background-image'] && !/none|initial/.test(st['background-image']))) css += `background-image:url('${shapeImg}');`
  // мобильные артборды Тильда масштабирует целиком (transform scale на ширину окна) — вместе со шрифтами, скруглениями,
  // отступами; у нас геометрия в единицах --u, поэтому px этих свойств тоже переводим в --u (иначе на 390–479 px текст мельче, чем на Тильде)
  const SCALED = new Set(['font-size', 'line-height', 'letter-spacing', 'border-radius', 'padding', 'box-shadow', 'border-width'])
  const scalePx = (v: string) => v.replace(/(-?\d*\.?\d+)px/g, (_, n) => (n === '0' ? '0' : `calc(${n} * var(--u))`))
  for (const [k, v0] of Object.entries(st)) {
    if (k.startsWith('$') || SKIP_STYLE.has(k)) continue
    let v = resolveVars(v0, st)
    if (mobile && SCALED.has(k)) v = scalePx(v)
    if (k === 'background-image' && (v === 'none' || v === 'initial')) continue
    if (k === 'background-image' && shapeImg) v = `url('${shapeImg}'),${v}`
    // рамка: var(--t396-bordercolor, transparent) без переменной = прозрачная рамка (у Тильды не видна); прозрачность надо
    // писать явно, иначе preflight Tailwind (border-style:solid) даёт чёрную рамку шириной --t396-borderwidth
    if (k === 'border-width' && /initial|^0(px)?$/.test(v)) continue
    if (k === 'border-color' && /initial/.test(v)) continue
    if (k === 'width' || k === 'height') continue
    if (k === 'box-shadow' && backdropSplit(st)) v = scaleShadowAlpha(v, Number(st.opacity))
    css += `${k}:${v};`
  }
  // рамка из переменных Тильды
  if (st['$borderwidth'] && st['$borderwidth'] !== '0px' && st['$bordercolor']) css += `border:${mobile ? scalePx(st['$borderwidth']) : st['$borderwidth']} ${st['$borderstyle'] ?? 'solid'} ${st['$bordercolor']};`
  // фон кнопок/фигур из переменных (явный background-color ставит opacityCss)
  if (st['$bgcolor-color'] && !st['background-color']) css += `background-color:${st['$bgcolor-color']};`
  if (st['$bgcolor-image'] && st['$bgcolor-image'] !== 'none' && !st['background-image']) css += `background-image:${st['$bgcolor-image']};`
  css += appearVars(e.anim) // переменные анимации появления (в каждом диапазоне: медиа-правила не наследуют друг друга)
  let out = `${sel}{${css}}`
  // иконка кнопки (библиотечная svg через mask) и цвет текста кнопки
  if (st['icon']) {
    const ic: Record<string, string> = {}
    // на меньших экранах Тильда пишет только размеры иконки (width/height) — сама картинка (--icon) наследуется от базового экрана
    const parseIcon = (v: string) => { for (const part of v.split(/\s+(?=[\w-]+:)/)) { const i = part.indexOf(':'); if (i > 0) ic[part.slice(0, i)] = part.slice(i + 1) } }
    const baseIcon = Object.values(e.eff ?? {}).map((x) => x.style?.icon).find((v) => v && /--icon:/.test(v))
    if (baseIcon && !/--icon:/.test(st['icon'])) parseIcon(baseIcon)
    parseIcon(st['icon'])
    let icss = ''
    // библиотечные иконки (lib__icons) — маска цветом текста; загруженные svg (tild…) — картинка с собственными цветами
    if (ic['--icon'] && /lib__icons/.test(ic['--icon'])) icss += `-webkit-mask-image:${ic['--icon']};mask-image:${ic['--icon']};`
    else if (ic['--icon']) icss += `background-image:${ic['--icon']};background-size:contain;background-repeat:no-repeat;background-position:center;-webkit-mask-image:none;mask-image:none;background-color:transparent;`
    for (const k of ['width', 'height', 'order', 'margin-right', 'margin-left']) if (ic[k]) icss += `${k}:${mobile ? scalePx(ic[k]) : ic[k]};`
    if (icss) out += `${sel} .tz__icon{${icss}}`
  }
  const sp = st['--t396-speedhover'] || '0.2s' // скорость hover-перехода Тильды (var(--t396-speedhover))
  if (st['btn-color']) out += `${sel} .tz__btn-text{color:${st['btn-color']};}`
  if (st['btn-hover-color']) out += `${sel} .tz__btn-text{transition:color ${sp} ease-in-out;}${sel}:hover .tz__btn-text{color:${st['btn-hover-color']};}`
  // кнопка без фиксированной высоты: высота из padding контента (.tn-atom__button-content)
  if (e.type === 'button' && (st['btn-pad'] || st['btn-gap'])) {
    let b2 = ''
    if (st['btn-pad'] && (eff.height === null || eff.height === undefined)) b2 += `padding:${mobile ? scalePx(st['btn-pad']) : st['btn-pad']};`
    if (st['btn-gap']) b2 += `column-gap:${mobile ? scalePx(st['btn-gap']) : st['btn-gap']};`
    if (b2) out += `${sel}{${b2}}`
  }
  // hover
  const hv: string[] = []
  if (st['$hover-bgcolor-color']) hv.push(`background-color:${st['$hover-bgcolor-color']}`)
  if (st['$hover-bgcolor-image'] && st['$hover-bgcolor-image'] !== 'none') hv.push(`background-image:${st['$hover-bgcolor-image']}`)
  if (st['$hover-color']) hv.push(`color:${st['$hover-color']}`)
  if (st['$bordercolor-hover']) hv.push(`border-color:${st['$bordercolor-hover']}`)
  if (st['$hover-opacity']) hv.push(`opacity:${st['$hover-opacity']}`)
  // плавный hover, как у атома Тильды: transition: background-color/color/border-color var(--t396-speedhover), box-shadow .2s
  if (hv.length) out += `${sel}{transition:background-color ${sp} ease-in-out,color ${sp} ease-in-out,border-color ${sp} ease-in-out,box-shadow .2s ease-in-out,${AP_TRANSITION}}${sel}:hover{${hv.join(';')}}`
  out += sbsRules(sel, e)
  return out
}

/** состояние покоя пошаговой анимации: Тильда сразу применяет шаг 0 и все следующие за ним шаги с нулевой длительностью
 *  (так «скрытые до наведения» подложки кнопок имеют шаги [1, 0 (0 мс), 1 (400 мс)] и в покое невидимы);
 *  blockintoview проигрывается один раз при появлении блока — в статике показываем конечный шаг; scroll — как шаг 0 */
export function sbsRestStep(sbs: NonNullable<ZeroElem['sbs']>): NonNullable<ZeroElem['sbs']>['steps'][number] | undefined {
  const s = sbs.steps
  if (!s?.length) return undefined
  if (sbs.event === 'blockintoview') return s[s.length - 1]
  if (sbs.event === 'scroll') return s[0]
  let i = 0
  while (i + 1 < s.length && !s[i + 1]!.ti) i++
  return s[i]
}
/** transform шага пошаговой анимации */
function sbsTransform(s: { mx?: number; my?: number; sx?: number; sy?: number; ro?: number }): string {
  const t: string[] = []
  if (s.mx || s.my) t.push(`translate(${s.mx || 0}px,${s.my || 0}px)`)
  if ((s.sx !== undefined && s.sx !== 1) || (s.sy !== undefined && s.sy !== 1)) t.push(`scale(${s.sx ?? 1},${s.sy ?? 1})`)
  if (s.ro) t.push(`rotate(${s.ro}deg)`)
  return t.join(' ')
}
/** пошаговая анимация: начальное состояние всегда (иначе элемент останется с opacity:0 из редактора),
 *  по наведению — конечный шаг с переходом (scroll/blockintoview-анимации в статике не воспроизводим) */
function sbsRules(sel: string, e: ZeroElem): string {
  const sbs = e.sbs
  if (!sbs?.steps?.length) return ''
  const first = sbsRestStep(sbs)!
  let out = ''
  const init: string[] = []
  // прозрачность состояния покоя уже учтена в elemRules (opacityCss); здесь — transform и состояние по наведению
  const st = e.eff?.['1200']?.style ?? {}
  const atom = st.opacity !== undefined ? Number(st.opacity) : 1
  const mul = (op: number) => Math.round(op * (Number.isFinite(atom) ? atom : 1) * 1000) / 1000
  const tr0 = sbsTransform(first); if (tr0) init.push(`transform:${tr0}`)
  if (init.length) out += `${sel}{${init.join(';')}}`
  if (sbs.event === 'hover' && sbs.steps.length > 1) {
    const last = sbs.steps[sbs.steps.length - 1]!
    const dur = sbs.steps.slice(sbs.steps.indexOf(first) + 1).reduce((a, s) => a + (s.ti || 0), 0) || 200
    const fin: string[] = []
    if (last.op !== undefined) fin.push(st['backdrop-filter'] ? `opacity:${last.op}` : `opacity:${mul(last.op)}`)
    fin.push(`transform:${sbsTransform(last) || 'none'}`)
    // триггер: сам элемент или другие элементы блока (trgels) — через :has() на секции
    // триггер — другой элемент блока (trgels): секция блока (#recNNN) содержит наведённый триггер → :has() на самой секции
    // (sel = «#recNNN .eID»; вариант «.tz:has(…) #recNNN .eID» не срабатывал — .tz и #recNNN один и тот же узел)
    const has = `:has(${sbs.trg.map((t) => `.e${t}:hover`).join(',')})`
    const trigger = sbs.trg.length ? sel.replace(/^(#\S+)(\s)/, `$1${has}$2`) : `${sel}:hover`
    out += `${sel}{transition:opacity ${dur}ms ease,transform ${dur}ms ease,background-color .2s ease-in-out,color .2s ease-in-out,translate var(--ap-dur,.2s) var(--ap-ease,ease) var(--ap-delay,0s),scale var(--ap-dur,.2s) var(--ap-ease,ease) var(--ap-delay,0s)}${trigger}{${fin.join(';')}}`
  }
  return out
}

/** Отступы записи для отдельных экранов (t-rec_pt-res-480_15 и т.п.): у Тильды — @media (max-width:N px) … !important */
export function padResCss(id: string, padRes?: Record<string, Record<string, number>> | null): string {
  if (!padRes) return ''
  return Object.entries(padRes).map(([res, p]) => `@media (max-width:${res}px){${id}{${Object.entries(p).map(([k, v]) => `${k}:${v}px !important`).join(';')}}}`).join('')
}

/** Видимость блока по ширине экрана (t-screenmin-640px / t-screenmax-1200px Тильды): min — виден от min+1 px,
 *  max — виден до max px включительно (как в её CSS). */
export function visCss(id: string, vis?: { min: number | null; max: number | null } | null): string {
  let css = ''
  // как в CSS Тильды: .t-screenmin-480px скрыт при (max-width:480px), .t-screenmax-480px — при (min-width:481px)
  if (vis?.min) css += `@media (max-width:${vis.min}px){${id}{display:none !important}}`
  if (vis?.max) css += `@media (min-width:${vis.max + 1}px){${id}{display:none !important}}`
  return css
}

/** CSS одного Zero Block: секция (высоты, фон) + элементы + группы, по 5 диапазонам ширин. */
export function zeroBlockCss(b: TildaBlock, opts: { popup?: boolean } = {}): string {
  const id = `#${b.id}`
  const parts: string[] = []
  parts.push(visCss(id, b.vis), padResCss(id, b.padRes))
  for (const r0 of RANGES) {
    const art = b.artboards?.[r0.scr]
    if (!art) continue
    const r = r0.scr === '1200' && b.artboards?.['1600'] ? { ...r0, media: '(min-width: 1200px) and (max-width: 1599.98px)' } : r0
    // Режим уже разрешён по каскаду экспортёром. Grid сохраняет размеры сетки даже на экране 320.
    // в zero-попапе Тильда масштабирует по окну и экран 1200 (window/1200, tilda-zero t396__isInPopup); на страницах вне попапа
    // это не включено сознательно (HANDOFF: известное отличие /m, /ogin1)
    const mobile = (r.artW < 1200 || (opts.popup && !b.artboards?.['1600'])) && art.upscale === 'window'
    const u = mobile ? `${id}{--u:calc(100vw / ${r.artW});}` : ''
    let sec = `${id} .tz__art{`
    // артборд position:absolute (Тильда): запись схлопывается в 0, содержимое наезжает на следующий блок
    if (art.pos === 'absolute') sec += 'position:absolute;left:0;right:0;top:0;'
    // «прилипающий подвал» (uc-sticky-footer из T123): артборд fixed внизу, секция держит его высоту и открывает при прокрутке
    const sticky = (b.uc || []).includes('uc-sticky-footer')
    let stickyCss = ''
    if (sticky) { sec += 'position:fixed;bottom:0;left:0;width:100%;'; if (art.h) stickyCss = `${id}{clip-path:polygon(0 0,100% 0,100% 100%,0 100%);height:${mobile ? `calc(${art.h} * var(--u))` : art.h + 'px'};}` }
    if (art.h !== null && art.h !== undefined) sec += `height:${mobile ? `calc(${art.h} * var(--u))` : art.h + 'px'};`
    if (art.bg) sec += `background-color:${art.bg};`
    if (art.bgImage && art.bgImage !== 'none') sec += `background-image:${art.bgImage};background-size:cover;background-position:center;`
    sec += '}'
    parts.push(`@media ${r.media}{${u}${sec}${stickyCss}`)
    for (const g of b.groups ?? []) {
      const eff = g.eff?.[r.scr] ?? {}
      const mol = g.mol?.[r.scr] ?? {}
      // контейнер группы: абсолютный (или flex-элемент родительской молекулы)
      let css = g.flex ? '' : posCss(eff.left, mobile, r.artW)
      const top = num(eff.top, mobile); if (top !== null && !g.flex) css += `top:${top};`
      const w = num(eff.width, mobile); if (w !== null) css += `width:${w};`
      const h = num(eff.height, mobile); if (h !== null) css += `height:${h};`
      if (eff.style?.['z-index']) css += `z-index:${eff.style['z-index']};`
      css += appearVars(g.anim)
      for (const k of ['flex-shrink', 'flex-grow', 'align-self', 'order', 'margin', 'min-width', 'max-width']) if (eff.style?.[k]) css += `${k}:${eff.style[k]};`
      parts.push(`${id} .g${g.id}{${css}}`)
      // молекула: flex-раскладка и оформление
      let m = ''
      for (const k of ['display', 'flex-direction', 'flex-wrap', 'row-gap', 'column-gap', 'gap', 'align-items', 'justify-content', 'align-content', 'padding', 'background-color', 'background-image', 'border-radius', 'box-shadow', 'opacity', 'border-width', 'border-color', 'border-style']) {
        if (mol[k] === undefined) continue
        if (k === 'padding' && mobile) { m += `padding:${mol[k].split(' ').map((v) => (/^\d/.test(v) ? `calc(${parseFloat(v)} * var(--u))` : v)).join(' ')};`; continue }
        if ((k === 'row-gap' || k === 'column-gap') && mobile && /^\d/.test(mol[k])) { m += `${k}:calc(${parseFloat(mol[k])} * var(--u));`; continue }
        m += `${k}:${mol[k]};`
      }
      if (m) parts.push(`${id} .g${g.id} > .tz__mol{${m}}`)
    }
    for (const e of b.elems ?? []) {
      const eff = e.eff?.[r.scr]; if (!eff) continue
      parts.push(elemRules(`${id} .e${e.id}`, e, eff, mobile, r.artW, r.scr))
    }
    parts.push('}')
  }
  return parts.join('')
}
