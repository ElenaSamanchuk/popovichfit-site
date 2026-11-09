#!/usr/bin/env bash
# Замена экспорта Тильды новым и пересборка данных страниц (без ИИ и токенов).
#   scripts/reimport-tilda.sh <путь-к-zip> [--build] [--dry-run]
# Шаги: проверка архива → старый old-site целиком в ../popovichfit-site-archives/old-site-<дата> → распаковка нового на его место
# (+ перенос своих файлов, которых нет в экспорте: _fonts-tildacdn) → сверка авторского кода → npm run pages:sync
# (meta, pages.ts, данные страниц, CSS блоков, картинки только используемые, og) → [--build: npm run build + проверки].
# При любой ошибке завершается с ненулевым кодом. Ничего не коммитит, не публикует и не выкладывает на сервер.
# Выкладка (deploy/deploy.sh) — отдельно; старые хешированные ассеты /_nuxt/* при выкладке не удалять сразу (старые вкладки/кэш ещё на них ссылаются).
set -euo pipefail
ZIP="${1:-}"; shift || true
BUILD=0; DRY=0
for a in "$@"; do case "$a" in --build) BUILD=1;; --dry-run) DRY=1;; *) echo "неизвестный параметр: $a" >&2; exit 2;; esac; done
[ -f "$ZIP" ] || { echo "Использование: $0 <export.zip> [--build] [--dry-run]" >&2; exit 2; }
cd "$(dirname "$0")/.."; ROOT="$PWD"
ARCH_DIR="$ROOT/../popovichfit-site-archives"
unzip -tqq "$ZIP" >/dev/null || { echo "архив повреждён: $ZIP" >&2; exit 1; }
TOP="$(unzip -Z1 "$ZIP" | sed -n 1p | cut -d/ -f1)"
[ "$(unzip -Z1 "$ZIP" | grep -c "^$TOP/htaccess$")" = 1 ] || { echo "в архиве нет $TOP/htaccess — это не экспорт Тильды" >&2; exit 1; }
STAMP="$(date -r "$ROOT/old-site/htaccess" +%Y-%m-%d 2>/dev/null || date +%Y-%m-%d)"
DEST="$ARCH_DIR/old-site-$STAMP"
echo "архив: $ZIP (папка $TOP)"; echo "старый экспорт → $DEST"
[ "$DRY" = 1 ] && { echo "dry-run: ничего не изменено"; exit 0; }
[ -e "$DEST" ] && { echo "уже существует $DEST — укажите другую дату или уберите вручную" >&2; exit 1; }
mkdir -p "$ARCH_DIR"; TMP="$(mktemp -d "$ARCH_DIR/extract-XXXXXX")"
trap 'rm -rf "$TMP"' EXIT
nice -n 15 unzip -q "$ZIP" -d "$TMP"
[ -f "$TMP/$TOP/htaccess" ] || { echo "распаковка не удалась" >&2; exit 1; }
mv "$ROOT/old-site" "$DEST"
mv "$TMP/$TOP" "$ROOT/old-site"
# свои файлы, которых нет в экспорте
[ -d "$DEST/_fonts-tildacdn" ] && cp -R "$DEST/_fonts-tildacdn" "$ROOT/old-site/"
echo "== сверка авторского кода (T123/T131): старый ↔ новый"
python3 -I scripts/audit/new_custom_code.py "$DEST" old-site | tee "$ROOT/scripts/tmp/last-custom-code-diff.txt" | head -40
echo "== страницы без файла в экспорте (адрес в htaccess есть, файла нет — не создаём)"
grep -o 'page[0-9]*\.html' old-site/htaccess | sort -u | while read -r f; do [ -f "old-site/$f" ] || echo "  нет файла: $f"; done  # page41134729/page41134747 (/predcor, /predpow) создаёт pages:sync из sources/pred-2026-11-06
nice -n 15 npm run pages:sync
if [ "$BUILD" = 1 ]; then nice -n 15 npm run build; fi
echo "готово. Дальше: проверить git status, обновить fixups (scripts/audit/fixups.json), PROGRESS."
