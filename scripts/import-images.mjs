#!/usr/bin/env node
/**
 * Импорт картинок из экспорта Тильды в public/img/<dir>/ с оптимизацией (sharp).
 *   node scripts/import-images.mjs --page page36594700.html --dir home
 *   node scripts/import-images.mjs --file tild...__photo.png --dir shared [--name hero-photo]
 * Что делает: берёт оригиналы (data-original / src / og:image / css url()), кладёт под осмысленным
 * именем (хвост после "__"), для растровых генерирует .webp (q=85, без апскейла) и, если ширина > 1600,
 * уменьшенные варианты -1600/-800 для srcset. SVG/ICO копирует как есть. Пишет docs/asset-map.md.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '..')
const OLD = path.join(ROOT, 'old-site')
const args = process.argv.slice(2)
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d }
const dir = opt('--dir', 'shared')
const OUT = path.join(ROOT, 'public/img', dir)
fs.mkdirSync(OUT, { recursive: true })
const MAP = path.join(ROOT, 'docs/asset-map.md')
const map = fs.existsSync(MAP) ? fs.readFileSync(MAP, 'utf8') : '# Карта ассетов: новое имя → файл в old-site/images\n\n| public/img | old-site/images | размер |\n|---|---|---|\n'
const known = new Set([...map.matchAll(/\| `([^`]+)` \|/g)].map((m) => m[1]))

let files = []
if (opt('--page')) {
  const html = fs.readFileSync(path.join(OLD, opt('--page')), 'utf8')
  const set = new Set()
  for (const m of html.matchAll(/(?:data-original|src|content|href)=["'](images\/[^"']+)["']/g)) set.add(m[1])
  for (const m of html.matchAll(/url\(["']?(images\/[^"')]+)/g)) set.add(m[1])
  files = [...set].filter((f) => !/__-__resize|__-__empty__|__empty__/.test(f))
} else if (opt('--file')) {
  files = [opt('--file').startsWith('images/') ? opt('--file') : 'images/' + opt('--file')]
}

const rows = []
for (const rel of files) {
  const src = path.join(OLD, rel)
  if (!fs.existsSync(src)) { console.warn('нет файла', rel); continue }
  const base = path.basename(rel)
  let name = opt('--name') || base.replace(/^tild[0-9a-f-]+__/, '').replace(/^_+/, 'img_').toLowerCase().replace(/[^a-z0-9._-]+/g, '_')
  if (!/\.[a-z0-9]+$/.test(name)) name += path.extname(base)
  const ext = path.extname(name).toLowerCase()
  // коллизии имён: добавляем короткий хеш содержимого
  const buf = fs.readFileSync(src)
  const hash = crypto.createHash('md5').update(buf).digest('hex').slice(0, 6)
  let target = path.join(OUT, name)
  if (fs.existsSync(target) && crypto.createHash('md5').update(fs.readFileSync(target)).digest('hex').slice(0, 6) !== hash) {
    name = name.replace(ext, `-${hash}${ext}`); target = path.join(OUT, name)
  }
  const pub = `/img/${dir}/${name}`
  if (!fs.existsSync(target)) fs.copyFileSync(src, target)
  let info = ''
  if (['.jpg', '.jpeg', '.png'].includes(ext)) {
    const img = sharp(buf); const meta = await img.metadata()
    info = `${meta.width}×${meta.height}`
    const webp = target.replace(ext, '.webp')
    if (!fs.existsSync(webp)) await sharp(buf).webp({ quality: 85, effort: 5 }).toFile(webp)
    for (const w of [1600, 800]) {
      if (meta.width > w * 1.15) {
        const f = target.replace(ext, `-${w}.webp`)
        if (!fs.existsSync(f)) await sharp(buf).resize({ width: w }).webp({ quality: 85, effort: 5 }).toFile(f)
      }
    }
  }
  if (!known.has(pub)) rows.push(`| \`${pub}\` | ${rel.replace('images/', '')} | ${info} |`)
  console.log(pub, info)
}
if (rows.length) fs.writeFileSync(MAP, map + rows.join('\n') + '\n')
