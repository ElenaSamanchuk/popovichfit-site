#!/usr/bin/env node
/**
 * Все URL экспорта существуют: в сборке (.output/public/<url>/index.html или <url>.html) или на сервере (BASE=http://…).
 *   node scripts/check-urls.mjs            → по файлам сборки
 *   BASE=http://localhost:3500 node scripts/check-urls.mjs → по HTTP (ожидаем 200 и <title> страницы)
 */
import fs from 'node:fs'
import path from 'node:path'
import { SALES_OPEN, SALES_REDIRECTS } from '../app/data/sales.ts'

const ROOT = path.resolve(import.meta.dirname, '..')
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/meta.json'), 'utf8'))
const BASE = process.env.BASE
const unpublished = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/unpublished.json'), 'utf8')).urls || [])
let bad = 0, n = 0, redirects = 0
for (const [file, p] of Object.entries(meta)) {
  if (p.url === '/404.html' || unpublished.has(p.url)) continue // скрытые страницы: их нет в сборке намеренно
  const salesTarget = !SALES_OPEN && SALES_REDIRECTS[p.url]
  if (salesTarget) {
    redirects++
    if (BASE) {
      const res = await fetch(BASE + p.url, { redirect: 'manual' }).catch(() => null)
      const location = res?.headers.get('location')
      if (res?.status !== 302 || !location || new URL(location, BASE).pathname !== salesTarget) {
        bad++
        console.log(`✗ ${p.url}: ожидался 302 → ${salesTarget}, получен ${res?.status ?? 'нет ответа'}`)
      }
    } else if (fs.existsSync(path.join(ROOT, '.output/public', p.url.slice(1), 'index.html'))) {
      bad++
      console.log(`✗ ${p.url}: HTML перекрывает серверный редирект`)
    }
    continue
  }
  n++
  if (BASE) {
    const res = await fetch(BASE + p.url, { redirect: 'manual' }).catch(() => null)
    const html = res ? await res.text() : ''
    const title = /<title>([^<]*)<\/title>/.exec(html)?.[1] || ''
    if (!res || res.status !== 200 || !html.includes('data-tilda-rec') && !html.includes('pf-header')) { bad++; console.log(`✗ ${p.url} → ${res?.status ?? 'нет ответа'} (${file})`) }
    else if (p.title && title.trim() !== p.title.trim()) { bad++; console.log(`✗ ${p.url}: title «${title}» ≠ «${p.title}»`) }
  } else {
    const dir = path.join(ROOT, '.output/public')
    const cands = p.url === '/' ? ['index.html'] : [p.url.slice(1) + '/index.html', p.url.slice(1) + (p.url.endsWith('.html') ? '' : '.html')]
    if (!cands.some((c) => fs.existsSync(path.join(dir, c)))) { bad++; console.log(`✗ нет файла для ${p.url} (${file})`) }
  }
}
console.log(bad ? `\n✗ проблемных URL: ${bad} из ${n + redirects}` : `✓ все ${n} URL на месте${redirects ? `, ещё ${redirects} адреса работают через редирект` : ''}`)
process.exit(bad ? 1 : 0)
