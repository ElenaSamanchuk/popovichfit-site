#!/usr/bin/env node
/**
 * Внутренние ссылки в сборке ведут на существующие страницы/файлы (или на lk.popovichfit.ru / внешние / hash-попапы).
 *   node scripts/check-links.mjs [dir=.output/public]
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const dir = path.resolve(process.argv[2] || path.join(ROOT, '.output/public'))
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/meta.json'), 'utf8'))
const known = new Set(Object.values(meta).flatMap((p) => [p.url, ...p.slugs.map((s) => '/' + s)]))
const dead = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/known-dead-links.json'), 'utf8'))
const isKnownDead = (u) => dead.paths.includes(u) || dead.redirected.some((pre) => u.startsWith(pre))
const exists = (u) => {
  const clean = u.split(/[?#]/)[0].replace(/\/+$/, '') || '/'
  if (known.has(clean) || known.has(clean.toLowerCase())) return true
  const m = /^\/(page\d+\.html)$/i.exec(clean); if (m && meta[m[1].toLowerCase()]) return true
  const f = path.join(dir, clean)
  return fs.existsSync(f) || fs.existsSync(f + '.html') || fs.existsSync(path.join(f, 'index.html'))
}
const bad = new Map(); let total = 0, pages = 0
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) { if (e.name !== '_nuxt') walk(p); continue }
    if (!p.endsWith('.html')) continue
    pages++
    const s = fs.readFileSync(p, 'utf8')
    for (const m of s.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const u = m[1]
      if (!u.startsWith('/') || u.startsWith('//') || u.startsWith('/_nuxt/')) continue
      total++
      if (!exists(u)) { const k = u.split(/[?#]/)[0]; if (!bad.has(k)) bad.set(k, []); bad.get(k).push(path.relative(dir, p)) }
    }
  }
}
walk(dir)
let real = 0
for (const [u, from] of [...bad.entries()].sort()) { const k = isKnownDead(u); if (!k) real++; console.log(`${k ? '⚠' : '✗'} ${u}  ← ${from.slice(0, 3).join(', ')}${from.length > 3 ? ` (+${from.length - 3})` : ''}${k ? '  (известно: нет и на живом сайте / редирект)' : ''}`) }
console.log(real ? `\n✗ битых внутренних ссылок: ${real} (страниц ${pages}, ссылок ${total})` : `✓ внутренние ссылки в порядке (страниц ${pages}, ссылок ${total}${bad.size ? `, известных мёртвых: ${bad.size}` : ''})`)
process.exit(real ? 1 : 0)
