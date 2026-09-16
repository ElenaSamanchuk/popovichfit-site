#!/usr/bin/env node
/**
 * Вырезает одинаковую область из live и local скриншотов и кладёт рядом (для точной сверки блока).
 *   node scripts/crop-compare.mjs <slug> <width> <y0> <y1> [scale]
 *   пример: node scripts/crop-compare.mjs index 1200 139 890 0.6
 * Результат: docs/screens/diff/<slug>/crop-<width>-<y0>-<y1>.png (live слева, local справа).
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '..')
const [slug, width, y0, y1, scaleArg] = process.argv.slice(2)
const w = Number(width), top = Number(y0), bottom = Number(y1), scale = Number(scaleArg || 1)
const a = path.join(ROOT, 'docs/screens/live', slug, `${w}.png`)
const b = path.join(ROOT, 'docs/screens/local', slug, `${w}.png`)
const h = bottom - top
async function crop(file) {
  const meta = await sharp(file).metadata()
  const height = Math.min(h, meta.height - top)
  return sharp(file).extract({ left: 0, top, width: Math.min(w, meta.width), height }).resize({ width: Math.round(w * scale) }).png().toBuffer()
}
const [A, B] = await Promise.all([crop(a), crop(b)])
const am = await sharp(A).metadata(), bm = await sharp(B).metadata()
const outW = am.width + bm.width + 10, outH = Math.max(am.height, bm.height)
const out = await sharp({ create: { width: outW, height: outH, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } } })
  .composite([{ input: A, left: 0, top: 0 }, { input: B, left: am.width + 10, top: 0 }]).png().toBuffer()
const dir = path.join(ROOT, 'docs/screens/diff', slug)
fs.mkdirSync(dir, { recursive: true })
const file = path.join(dir, `crop-${w}-${top}-${bottom}.png`)
fs.writeFileSync(file, out)
console.log(file)
