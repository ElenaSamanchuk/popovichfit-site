#!/usr/bin/env node
/**
 * Где именно страница расходится с живым сайтом: доля отличающихся пикселей по горизонтальным полосам (50px).
 *   node scripts/rowdiff.mjs <slug> <width> [band=50] [min%=3]
 * Слаг — как в docs/screens/{live,local}/<slug>/<width>.png (index, course_correction …).
 */
import fs from 'node:fs'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

const [slug, w, bandArg, minArg] = process.argv.slice(2)
const band = +(bandArg || 50), min = +(minArg || 3)
const a = PNG.sync.read(fs.readFileSync(`docs/screens/live/${slug}/${w}.png`))
const b = PNG.sync.read(fs.readFileSync(`docs/screens/local/${slug}/${w}.png`))
const W = Math.min(a.width, b.width), H = Math.min(a.height, b.height)
const crop = (p) => { const o = new PNG({ width: W, height: H }); PNG.bitblt(p, o, 0, 0, W, H, 0, 0); return o }
const out = new PNG({ width: W, height: H })
pixelmatch(crop(a).data, crop(b).data, out.data, W, H, { threshold: 0.15, includeAA: true })
const rows = []
for (let y = 0; y < H; y += band) {
  let n = 0
  for (let yy = y; yy < Math.min(y + band, H); yy++) for (let x = 0; x < W; x++) { const i = (yy * W + x) * 4; if (out.data[i] === 255 && out.data[i + 1] === 0) n++ }
  rows.push([y, +((n / (band * W)) * 100).toFixed(1)])
}
console.log(`${slug}@${w}: live ${a.height} / local ${b.height}`)
console.log(rows.filter(([, d]) => d >= min).map(([y, d]) => `${y}:${d}%`).join('  ') || 'нет полос с diff ≥ ' + min + '%')
