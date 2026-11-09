#!/usr/bin/env node
/** Packaging helper; can resume a completed isolated build without rebuilding.
 * node scripts/package-pages-preview.mjs WORK_DIR NEW_OUTPUT_DIR
 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])
export function packagePreview(work, output) {
if (fs.existsSync(output)) throw Error('Output must not already exist')
const manifest=JSON.parse(fs.readFileSync(path.join(work,'manifest.json'),'utf8'))
const {base,routes}=manifest
const assets=['img','fonts','home','tariffs']
const pub = path.join(work, '.output/public')
// Export only known public directories and explicitly allowed route HTML/payloads.
fs.mkdirSync(output, { recursive: true })
for (const name of [...assets, '_nuxt', 'preview-data', 'preview-policy.js', 'favicon.ico']) if (fs.existsSync(path.join(pub, name))) fs.cpSync(path.join(pub, name), path.join(output, name), { recursive: true })
for (const route of routes) {
  const folder = route === '/' ? '' : route.slice(1)
  for (const file of ['index.html', '_payload.json']) {
    const from = path.join(pub, folder, file)
    if (!fs.existsSync(from)) throw Error(`Missing ${route}/${file}`)
    const to = path.join(output, folder, file); fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to)
  }
}
fs.writeFileSync(path.join(output, 'robots.txt'), 'User-agent: *\nDisallow: /\n')
fs.writeFileSync(path.join(output, '.nojekyll'), '')
fs.writeFileSync(path.join(output, '404.html'), '<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Страница не входит в превью</title><h1>Страница не входит в превью</h1><a href="' + base + '">На главную</a></html>')
// Trim unreferenced media: only filenames actually referenced in generated markup/data/bundles survive.
const textFiles = walk(output).filter(f => /\.(html|json|js|css)$/.test(f))
const references = textFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n')
let removedAssets = 0
for (const dir of assets) if (fs.existsSync(path.join(output,dir))) for (const f of walk(path.join(output,dir))) {
  if (!references.includes(path.basename(f))) {fs.rmSync(f);removedAssets++}
}
for (const f of walk(output)) {
  const rel=path.relative(output,f)
  if (/\.map$|(^|\/)(?:\.env|server|speakers)(?:\/|$)/.test(rel)) throw Error('Forbidden published file: '+rel)
  if (/\.(html|json|js|css)$/.test(f) && /id=[\"']speakers[\"']|home\/img\/speakers/.test(fs.readFileSync(f,'utf8'))) throw Error('Designer draft leaked: '+rel)
}
manifest.removedUnusedAssets=removedAssets
// Full excluded list stays in the PRIVATE work manifest, not in the public repo.
const {excluded, ...publicManifest}=manifest
publicManifest.excludedCount=excluded.length
fs.writeFileSync(path.join(output, 'preview-manifest.json'), JSON.stringify(publicManifest, null, 2))
console.log(`\nREADY ${output}\nMANIFEST ${work}/manifest.json\nRoutes: ${routes.length}`)

}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) packagePreview(path.resolve(process.argv[2]),path.resolve(process.argv[3]))
