#!/usr/bin/env node
/**
 * Массовый импорт картинок экспорта для рендерера Zero Block: old-site/images/tild<...>__name.ext →
 * public/img/t/t<8hex>-<name>.(webp|svg|ico|gif). Растровые (jpg/png) конвертируются в WebP q=85
 * (оригиналы не копируются, кроме og-картинок — их берёт scripts/import-og.mjs), SVG/ICO/GIF копируются как есть.
 * Имя совпадает с img_path() в scripts/audit/build_tilda_json.py. Пропускает resize-варианты и плейсхолдеры.
 *   node scripts/import-images-all.mjs [--only-used]   (--only-used: только файлы, на которые ссылаются app/data/tilda/*.json)
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.join(ROOT, 'old-site/images')
const OUT = path.join(ROOT, 'public/img/t')
fs.mkdirSync(OUT, { recursive: true })

function targetName(base) {
  const m = base.match(/^tild([0-9a-f]{4})-([0-9a-f]{4})-[0-9a-f-]+__(.+)$/)
  if (!m) return base
  let name = m[3].replace(/[^A-Za-z0-9._-]+/g, '_').toLowerCase()
  const ext = path.extname(name)
  if (['.jpg', '.jpeg', '.png'].includes(ext)) name = name.slice(0, -ext.length) + '.webp'
  return `t${m[1]}${m[2]}-${name}`
}

let used = null
if (process.argv.includes('--only-used')) {
  used = new Set()
  for (const f of fs.readdirSync(path.join(ROOT, 'app/data/tilda'))) {
    const s = fs.readFileSync(path.join(ROOT, 'app/data/tilda', f), 'utf8')
    for (const m of s.matchAll(/\/img\/t\/([^"'\\)\s]+)/g)) used.add(m[1])
  }
}
const files = fs.readdirSync(SRC).filter((f) => !/__-__resize|__-__empty__|__empty__/.test(f))
let done = 0, skipped = 0
for (const f of files) {
  const name = targetName(f)
  if (used && !used.has(name)) { skipped++; continue }
  const dst = path.join(OUT, name)
  if (fs.existsSync(dst)) { done++; continue }
  const ext = path.extname(f).toLowerCase()
  try {
    if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      const img = sharp(path.join(SRC, f))
      const meta = await img.metadata()
      // без апскейла; очень широкие (>2400) уменьшаем до 2400 — на сайте таких размеров нет
      const pipeline = meta.width > 2400 ? img.resize({ width: 2400 }) : img
      await pipeline.webp({ quality: 85, effort: 4 }).toFile(dst)
    } else {
      fs.copyFileSync(path.join(SRC, f), dst)
    }
    done++
  } catch (e) { console.error('ошибка', f, String(e).slice(0, 100)) }
  if (done % 100 === 0) process.stdout.write(`\r${done}/${files.length}`)
}
console.log(`\nготово: ${done} файлов${used ? `, пропущено неиспользуемых: ${skipped}` : ''} → public/img/t`)
