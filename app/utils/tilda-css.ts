/**
 * Генерация CSS для Zero Block (T396) из данных app/data/tilda/*.json.
 * Воспроизводит поведение Тильды: 5 артбордов (1200/960/640/480/320), каждый — полный набор правил
 * в своём диапазоне ширин; на мобильных артбордах (320 всегда; 480 при upscale=window) геометрия
 * масштабируется на ширину экрана (единица --u = 100vw/ширина артборда), шрифты не масштабируются.
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
export interface ZeroGroup { id: string; cls: string; flex?: boolean; molFlex?: boolean; attrs?: Record<string, string>; eff: Record<string, Eff>; mol: Record<string, Record<string, string>> }
export type ZeroNode = { kind: 'elem'; id: string } | { kind: 'group'; id: string; cls: string; flex: boolean; molFlex: boolean; children: ZeroNode[] }
export interface Artboard { h: number | null; bg?: string | null; pos?: string | null; upscale?: string | null; valign?: string | null; hug?: boolean; bgImage?: string | null }
export interface TildaBlock {
  id: string; type: string; vis: { min: number | null; max: number | null }; bg?: string | null
  pad: { 'padding-top': number | null; 'padding-bottom': number | null }; uc: string[]
  artboard?: { screens: string; fixed: boolean; fixedPos?: string | null; ovrflw?: string | null; bg: Record<string, string> }
  artboards?: Record<string, Artboard>; elems?: ZeroElem[]; groups?: ZeroGroup[]; tree?: ZeroNode[]
  html?: string; css?: string; hooks?: string[]; popupRecs?: string[]; custom?: string
  /** блок внутри вкладки T395 «табы из блоков»; tabHidden — вкладка не активна при загрузке */
  tab?: { of: string; index: number }; tabHidden?: boolean
  /** блок класса «показать ещё» (uc-showmore): скрыт до клика по ссылке #showmore */
  showHidden?: boolean
}
export interface TildaPageData { file: string; blocks: TildaBlock[]; hscroll?: Array<{ scroll: string; arrows?: string | null; shift: number }>; showmore?: Array<{ href: string; cls: string; hideBtn: boolean; hideBlk: boolean }> }

const RANGES = [
  { scr: '1200', media: '(min-width: 1200px)', artW: 1200 },
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

function posCss(left: Left | null | undefined, mobile: boolean, artW: number): string {
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
      return `left:calc(50% - ${left.pct}% + ${u(x)});`
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
  // chrome-fix Тильда применяет только к элементам с пошаговой анимацией (t_animationSBS__chromeFixBackdropFilter)
  if (e.sbs && st['backdrop-filter'] && bg && atom < 1) {
    css += `background-color:${withAlpha(bg, Math.round(atom * elem * 1000) / 1000)};`
    if (elem !== 1) css += `opacity:${elem};`
    return css
  }
  if (bg) css += `background-color:${bg};`
  const v = Math.round(atom * elem * 1000) / 1000
  if (v !== 1 || st.opacity !== undefined || st['$elem-opacity'] !== undefined || sbsStep !== undefined) css += `opacity:${v};`
  return css
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

function elemRules(sel: string, e: ZeroElem, eff: Eff, mobile: boolean, artW: number): string {
  const st = eff.style ?? {}
  let css = posCss(centeredLeft(e, eff), mobile, artW)
  css += opacityCss(e, st, e.sbs?.steps?.[0]?.op)
  const top = num(eff.top, mobile); if (top !== null) css += `top:${top};`
  const w = num(eff.width, mobile); if (w !== null) css += `width:${w};`
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
  for (const [k, v0] of Object.entries(st)) {
    if (k.startsWith('$') || SKIP_STYLE.has(k)) continue
    let v = resolveVars(v0, st)
    if (k === 'background-image' && (v === 'none' || v === 'initial')) continue
    if (k === 'background-image' && shapeImg) v = `url('${shapeImg}'),${v}`
    if ((k === 'border-color' || k === 'border-width') && /initial|transparent|^0$/.test(v)) continue
    if (k === 'width' || k === 'height') continue
    css += `${k}:${v};`
  }
  // рамка из переменных Тильды
  if (st['$borderwidth'] && st['$borderwidth'] !== '0px' && st['$bordercolor']) css += `border:${st['$borderwidth']} ${st['$borderstyle'] ?? 'solid'} ${st['$bordercolor']};`
  // фон кнопок/фигур из переменных (явный background-color ставит opacityCss)
  if (st['$bgcolor-color'] && !st['background-color']) css += `background-color:${st['$bgcolor-color']};`
  if (st['$bgcolor-image'] && st['$bgcolor-image'] !== 'none' && !st['background-image']) css += `background-image:${st['$bgcolor-image']};`
  let out = `${sel}{${css}}`
  // иконка кнопки (библиотечная svg через mask) и цвет текста кнопки
  if (st['icon']) {
    const ic: Record<string, string> = {}
    for (const part of st['icon'].split(/\s+(?=[\w-]+:)/)) { const i = part.indexOf(':'); if (i > 0) ic[part.slice(0, i)] = part.slice(i + 1) }
    let icss = ''
    if (ic['--icon']) icss += `-webkit-mask-image:${ic['--icon']};mask-image:${ic['--icon']};`
    for (const k of ['width', 'height', 'order', 'margin-right', 'margin-left']) if (ic[k]) icss += `${k}:${ic[k]};`
    if (icss) out += `${sel} .tz__icon{${icss}}`
  }
  if (st['btn-color']) out += `${sel} .tz__btn-text{color:${st['btn-color']};}`
  if (st['btn-hover-color']) out += `${sel}:hover .tz__btn-text{color:${st['btn-hover-color']};}`
  // кнопка без фиксированной высоты: высота из padding контента (.tn-atom__button-content)
  if (e.type === 'button' && (st['btn-pad'] || st['btn-gap'])) {
    let b2 = ''
    if (st['btn-pad'] && (eff.height === null || eff.height === undefined)) b2 += `padding:${st['btn-pad']};`
    if (st['btn-gap']) b2 += `column-gap:${st['btn-gap']};`
    if (b2) out += `${sel}{${b2}}`
  }
  // hover
  const hv: string[] = []
  if (st['$hover-bgcolor-color']) hv.push(`background-color:${st['$hover-bgcolor-color']}`)
  if (st['$hover-bgcolor-image'] && st['$hover-bgcolor-image'] !== 'none') hv.push(`background-image:${st['$hover-bgcolor-image']}`)
  if (st['$hover-color']) hv.push(`color:${st['$hover-color']}`)
  if (st['$bordercolor-hover']) hv.push(`border-color:${st['$bordercolor-hover']}`)
  if (st['$hover-opacity']) hv.push(`opacity:${st['$hover-opacity']}`)
  if (hv.length) out += `${sel}:hover{${hv.join(';')}}`
  out += sbsRules(sel, e)
  return out
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
  const first = sbs.steps[0]!
  let out = ''
  const init: string[] = []
  // прозрачность начального шага уже учтена в elemRules (opacityCss); здесь — transform и состояние по наведению
  const st = e.eff?.['1200']?.style ?? {}
  const atom = st.opacity !== undefined ? Number(st.opacity) : 1
  const mul = (op: number) => Math.round(op * (Number.isFinite(atom) ? atom : 1) * 1000) / 1000
  const tr0 = sbsTransform(first); if (tr0) init.push(`transform:${tr0}`)
  if (init.length) out += `${sel}{${init.join(';')}}`
  if (sbs.event === 'hover' && sbs.steps.length > 1) {
    const last = sbs.steps[sbs.steps.length - 1]!
    const dur = sbs.steps.slice(1).reduce((a, s) => a + (s.ti || 0), 0) || 200
    const fin: string[] = []
    if (last.op !== undefined) fin.push(st['backdrop-filter'] ? `opacity:${last.op}` : `opacity:${mul(last.op)}`)
    fin.push(`transform:${sbsTransform(last) || 'none'}`)
    // триггер: сам элемент или другие элементы блока (trgels) — через :has() на секции
    const trigger = sbs.trg.length ? `.tz:has(${sbs.trg.map((t) => `.e${t}:hover`).join(',')}) ${sel}` : `${sel}:hover`
    out += `${sel}{transition:opacity ${dur}ms ease,transform ${dur}ms ease}${trigger}{${fin.join(';')}}`
  }
  return out
}

/** Видимость блока по ширине экрана (t-screenmin-640px / t-screenmax-1200px Тильды): границы включительно,
 *  как в её CSS (@media (max-width: 639px) / (min-width: 1201px)). */
export function visCss(id: string, vis?: { min: number | null; max: number | null } | null): string {
  let css = ''
  if (vis?.min) css += `@media (max-width:${vis.min - 0.02}px){${id}{display:none !important}}`
  if (vis?.max) css += `@media (min-width:${vis.max + 0.02}px){${id}{display:none !important}}`
  return css
}

/** CSS одного Zero Block: секция (высоты, фон) + элементы + группы, по 5 диапазонам ширин. */
export function zeroBlockCss(b: TildaBlock): string {
  const id = `#${b.id}`
  const parts: string[] = []
  parts.push(visCss(id, b.vis))
  for (const r of RANGES) {
    const art = b.artboards?.[r.scr]
    if (!art) continue
    const mobile = r.scr === '320' || (r.scr === '480' && art.upscale === 'window')
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
      parts.push(elemRules(`${id} .e${e.id}`, e, eff, mobile, r.artW))
    }
    parts.push('}')
  }
  return parts.join('')
}
