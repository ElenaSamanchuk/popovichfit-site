#!/usr/bin/env node
/**
 * Сравнение скриншотов live vs local: docs/screens/{live,local}/<slug>/<width>.png →
 * docs/screens/diff/<slug>/<width>.png (слева live, по центру local, справа diff) + % отличий.
 *   node scripts/compare.mjs / [/about ...] [--width 1200] [--viewport]
 * По умолчанию сравниваются full-page 1200 и 390. Высоты разные → сравнение по общей высоте,
 * разница высот печатается отдельно (это тоже сигнал расхождения вёрстки).
 */
import fs from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

const ROOT = path.resolve(import.meta.dirname, '..')
const args = process.argv.slice(2)
const urls = args.filter((a) => a.startsWith('/'))
const wIdx = args.indexOf('--width')
const widths = wIdx >= 0 ? [Number(args[wIdx + 1])] : [1200, 390]
const suffix = args.includes('--viewport') ? '.viewport' : ''
const slugOf = (u) => (u === '/' ? 'index' : u.replace(/^\//, '').replace(/[\/.]/g, '_'))

for (const url of urls) {
  for (const w of widths) {
    const slug = slugOf(url)
    const a = path.join(ROOT, 'docs/screens/live', slug, `${w}${suffix}.png`)
    const b = path.join(ROOT, 'docs/screens/local', slug, `${w}${suffix}.png`)
    if (!fs.existsSync(a) || !fs.existsSync(b)) { console.log(`${url} ${w}: нет файла (${!fs.existsSync(a) ? 'live' : 'local'})`); continue }
    const live = PNG.sync.read(fs.readFileSync(a))
    const local = PNG.sync.read(fs.readFileSync(b))
    const width = Math.min(live.width, local.width)
    const height = Math.min(live.height, local.height)
    const crop = (png) => {
      const out = new PNG({ width, height })
      PNG.bitblt(png, out, 0, 0, width, height, 0, 0)
      return out
    }
    const A = crop(live), B = crop(local)
    const diff = new PNG({ width, height })
    const n = pixelmatch(A.data, B.data, diff.data, width, height, { threshold: 0.15, includeAA: true })
    const pct = ((n / (width * height)) * 100).toFixed(2)
    const out = new PNG({ width: width * 3 + 20, height })
    PNG.bitblt(A, out, 0, 0, width, height, 0, 0)
    PNG.bitblt(B, out, 0, 0, width, height, width + 10, 0)
    PNG.bitblt(diff, out, 0, 0, width, height, width * 2 + 20, 0)
    const dir = path.join(ROOT, 'docs/screens/diff', slug)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, `${w}${suffix}.png`), PNG.sync.write(out))
    console.log(`${url} @${w}: diff ${pct}% | высота live ${live.height} / local ${local.height} (Δ ${local.height - live.height})`)
  }
}
