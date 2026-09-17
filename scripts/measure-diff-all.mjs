#!/usr/bin/env node
/**
 * Прогон measure-diff по всем страницам с живыми замерами (docs/specs/measured/*.json).
 *   node scripts/measure-diff-all.mjs [1200|320|…] [--tol=3]     → docs/specs/diff/<slug>-<w>.txt + docs/specs/diff/SUMMARY.md
 * Без ширины — все замеренные ширины. Сводка: элементов / с расхождениями, «нет локально», высота live/local.
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const ROOT = path.resolve(import.meta.dirname, '..')
const args = process.argv.slice(2)
const tol = (args.find((a) => a.startsWith('--tol=')) || '--tol=3').slice(6)
const onlyW = args.find((a) => /^\d+$/.test(a))
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/meta.json'), 'utf8'))
const urlBySlug = {}
for (const p of Object.values(meta)) urlBySlug[p.url === '/' ? 'index' : p.url.replace(/^\//, '').replace(/[\/.]/g, '_')] = p.url
const OUT = path.join(ROOT, 'docs/specs/diff'); fs.mkdirSync(OUT, { recursive: true })
const files = fs.readdirSync(path.join(ROOT, 'docs/specs/measured')).filter((f) => f.endsWith('.json')).sort()
const rows = []
let i = 0
for (const f of files) {
  const m = /^(.*)-(\d+)\.json$/.exec(f); if (!m) continue
  const [, slug, w] = m
  if (onlyW && w !== onlyW) continue
  const url = urlBySlug[slug]; if (!url) continue
  i++; process.stdout.write(`\r${i} ${url}@${w}      `)
  const r = spawnSync('node', ['scripts/measure-diff.mjs', url, w, tol], { cwd: ROOT, encoding: 'utf8', timeout: 180000 })
  const out = (r.stdout || '') + (r.stderr || '')
  fs.writeFileSync(path.join(OUT, `${slug}-${w}.txt`), out)
  const tot = /элементов: (\d+), с расхождениями > \d+px: (\d+)/.exec(out)
  const h = /высота live (\d+) \/ local (\d+)/.exec(out)
  rows.push({ url, w: +w, total: tot ? +tot[1] : null, bad: tot ? +tot[2] : null, missing: (out.match(/нет на локальной/g) || []).length, hidden: (out.match(/скрыт локально/g) || []).length, styles: (out.match(/шрифт live|цвет live|фон live|align live/g) || []).length, hLive: h ? +h[1] : null, hLocal: h ? +h[2] : null, err: r.status !== 0 ? out.slice(-120).replace(/\s+/g, ' ') : '' })
}
rows.sort((a, b) => a.url.localeCompare(b.url) || a.w - b.w)
let md = `# Сверка геометрии и стилей с живым сайтом\n\nОбновлено ${new Date().toLocaleString('ru-RU')} (scripts/measure-diff-all.mjs, порог ${tol}px). Подробности — docs/specs/diff/<slug>-<width>.txt.\n\n| URL | Ширина | Элементов | Расхождений | Нет локально | Стили | Высота live/local |\n|---|---|---|---|---|---|---|\n`
for (const r of rows) md += `| \`${r.url}\` | ${r.w} | ${r.total ?? '—'} | ${r.bad ?? '—'} | ${r.missing} | ${r.styles} | ${r.hLive ?? '—'} / ${r.hLocal ?? '—'}${r.hLive && r.hLocal && Math.abs(r.hLive - r.hLocal) > 30 ? ' ⚠' : ''} |${r.err ? ' ошибка: ' + r.err : ''}\n`
const ok = rows.filter((r) => r.bad !== null && r.bad <= 2).length
md += `\nСтраниц×ширин: ${rows.length}, с ≤ 2 расхождениями: ${ok}.\n`
const name = onlyW && onlyW !== '1200' ? `SUMMARY-${onlyW}.md` : 'SUMMARY.md'
fs.writeFileSync(path.join(OUT, name), md)
console.log(`\nготово → docs/specs/diff/${name} (в норме ${ok}/${rows.length})`)
