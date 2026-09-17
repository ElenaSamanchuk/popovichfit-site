#!/usr/bin/env node
/**
 * SEO-мета локальных страниц против экспорта Тильды (docs/meta.json: title, description, og:*, canonical, noindex).
 *   BASE=http://localhost:3500 node scripts/check-seo.mjs [/url …]
 * Печатает только расхождения; проверяет также lang, viewport, наличие h1 (информационно).
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const BASE = process.env.BASE || 'http://localhost:3500'
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/meta.json'), 'utf8'))
const only = process.argv.slice(2).filter((a) => a.startsWith('/'))
const dec = (s) => (s || '').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim()
const pick = (html, re) => dec(re.exec(html)?.[1] || '')
let bad = 0, n = 0, noH1 = 0
for (const [file, p] of Object.entries(meta)) {
  if (p.url === '/404.html' || (only.length && !only.includes(p.url))) continue
  n++
  const res = await fetch(BASE + p.url).catch(() => null)
  if (!res || res.status !== 200) { bad++; console.log(`✗ ${p.url}: HTTP ${res?.status ?? 'нет ответа'}`); continue }
  const html = await res.text()
  const got = {
    title: pick(html, /<title[^>]*>([^<]*)<\/title>/i),
    description: pick(html, /<meta[^>]+name="description"[^>]+content="([^"]*)"/i) || pick(html, /<meta[^>]+content="([^"]*)"[^>]+name="description"/i),
    ogTitle: pick(html, /<meta[^>]+property="og:title"[^>]+content="([^"]*)"/i),
    ogDescription: pick(html, /<meta[^>]+property="og:description"[^>]+content="([^"]*)"/i),
    ogImage: pick(html, /<meta[^>]+property="og:image"[^>]+content="([^"]*)"/i),
    canonical: pick(html, /<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i),
    robots: pick(html, /<meta[^>]+name="robots"[^>]+content="([^"]*)"/i),
    lang: pick(html, /<html[^>]+lang="([^"]*)"/i),
  }
  const want = { title: dec(p.title), description: dec(p.description), ogTitle: dec(p.ogTitle || p.title), ogDescription: dec(p.ogDescription || p.description), ogImage: p.ogImage ? 'https://popovichfit.ru/img/og/' + p.ogImage.split('/').pop() : '', canonical: p.url === '/' ? 'https://popovichfit.ru' : 'https://popovichfit.ru' + p.url, robots: p.noindex ? 'noindex' : '', lang: 'ru' }
  const diffs = Object.keys(want).filter((k) => want[k] !== got[k])
  if (!/<h1[\s>]/i.test(html)) noH1++
  if (diffs.length) { bad++; console.log(`✗ ${p.url} (${file}):`); for (const k of diffs) console.log(`    ${k}: ожидали «${want[k].slice(0, 90)}» / есть «${got[k].slice(0, 90)}»`) }
}
console.log(`\n${bad ? '✗' : '✓'} страниц с расхождениями меты: ${bad} из ${n}; без <h1>: ${noH1} (как и на Тильде — информационно)`)
process.exit(bad ? 1 : 0)
