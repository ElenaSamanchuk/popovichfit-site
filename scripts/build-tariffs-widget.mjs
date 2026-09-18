#!/usr/bin/env node
/**
 * Виджет тарифов (репозиторий ElenaSamanchuk/popovichfit-tariffs, локально ../popovichfit-tariffs) → нативно в сайт, без iframe:
 *   app/assets/css/tariffs-widget.css   — css/widget.css с префиксом #pf-inline-wrap (шрифты сайта, без @font-face)
 *   app/utils/tariffs-widget.js         — js/widget.js как ES-модуль: initTariffsWidget(config) вместо DOMContentLoaded/fetch
 *   app/data/tariffs-widget/*.json      — config-korrekciya/silovye (резерв; актуальный — /api/tariffs/<course> с GitHub)
 *   public/tariffs/assets/*             — картинки/иконки виджета
 * Запуск после правок в репозитории виджета: node scripts/build-tariffs-widget.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = process.env.PF_TARIFFS_DIR || path.resolve(ROOT, '..', 'popovichfit-tariffs')
const PREFIX = '#pf-inline-wrap'
const ASSET_BASE = '/tariffs/assets/'

const read = (f) => fs.readFileSync(path.join(SRC, f), 'utf8')

// --- CSS: префикс селекторов (как scripts/build-tilda-inline.mjs в репозитории виджета), html/body-правила без префикса
function prefixCss(css) {
  let out = ''; let i = 0
  const block = (from) => { let d = 0; for (let j = from; j < css.length; j++) { if (css[j] === '{') d++; else if (css[j] === '}') { d--; if (d === 0) return j + 1 } } return css.length }
  while (i < css.length) {
    if (css.startsWith('/*', i)) { const e = css.indexOf('*/', i + 2); const end = e === -1 ? css.length : e + 2; out += css.slice(i, end); i = end; continue }
    const ws = /^\s+/.exec(css.slice(i)); if (ws) { out += ws[0]; i += ws[0].length; continue }
    const brace = css.indexOf('{', i); if (brace === -1) { out += css.slice(i); break }
    if (css[i] === '@') {
      const at = css.slice(i, brace).trim(); const end = block(brace)
      if (/^@font-face/.test(at)) { /* шрифты сайта */ } else if (/^@media/.test(at)) out += at + '{' + prefixCss(css.slice(brace + 1, end - 1)) + '}'
      else out += css.slice(i, end)
      i = end; continue
    }
    const sel = css.slice(i, brace).trim(); const end = block(brace); const body = css.slice(brace, end)
    if (!sel || /^(html|body)\b/.test(sel)) out += sel + body
    else out += sel.split(',').map((s) => { s = s.trim(); return !s || s.startsWith(PREFIX) ? s : `${PREFIX} ${s}` }).join(', ') + body
    i = end
  }
  return out
}
let css = read('css/widget.css').replace(/\.\.\/assets\//g, ASSET_BASE)
// :root → обёртка (переменные --pf-*), html/body-правила отдельной страницы виджета → обёртка (фон, шрифт, цвет)
css = css.replace(/:root/g, PREFIX)
css = css.replace(/\* \{ box-sizing: border-box; \}/, `${PREFIX}, ${PREFIX} * { box-sizing: border-box; }`)
css = css.replace(/html, body \{\n[\s\S]*?\n\}/, `${PREFIX} {\n  margin: 0;\n  padding: 0;\n  background: #fff;\n  color: var(--pf-black);\n  font-family: var(--pf-font);\n  overflow-x: hidden;\n  min-height: 0;\n  width: 100%;\n  max-width: 100%;\n  position: relative;\n  isolation: isolate;\n}\n`)
css = css.replace(/\nbody \{ min-height: 0; \}/, '').replace(/\nbody\.pf-embedded \{[^\n]*\}/, '')
css = css.replace(/\nhtml\.pf-embedded,\nhtml\.pf-embedded body,\nhtml\.pf-tilda-scale,\nhtml\.pf-tilda-scale body \{\n[\s\S]*?\n\}/, '')
css = css.replace(/\nhtml\.pf-tilda-scale #pf-root \{ overflow: hidden; \}/, '')
css = prefixCss(css)
// попап виджета поверх фиксированной шапки (z-index 1000) и виджета Sender (2147483000) — как iframe в Тильде (FRAME_Z 2147483001);
// обёртка — свой stacking context (isolation), поэтому поднимаем её целиком. Автоскейл на телефонах (<480px, как Zero Block) — только внутри #pf-root
css += `\nhtml.pf-modal-open #pf-inline-wrap { z-index: 2147483001; }\nhtml.pf-tilda-scale #pf-inline-wrap #pf-root { overflow: hidden; }\n`
fs.mkdirSync(path.join(ROOT, 'app/assets/css'), { recursive: true })
fs.writeFileSync(path.join(ROOT, 'app/assets/css/tariffs-widget.css'), '/* Сгенерировано scripts/build-tariffs-widget.mjs из popovichfit-tariffs/css/widget.css — не править руками */\n' + css)

// --- JS: IIFE со слушателем DOMContentLoaded → модуль с initTariffsWidget(config)
let js = read('js/widget.js')
const boot = js.indexOf('document.addEventListener("DOMContentLoaded", function () {')
if (boot === -1) throw new Error('bootstrap not found in widget.js')
const bootEnd = js.indexOf('\n  });', boot)
js = js.slice(0, boot) + `window.__pfTariffsBoot = function (cfg) {
    if (window.__pfTariffsBound) { applyConfig(cfg); scheduleHeight(); return; }
    window.__pfTariffsBound = true;
    bind();
    applyConfig(cfg);
    scheduleHeight();
    [120, 500, 1200, 2400].forEach(function (ms) { setTimeout(scheduleHeight, ms); });
  };` + js.slice(bootEnd + '\n  });'.length)
js = js.replace(/^\(function \(\) \{/, '/* Сгенерировано scripts/build-tariffs-widget.mjs из popovichfit-tariffs/js/widget.js — не править руками */\nexport function initTariffsWidget(config) {\n  if (!window.__pfTariffsBoot) install();\n  window.__pfTariffsBoot(config);\n}\nfunction install() {')
js = js.replace(/\}\)\(\);\s*$/, '}\n')
if (!/window\.__pfTariffsBoot = function/.test(js)) throw new Error('boot replace failed')
fs.mkdirSync(path.join(ROOT, 'app/utils'), { recursive: true })
fs.writeFileSync(path.join(ROOT, 'app/utils/tariffs-widget.js'), js)

// --- конфиги (assets/… → /tariffs/assets/…) и картинки
const rewrite = (o) => { if (!o || typeof o !== 'object') return; for (const k of Object.keys(o)) { if (typeof o[k] === 'string' && o[k].startsWith('assets/')) o[k] = ASSET_BASE + o[k].slice(7); else if (typeof o[k] === 'object') rewrite(o[k]) } }
fs.mkdirSync(path.join(ROOT, 'app/data/tariffs-widget'), { recursive: true })
for (const c of ['korrekciya', 'silovye']) { const cfg = JSON.parse(read(`config-${c}.json`)); rewrite(cfg); fs.writeFileSync(path.join(ROOT, `app/data/tariffs-widget/config-${c}.json`), JSON.stringify(cfg, null, 1)) }
const outAssets = path.join(ROOT, 'public/tariffs/assets'); fs.mkdirSync(outAssets, { recursive: true })
for (const f of fs.readdirSync(path.join(SRC, 'assets'))) { const p = path.join(SRC, 'assets', f); if (fs.statSync(p).isFile()) fs.copyFileSync(p, path.join(outAssets, f)) }
console.log('tariffs widget built:', { css: css.length, js: js.length, assets: fs.readdirSync(outAssets) })
