#!/usr/bin/env node
// og-картинки страниц (docs/meta.json → ogImage) → public/img/og/<имя файла экспорта>. Копируются как есть, только недостающие.
import fs from 'node:fs'
import path from 'node:path'
const ROOT = path.resolve(import.meta.dirname, '..')
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/meta.json'), 'utf8'))
const out = path.join(ROOT, 'public/img/og'); fs.mkdirSync(out, { recursive: true })
let copied = 0, missing = []
for (const p of Object.values(meta)) {
  if (!p.ogImage) continue
  const name = p.ogImage.split('/').pop()
  const dst = path.join(out, name)
  if (fs.existsSync(dst)) continue
  const src = path.join(ROOT, 'old-site/images', name)
  if (fs.existsSync(src)) { fs.copyFileSync(src, dst); copied++ } else missing.push(name)
}
console.log(`og: скопировано ${copied}, нет в экспорте: ${missing.length}`, missing.slice(0, 5).join(', '))
process.exit(0)
