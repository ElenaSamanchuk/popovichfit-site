#!/usr/bin/env node
/**
 * Проверка «ни одной ссылки на Тильду»: ищет tilda.cc / *.tilda.ws / *.tildacdn.com / tildaapi.com / tildacdn.net
 * в собранном сайте (.output/public по умолчанию) и в исходниках app/, public/, server/.
 *   node scripts/check-no-tilda.mjs [dir]
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const dirs = process.argv[2] ? [path.resolve(process.argv[2])] : [path.join(ROOT, '.output/public'), path.join(ROOT, 'app'), path.join(ROOT, 'public'), path.join(ROOT, 'server')]
const RE = /tilda\.cc|tilda\.ws|tildacdn\.(com|net|biz|info)|tildaapi\.com|static\.tildacdn|members2\.tildacdn/i
const SKIP = /node_modules|\.map$|\.png$|\.jpg$|\.webp$|\.woff2?$|\.ico$|\.svg$/
let hits = 0, files = 0
function walk(d) {
  if (!fs.existsSync(d)) return
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) { if (!/node_modules/.test(p)) walk(p); continue }
    if (SKIP.test(p)) continue
    files++
    const s = fs.readFileSync(p, 'utf8')
    let m; const re = new RegExp(RE.source, 'gi'); const seen = new Set()
    while ((m = re.exec(s))) {
      const ctx = s.slice(Math.max(0, m.index - 80), m.index + 60).replace(/\s+/g, ' ')
      if (seen.has(ctx)) continue; seen.add(ctx); hits++
      if (hits <= 60) console.log(`${path.relative(ROOT, p)}: …${ctx}…`)
    }
  }
}
dirs.forEach(walk)
console.log(hits ? `\n✗ найдено упоминаний Тильды: ${hits} (файлов проверено ${files})` : `✓ упоминаний Тильды нет (файлов проверено ${files})`)
process.exit(hits ? 1 : 0)
