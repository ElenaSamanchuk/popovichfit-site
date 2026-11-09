#!/usr/bin/env node
/** Isolated, offline Pages build. Usage: node scripts/build-pages-preview.mjs [NEW_OUTPUT_DIR]
 * Only scripts/*pages-preview* in the shared project are changed. Never publishes.
 * Requires existing node_modules; macOS cp -cR makes a real APFS clone (no symlink).
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import vm from 'node:vm'
import { spawnSync } from 'node:child_process'
const root = path.resolve(import.meta.dirname, '..')
const base = '/popovichfit-preview/'
const run = (cmd, args, opts = {}) => { const r = spawnSync(cmd, args, { stdio: 'inherit', ...opts }); if (r.status !== 0) throw Error(`${cmd} failed: ${r.status}`) }
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'popovichfit-pages-preview-'))
const output = path.resolve(process.argv[2] || path.join(work, 'publish'))
if (output.startsWith(root + '/') || fs.existsSync(output)) throw Error('Output must be a NEW directory outside the shared project')
console.log(`WORK=${work}\nOUTPUT=${output}`)
const read = p => fs.readFileSync(path.join(work, p), 'utf8')
const write = (p, s) => { fs.mkdirSync(path.dirname(path.join(work, p)), { recursive: true }); fs.writeFileSync(path.join(work, p), s) }
for (const name of ['app', 'public', 'server', 'package.json', 'package-lock.json', 'tsconfig.json']) fs.cpSync(path.join(root, name), path.join(work, name), { recursive: true })
run('cp', ['-cR', path.join(root, 'node_modules'), path.join(work, 'node_modules')])
const source = read('app/data/pages.ts')
const all = vm.runInNewContext('({' + source.split('export const pages: Record<string, PageMeta> = {')[1].split('\n}\n')[0] + '\n})')
// Explicit scope, not sitemap wholesale: the export sitemap contains old lessons and tests.
const desired = new Set(['/', '/course_correction', '/course_power', '/course_prod', '/course_corprod', '/course_powprod', '/about', '/results', '/media', '/community', '/inventory', '/sertif', '/promo', '/taplink', '/oferta', '/part_oferta', '/privacy', '/data-consent', '/consent', '/doc_l', '/support', '/delete', '/m', '/nutric-lk', '/analys-lk', '/menu7-lk', '/profile-lk'])
for (const p of Object.values(all)) if (p.url.startsWith('/media_') && !p.noindex) desired.add(p.url)
const hidden = JSON.parse(fs.readFileSync(path.join(root, 'docs/unpublished.json'))).urls
const chosen = Object.fromEntries(Object.entries(all).filter(([f, p]) => desired.has(p.url) && p.published !== false && !hidden.includes(p.url)))
const routes = Object.values(chosen).map(p => p.url).sort()
if (!routes.includes('/')) throw Error('Missing homepage')
const manifest = { base, routes, sourceSitemapEligible: Object.values(all).filter(p => !p.noindex && p.published !== false).length, explicitNoindexExceptions: Object.values(chosen).filter(p => p.noindex).map(p => p.url), excluded: Object.values(all).filter(p => !routes.includes(p.url)).map(p => p.url), policy: 'Noindex; no forms, orders, checkout or analytics; no live support widget. Static public files only.' }
write('manifest.json', JSON.stringify(manifest, null, 2))
write('app/data/pages.ts', source.split('export const pages:')[0] + 'export const pages: Record<string, PageMeta> = ' + JSON.stringify(chosen) + ';\nexport const pageByUrl: Record<string,string> = Object.fromEntries(Object.entries(pages).map(([f,p]) => [p.url,f]))\n')
for (const f of fs.readdirSync(path.join(work, 'app/pages'))) if (!['index.vue', '[...tilda].vue'].includes(f)) fs.rmSync(path.join(work, 'app/pages', f))
fs.rmSync(path.join(work, 'public/home/img/speakers'), {recursive:true,force:true})
for (const file of ['app/components/home/html/speakers.html','app/assets/css/pfh-speakers.css']) fs.rmSync(path.join(work,file),{force:true})
// Avoid bundling the alternative sales home and unpublished designer drafts at all.
write('app/pages/index.vue', read('app/pages/index.vue').replace("import openHtml from '~/components/home/html/open.html?raw'", '').replace(':html="SALES_OPEN ? openHtml : homeHtml"', ':html="homeHtml"'))
write('app/components/home/PfhHeader.vue', read('app/components/home/PfhHeader.vue').replace("import headerOpenHtml from './html/header-open.html?raw'", "const headerOpenHtml = headerHtml"))
for (const f of ['analytics.client.ts', 'tilda-forms.client.ts']) write('app/plugins/' + f, 'export default defineNuxtPlugin(() => {})\n')
write('app/components/site/SupportWidget.vue', '<template><span hidden data-preview-support-disabled /></template>\n')
write('app/composables/usePageMeta.ts', read('app/composables/usePageMeta.ts').replace("robots: page.noindex || page.published === false ? 'noindex' : undefined", "robots: 'noindex, nofollow, noarchive'"))
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])
const assets = ['img', 'fonts', 'home', 'tariffs']
function transform(s) {
  // Exported tariff HTML repeats CDN font faces; the identical font families/weights
  // already exist in the site's local fonts.css and fonts-google.css.
  s = s.replace(/@font-face\{[^{}]*cdn\.jsdelivr\.net[^{}]*\}/g, '')
  // Runtime asset literals and CSS URLs, including JSON-escaped exported HTML.
  s = s.replace(/(^|["'`(\s]|\\")\/(img|fonts|home|tariffs)\//gm, (_, lead, dir) => lead + base + dir + '/')
  s = s.replace(/(["'`=])https?:\/\/(?:www\.)?popovichfit\.ru(?=\/)/g, '$1') // только значения атрибутов и строк, текст договоров не трогать
  s = s.replace(/https?:\/\/[^\s"'<>\\]*(?:checkout|cloudpayments)[^\s"'<>\\]*/gi, '#preview-disabled-payment')
  // Only HTML href attributes: Vue Router's to/path values must remain unprefixed.
  s = s.replace(/(href=\\?["'])\/(?!\/|popovichfit-preview\/)/g, '$1' + base)
  return s
}
for (const file of walk(path.join(work, 'app'))) if (/\.(vue|ts|js|css|html|json)$/.test(file)) fs.writeFileSync(file, transform(fs.readFileSync(file, 'utf8')))
// Raw links use router.push; strip deployment base before handing them to Vue Router.
write('app/utils/pfh.ts', read('app/utils/pfh.ts').replace('go(u.pathname + u.search + u.hash)', `go((u.pathname.startsWith('${base}') ? '/' + u.pathname.slice(${base.length}) : u.pathname) + u.search + u.hash)`))
for (const f of ['app/pages/[...tilda].vue', 'app/components/home/PfhCookie.vue']) write(f, read(f).replace(/'\/api\/tilda\/([^']*)'/g, (_, tail) => `(import.meta.server ? '/api/tilda/${tail}' : '${base}preview-data/${tail}')`))
// Only whitelisted data plus the common cookie block may enter public JSON.
for (const [f, p] of Object.entries(chosen)) if (!p.custom) {
  const json = f.replace('.html', '.json'); write('public/preview-data/' + json, read('app/data/tilda/' + json))
}
const cookie = JSON.parse(read('app/data/tilda/page36666832.json'))
cookie.blocks = cookie.blocks.filter(b => b.id === 'rec2019524321')
write('app/data/tilda/page36666832.json', JSON.stringify(cookie))
write('public/preview-data/page36666832.json', JSON.stringify(cookie))
for (const name of ['middleware', 'routes', 'utils']) fs.rmSync(path.join(work, 'server', name), { recursive: true, force: true })
for (const name of fs.readdirSync(path.join(work, 'server/api'))) if (name !== 'tilda') fs.rmSync(path.join(work, 'server/api', name), {recursive:true,force:true})
// Hard browser policy is effective even before hydration or with JavaScript disabled.
const csp = "default-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self'; frame-src https:; media-src 'self' blob: https:; form-action 'none'; object-src 'none'; base-uri 'self'"
const guard = `(()=>{const msg=()=>{let n=document.getElementById('preview-notice');if(!n){n=document.createElement('div');n.id='preview-notice';n.style='position:fixed;bottom:16px;left:16px;right:16px;z-index:2147483647;background:#fff;color:#222;padding:16px;border:1px solid #888;border-radius:12px';n.onclick=()=>n.remove();document.body.append(n)}n.textContent='Демонстрационное превью: отправка и оплата отключены. Нажмите, чтобы закрыть.'};window.addEventListener('submit',e=>{if(e.target?.getAttribute?.('method')==='dialog')return;e.preventDefault();e.stopImmediatePropagation();msg()},true);window.addEventListener('click',e=>{const a=e.target.closest?.('a');if(a&&/checkout|cloudpayments|preview-disabled-payment/i.test(a.getAttribute('href')||'')){e.preventDefault();e.stopImmediatePropagation();msg()}},true);const orig=window.fetch;window.fetch=(i,o={})=>{if(!['GET','HEAD'].includes((o.method||i?.method||'GET').toUpperCase())){msg();return Promise.reject(new Error('Preview: sending disabled'))}return orig(i,o)}})();`
write('public/preview-policy.js', guard)
write('nuxt.config.ts', `import tailwindcss from '@tailwindcss/vite'\nimport { fileURLToPath } from 'node:url'\nexport default defineNuxtConfig({compatibilityDate:'2026-09-01',devtools:{enabled:false},components:[{path:'~/components',pathPrefix:false}],css:['~/assets/css/main.css'],vite:{plugins:[tailwindcss()]},app:{baseURL:${JSON.stringify(base)},head:{htmlAttrs:{lang:'ru'},meta:[{name:'robots',content:'noindex, nofollow, noarchive'},{'http-equiv':'Content-Security-Policy',content:${JSON.stringify(csp)}}],script:[{src:'${base}preview-policy.js',tagPosition:'head'},{innerHTML:"document.documentElement.classList.add('pf-wd');if(innerWidth<1200)document.documentElement.classList.add('pf-nomob')"}],link:[{rel:'icon',href:'${base}favicon.ico'}]}},runtimeConfig:{public:{siteUrl:'https://elenasamanchuk.github.io/popovichfit-preview',apiBase:'',previewMode:true,metrikaId:'',vkPixelId:'',cloudpaymentsPublicId:''}},routeRules:{'/api/**':{prerender:false}},nitro:{prerender:{crawlLinks:false,routes:${JSON.stringify(routes)},failOnError:true},serverAssets:[{baseName:'tilda',dir:fileURLToPath(new URL('./app/data/tilda',import.meta.url))}]}})\n`)
// Do not inherit NUXT_*, payment credentials, npm lifecycle scripts or .env from the working tree.
const env = Object.fromEntries(['PATH', 'HOME', 'TMPDIR', 'LANG'].filter(k => process.env[k]).map(k => [k, process.env[k]]))
run(process.execPath, ['node_modules/nuxt/bin/nuxt.mjs', 'generate'], { cwd: work, env: { ...env, NODE_ENV: 'production', NUXT_TELEMETRY_DISABLED: '1' } })
const { packagePreview } = await import('./package-pages-preview.mjs')
packagePreview(work, output)
