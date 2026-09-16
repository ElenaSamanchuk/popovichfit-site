/**
 * Генерация CSS для Zero Block (T396) из данных app/data/tilda/*.json.
 * Воспроизводит поведение Тильды: 5 артбордов (1200/960/640/480/320), каждый — полный набор правил
 * в своём диапазоне ширин; на мобильных артбордах (320 всегда; 480 при upscale=window) геометрия
 * масштабируется на ширину экрана (единица --u = 100vw/ширина артборда), шрифты не масштабируются.
 */
export type Left = { a: 'grid' | 'grid-right' | 'window-left' | 'window-right' | 'center-pct' | 'raw'; x?: number; w?: number; pct?: number; xpct?: number; raw?: string }
export type Px = number | { pct: number } | null
export interface Eff { left?: Left | null; top?: Px; width?: Px; height?: Px; style?: Record<string, string> }
export interface ZeroElem {
  id: string; type: 'text' | 'button' | 'image' | 'shape' | 'vector' | 'html' | 'video' | 'form' | 'gallery' | 'tooltip'
  cls?: string; eff: Record<string, Eff>; fields: Record<string, string>; anim?: Record<string, string>
  html?: string; text?: string; href?: string; img?: string; bgImg?: string; svg?: string; embed?: string
  video?: { kind: 'youtube' | 'vimeo' | 'kinescope'; id: string }; form?: unknown[]; formServices?: string[]
}
export interface ZeroGroup { id: string; cls: string; members: string[]; eff: Record<string, Eff>; mol: Record<string, Record<string, string>> }
export interface Artboard { h: number | null; bg?: string | null; pos?: string | null; upscale?: string | null; valign?: string | null; hug?: boolean; bgImage?: string | null }
export interface TildaBlock {
  id: string; type: string; vis: { min: number | null; max: number | null }; bg?: string | null
  pad: { 'padding-top': number | null; 'padding-bottom': number | null }; uc: string[]
  artboard?: { screens: string; fixed: boolean; fixedPos?: string | null; ovrflw?: string | null; bg: Record<string, string> }
  artboards?: Record<string, Artboard>; elems?: ZeroElem[]; groups?: ZeroGroup[]
  html?: string; css?: string; hooks?: string[]; popupRecs?: string[]; custom?: string
}
export interface TildaPageData { file: string; blocks: TildaBlock[] }

const RANGES = [
  { scr: '1200', media: '(min-width: 1200px)', artW: 1200 },
  { scr: '960', media: '(min-width: 960px) and (max-width: 1199.98px)', artW: 960 },
  { scr: '640', media: '(min-width: 640px) and (max-width: 959.98px)', artW: 640 },
  { scr: '480', media: '(min-width: 480px) and (max-width: 639.98px)', artW: 480 },
  { scr: '320', media: '(max-width: 479.98px)', artW: 320 },
] as const

const SKIP_STYLE = new Set(['z-index', 'hover', 'font-family', 'display'])

function num(v: Px | undefined, mobile: boolean): string | null {
  if (v === null || v === undefined) return null
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

function elemRules(sel: string, e: ZeroElem, eff: Eff, mobile: boolean, artW: number): string {
  const st = eff.style ?? {}
  let css = posCss(eff.left, mobile, artW)
  const top = num(eff.top, mobile); if (top !== null) css += `top:${top};`
  const w = num(eff.width, mobile); if (w !== null) css += `width:${w};`
  const h = num(eff.height, mobile); if (h !== null) css += `height:${h};`
  if (st['z-index']) css += `z-index:${st['z-index']};`
  for (const [k, v0] of Object.entries(st)) {
    if (k.startsWith('$') || SKIP_STYLE.has(k)) continue
    let v = resolveVars(v0, st)
    if (k === 'background-image' && (v === 'none' || v === 'initial')) continue
    if ((k === 'border-color' || k === 'border-width') && /initial|transparent|^0$/.test(v)) continue
    if (k === 'width' || k === 'height') continue
    css += `${k}:${v};`
  }
  // рамка из переменных Тильды
  if (st['$borderwidth'] && st['$borderwidth'] !== '0px' && st['$bordercolor']) css += `border:${st['$borderwidth']} ${st['$borderstyle'] ?? 'solid'} ${st['$bordercolor']};`
  // фон кнопок/фигур из переменных
  if (st['$bgcolor-color'] && !st['background-color']) css += `background-color:${st['$bgcolor-color']};`
  if (st['$bgcolor-image'] && st['$bgcolor-image'] !== 'none' && !st['background-image']) css += `background-image:${st['$bgcolor-image']};`
  let out = `${sel}{${css}}`
  // hover
  const hv: string[] = []
  if (st['$hover-bgcolor-color']) hv.push(`background-color:${st['$hover-bgcolor-color']}`)
  if (st['$hover-bgcolor-image'] && st['$hover-bgcolor-image'] !== 'none') hv.push(`background-image:${st['$hover-bgcolor-image']}`)
  if (st['$hover-color']) hv.push(`color:${st['$hover-color']}`)
  if (st['$bordercolor-hover']) hv.push(`border-color:${st['$bordercolor-hover']}`)
  if (st['$hover-opacity']) hv.push(`opacity:${st['$hover-opacity']}`)
  if (hv.length) out += `${sel}:hover{${hv.join(';')}}`
  return out
}

/** CSS одного Zero Block: секция (высоты, фон) + элементы + группы, по 5 диапазонам ширин. */
export function zeroBlockCss(b: TildaBlock): string {
  const id = `#${b.id}`
  const parts: string[] = []
  const vis = b.vis || { min: null, max: null }
  if (vis.min) parts.push(`@media (max-width:${vis.min - 0.02}px){${id}{display:none !important}}`)
  if (vis.max) parts.push(`@media (min-width:${vis.max}px){${id}{display:none !important}}`)
  for (const r of RANGES) {
    const art = b.artboards?.[r.scr]
    if (!art) continue
    const mobile = r.scr === '320' || (r.scr === '480' && art.upscale === 'window')
    const u = mobile ? `${id}{--u:calc(100vw / ${r.artW});}` : ''
    let sec = `${id} .tz__art{`
    if (art.h !== null && art.h !== undefined) sec += `height:${mobile ? `calc(${art.h} * var(--u))` : art.h + 'px'};`
    if (art.bg) sec += `background-color:${art.bg};`
    if (art.bgImage && art.bgImage !== 'none') sec += `background-image:${art.bgImage};background-size:cover;background-position:center;`
    sec += '}'
    parts.push(`@media ${r.media}{${u}${sec}`)
    for (const g of b.groups ?? []) {
      const eff = g.eff?.[r.scr]; if (!eff) continue
      const mol = g.mol?.[r.scr] ?? {}
      let css = posCss(eff.left, mobile, r.artW)
      const top = num(eff.top, mobile); if (top !== null) css += `top:${top};`
      const w = num(eff.width, mobile); if (w !== null) css += `width:${w};`
      const h = num(eff.height, mobile); if (h !== null) css += `height:${h};`
      for (const k of ['background-color', 'background-image', 'border-radius', 'box-shadow', 'opacity']) if (mol[k]) css += `${k}:${mol[k]};`
      parts.push(`${id} .g${g.id}{${css}}`)
    }
    for (const e of b.elems ?? []) {
      const eff = e.eff?.[r.scr]; if (!eff) continue
      parts.push(elemRules(`${id} .e${e.id}`, e, eff, mobile, r.artW))
    }
    parts.push('}')
  }
  return parts.join('')
}
