#!/usr/bin/env node
/**
 * После сборки: карта редиректов для nginx (.output/redirects.map: старый путь → новый) и проверки
 * (все URL на месте, внутренние ссылки, ни одной ссылки на Тильду). Падает, если проверки не прошли.
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const ROOT = path.resolve(import.meta.dirname, '..')
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/meta.json'), 'utf8'))
const lines = []
for (const [file, p] of Object.entries(meta)) {
  if (p.url !== '/' + file && p.url !== '/404.html') lines.push(`/${file} ${p.url};`)
  for (const s of p.slugs.slice(1)) if ('/' + s !== p.url) lines.push(`/${s} ${p.url};`)
}
fs.mkdirSync(path.join(ROOT, '.output'), { recursive: true })
fs.writeFileSync(path.join(ROOT, '.output/redirects.map'), '# nginx: map $uri $redirect_to { include redirects.map; }\n' + [...new Set(lines)].sort().join('\n') + '\n')
console.log(`redirects.map: ${new Set(lines).size} правил`)
let fail = false
for (const s of ['check-urls.mjs', 'check-links.mjs', 'check-no-tilda.mjs']) {
  const r = spawnSync('node', [path.join(ROOT, 'scripts', s)], { stdio: 'inherit' })
  if (r.status !== 0) fail = true
}
process.exit(fail ? 1 : 0)
