#!/usr/bin/env node
/**
 * Сводка переноса: для каждой страницы экспорта — скриншоты локальной версии (1200/390), сравнение с живым
 * сайтом (pixelmatch), высоты, ошибки консоли → docs/MIGRATION-STATUS.md + docs/status.json.
 *   node scripts/status-report.mjs            → все страницы
 *   node scripts/status-report.mjs /about …   → выбранные
 *   node scripts/status-report.mjs --no-shoot → только пересчитать сравнение по готовым скриншотам
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

const ROOT = path.resolve(import.meta.dirname, '..')
const args = process.argv.slice(2)
const noShoot = args.includes('--no-shoot')
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/meta.json'), 'utf8'))
const map = fs.readFileSync(path.join(ROOT, 'docs/old-site-url-map.md'), 'utf8')
const cat = {}; let cur = ''
for (const line of map.split('\n')) {
  const m = line.match(/^## ([A-Z])\./); if (m) cur = m[1]
  const u = line.match(/^\| `([^`]+)`/); if (u && cur) cat[u[1]] = cur
}
const urls = args.filter((a) => a.startsWith('/')).length ? args.filter((a) => a.startsWith('/')) : Object.values(meta).map((p) => p.url)
const slugOf = (u) => (u === '/' ? 'index' : u.replace(/^\//, '').replace(/[\/.]/g, '_'))

function cmp(slug, w) {
  const a = path.join(ROOT, 'docs/screens/live', slug, `${w}.png`)
  const b = path.join(ROOT, 'docs/screens/local', slug, `${w}.png`)
  if (!fs.existsSync(a) || !fs.existsSync(b)) return null
  const live = PNG.sync.read(fs.readFileSync(a)), local = PNG.sync.read(fs.readFileSync(b))
  const width = Math.min(live.width, local.width), height = Math.min(live.height, local.height)
  const crop = (png) => { const o = new PNG({ width, height }); PNG.bitblt(png, o, 0, 0, width, height, 0, 0); return o }
  const n = pixelmatch(crop(live).data, crop(local).data, null, width, height, { threshold: 0.15, includeAA: true })
  return { diff: +((n / (width * height)) * 100).toFixed(1), live: live.height, local: local.height }
}

const status = fs.existsSync(path.join(ROOT, 'docs/status.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/status.json'), 'utf8')) : {}
let i = 0
for (const url of urls) {
  i++
  const slug = slugOf(url)
  if (!noShoot) {
    const r = spawnSync('node', ['scripts/shoot-local.mjs', url], { cwd: ROOT, encoding: 'utf8', timeout: 180000 })
    if (r.status !== 0) status[url] = { ...(status[url] || {}), error: (r.stderr || r.stdout || '').slice(-200) }
  }
  const d1200 = cmp(slug, 1200), d390 = cmp(slug, 390)
  status[url] = { ...(status[url] || {}), cat: cat[url] || (url === '/' ? 'A' : 'S'), file: Object.values(meta).find((p) => p.url === url)?.title ?? '', d1200, d390, at: new Date().toISOString() }
  process.stdout.write(`\r${i}/${urls.length} ${url}   `)
}
fs.writeFileSync(path.join(ROOT, 'docs/status.json'), JSON.stringify(status, null, 1))

// Markdown
const rows = Object.entries(status).sort((a, b) => (a[1].cat + a[0]).localeCompare(b[1].cat + b[0]))
const fmt = (d) => (d ? `${d.diff}% (${d.local - d.live >= 0 ? '+' : ''}${d.local - d.live}px)` : '—')
const ok = rows.filter(([, s]) => s.d1200 && s.d1200.diff <= 5 && Math.abs(s.d1200.local - s.d1200.live) <= 30).length
let md = `# Статус переноса страниц\n\nОбновлено ${new Date().toLocaleString('ru-RU')} (scripts/status-report.mjs). Страниц: ${rows.length}, «в норме» на 1200 (diff ≤ 5 %, |Δ высоты| ≤ 30px): **${ok}**.\n\n`
md += 'Diff — доля отличающихся пикселей live vs local (pixelmatch, порог 0.15); в скобках — разница высоты страницы (local − live). Категории — как в docs/old-site-url-map.md.\n\n'
md += '| Кат. | URL | Заголовок | 1200 | 390 | Примечание |\n|---|---|---|---|---|---|\n'
for (const [url, s] of rows) {
  const note = s.note || (s.error ? 'ошибка снимка' : (!s.d1200 ? 'нет скриншота' : ''))
  md += `| ${s.cat} | \`${url}\` | ${(s.file || '').slice(0, 50)} | ${fmt(s.d1200)} | ${fmt(s.d390)} | ${note} |\n`
}
fs.writeFileSync(path.join(ROOT, 'docs/MIGRATION-STATUS.md'), md)
console.log(`\nготово → docs/MIGRATION-STATUS.md (в норме: ${ok}/${rows.length})`)
