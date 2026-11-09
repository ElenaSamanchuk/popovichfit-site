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
lines.push('~^/members(/|$) https://lk.popovichfit.ru/login;') // вход Tilda Members → новый ЛК (см. server/middleware/redirects.ts)
fs.mkdirSync(path.join(ROOT, '.output'), { recursive: true })
fs.writeFileSync(path.join(ROOT, '.output/redirects.map'), '# nginx: map $uri $pf_redirect { include redirects.map; } (строки с ~ — регулярные выражения)\n' + [...new Set(lines)].sort().join('\n') + '\n')
console.log(`redirects.map: ${new Set(lines).size} правил`)
let fail = false
// Режим продаж (app/data/sales.ts) должен совпадать со сборкой: SALES_OPEN=true обязан дать .output/public/sales-open/index.html
// (пререндер), иначе nginx (по маркеру) и Nitro разойдутся. Если пререндер упал — failOnError:false это скроет, ловим здесь.
const salesSrc = fs.readFileSync(path.join(ROOT, 'app/data/sales.ts'), 'utf8')
const salesOpen = /SALES_OPEN\s*=\s*true/.test(salesSrc) || /SALES_OPEN\s*:\s*boolean\s*=\s*true/.test(salesSrc)
const salesMarker = fs.existsSync(path.join(ROOT, '.output/public/sales-open/index.html'))
if (salesMarker !== salesOpen) {
  console.error(`ОШИБКА режима продаж: SALES_OPEN=${salesOpen} (app/data/sales.ts), а маркер .output/public/sales-open/index.html ${salesMarker ? 'есть' : 'отсутствует'}. ` +
    (salesOpen ? 'Пререндер страниц продаж не прошёл — nginx и Nitro разойдутся. Смотрите лог сборки, пересоберите.' : 'Остался маркер от прежней сборки — очистите .output и соберите заново.'))
  fail = true
}
for (const s of ['check-urls.mjs', 'check-links.mjs', 'check-no-tilda.mjs']) {
  const r = spawnSync('node', [path.join(ROOT, 'scripts', s)], { stdio: 'inherit' })
  if (r.status !== 0) fail = true
}
process.exit(fail ? 1 : 0)
