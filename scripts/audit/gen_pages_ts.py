#!/usr/bin/env python3
"""docs/meta.json → app/data/pages.ts (мета всех 220 страниц экспорта)."""
import json, os
meta=json.load(open('docs/meta.json'))
unpublished=set(json.load(open('docs/unpublished.json')).get('urls', []))  # скрытые страницы (docs/unpublished.json)
def q(s): return json.dumps(s, ensure_ascii=False)
lines=["// Сгенерировано scripts/audit/gen_pages_ts.py из docs/meta.json (экспорт Тильды, пересборка scripts/reimport-tilda.sh).",
"// Ключ — имя старого файла. title/description/og — дословно из <head> старой страницы.",
"// ogImageOld — путь картинки в old-site/images; usePageMeta мапит его в /img/og/<файл>.",
"export interface PageMeta {",
"  url: string; slugs: string[]; title: string; description: string; ogTitle: string; ogDescription: string;",
"  ogImageOld: string; noindex: boolean; layout: 'default' | 'bare'; members: boolean",
"  /** false — страница скрыта (не пререндерится, не в sitemap, 404 без ?preview=токен); список — docs/unpublished.json */",
"  published: boolean",
"  /** true — у страницы свой маршрут Nuxt (app/pages/*.vue): универсальный [...tilda].vue её не рендерит; мета остаётся для usePageMeta/sitemap/пререндера (scripts/audit/export-config.json → customRoutes) */",
"  custom: boolean",
"}",
"export const pages: Record<string, PageMeta> = {"]
for f,v in sorted(meta.items(), key=lambda kv: kv[1]['url']):
    layout='default' if (v['header'] or v['footer']) else 'bare'
    lines.append(f"  {q(f)}: {{ url: {q(v['url'])}, slugs: {q(v['slugs'])}, title: {q(v['title'])}, description: {q(v['description'])}, ogTitle: {q(v['ogTitle'])}, ogDescription: {q(v['ogDescription'])}, ogImageOld: {q(v['ogImage'])}, noindex: {str(v['noindex']).lower()}, layout: {q(layout)}, members: {str(v['members']).lower()}, published: {str(v['url'] not in unpublished).lower()}, custom: {str(bool(v.get('customRoute'))).lower()} }},")
lines.append("}")
lines.append("")
lines.append("/** Старый файл по URL (без завершающего слэша). */")
lines.append("export const pageByUrl: Record<string, string> = Object.fromEntries(Object.entries(pages).flatMap(([f, p]) => [[p.url, f], ...p.slugs.slice(1).map((s) => ['/' + s, f])]))")
open('app/data/pages.ts','w',encoding='utf-8').write('\n'.join(lines)+'\n')
print('pages.ts written', len(meta))
