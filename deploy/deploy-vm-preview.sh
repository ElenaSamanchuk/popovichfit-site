#!/usr/bin/env bash
# Выкладка пакета work/popovichfit-<REL> на общую VM (popovichfit.ru, раньше preview.popovichfit.ru) без ИИ.
# Запуск: bash deploy/deploy-vm-preview.sh [--dry-run] 20261110-prod-08
# Меняет только /var/www/popovichfit: новый releases/<REL>, ссылку current, сервис popovichfit, deployment.json.
# nginx перезагружает только если изменился redirects.map. При сбое возвращает прежний релиз.
# Сеть: через Planet VPN новые SSH-соединения к VM виснут (banner timeout), поэтому подключение идёт напрямую через IFACE (по умолчанию en0).
set -euo pipefail

DRY=0
if [[ "${1:-}" == "--dry-run" ]]; then DRY=1; shift; fi
REL="${1:?Укажите ID релиза, например 20261110-prod-08}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PKG="$ROOT/work/popovichfit-$REL"
TAR="$PKG/popovichfit-$REL.tar.gz"
KEY="${KEY:-$HOME/Downloads/ubuntu-STD3-8-16-200GB-M9I9y4Dw.pem}"
IFACE="${IFACE:-en0}"
SERVER_IP=212.233.93.50
# с 12.11.2026 боевой домен на этой VM, preview.popovichfit.ru отвечает 301 на него — проверяем боевой
SITE="${SITE:-popovichfit.ru}"
NEIGHBORS=(kochfit.ru preview.medvediva.ru medvediva.ru medvediva.online medvediva.kg preview.kineziofitness.online preview.sistemayasnosti.com)

[[ -f "$TAR" ]] || { echo "ОШИБКА: нет архива $TAR" >&2; exit 2; }
[[ -f "$KEY" ]] || { echo "ОШИБКА: нет файла ключа" >&2; exit 2; }
(cd "$PKG" && shasum -a 256 -c "popovichfit-$REL.tar.gz.sha256" >/dev/null)
SHA="$(cut -d' ' -f1 "$TAR.sha256")"
BIND="$(ipconfig getifaddr "$IFACE")"

CONF="$(mktemp)"
cat > "$CONF" <<EOF
Host vm50
  HostName $SERVER_IP
  User ubuntu
  IdentityFile $KEY
  IdentitiesOnly yes
  BindAddress $BIND
  ConnectTimeout 30
  ServerAliveInterval 15
  BatchMode yes
  ControlMaster auto
  ControlPath /tmp/pfdeploy-%C
  ControlPersist 30m
EOF
cleanup() { ssh -F "$CONF" -O exit vm50 >/dev/null 2>&1 || true; rm -f "$CONF"; }
trap cleanup EXIT

status() { curl -sS -m 25 -o /dev/null -w '%{http_code}' "https://$1/" 2>/dev/null || echo 000; }

opened=0
for i in 1 2 3 4 5 6; do
  if ssh -F "$CONF" -MNf vm50 2>/dev/null && ssh -F "$CONF" -O check vm50 2>/dev/null; then opened=1; break; fi
  echo "SSH: попытка $i не удалась, повтор через 15 с" >&2; sleep 15
done
[[ "$opened" == 1 ]] || { echo "ОШИБКА: SSH не открылся" >&2; exit 255; }

CONFS='sudo cat /etc/nginx/sites-enabled/* | sha256sum | cut -c1-16'
CONF_BEFORE="$(ssh -F "$CONF" vm50 "$CONFS")"
declare -a BEFORE=()
for h in "${NEIGHBORS[@]}"; do BEFORE+=("$(status "$h")"); done
echo "Соседи до выкладки: ${NEIGHBORS[*]} -> ${BEFORE[*]}"
echo "Сейчас на сервере: $(ssh -F "$CONF" vm50 'readlink /var/www/popovichfit/current')"
ssh -F "$CONF" vm50 "sudo nginx -t 2>&1 | tail -1; test ! -e /var/www/popovichfit/releases/$REL && echo 'папки релиза ещё нет'; df -h / | tail -1"

if [[ "$DRY" == 1 ]]; then echo "Проверка без изменений пройдена, релиз $REL, sha $SHA"; exit 0; fi

echo "Загрузка архива"
rsync -a --partial -e "ssh -F $CONF" "$TAR" "vm50:/tmp/pf-$REL.tar.gz"

ssh -F "$CONF" vm50 "bash -s -- '$REL' '$SHA'" <<'REMOTE'
set -euo pipefail
REL="$1"; SHA="$2"
B=/var/www/popovichfit; D="$B/releases/$REL"; T="/tmp/pf-$REL.tar.gz"; DEP=nodemailer-10.5.0
echo "$SHA  $T" | sha256sum -c - >/dev/null
test -L "$B/current"
test ! -e "$D"
PREV="$(readlink -f "$B/current")"
test -f "$PREV/server/index.mjs"
sudo mkdir "$D"
sudo tar -xzf "$T" -C "$D" --no-same-owner
sudo test -f "$D/server/index.mjs"
sudo test -s "$D/redirects.map"
sudo test ! -e "$D/public/sales-open"
sudo ln -s "$B/.data" "$D/.data"
sudo ln -s "$B/runtime-deps/$DEP/node_modules/nodemailer" "$D/server/node_modules/nodemailer"
RELOAD=0
sudo cmp -s "$D/redirects.map" "$PREV/redirects.map" || RELOAD=1
if [[ "$RELOAD" == 1 ]]; then sudo cp "$D/redirects.map" /tmp/pf-redirects.check; sudo nginx -t; fi

switch_to() {
  sudo ln -sfn "$1" "$B/.current-switch"
  sudo mv -Tf "$B/.current-switch" "$B/current"
  sudo systemctl restart popovichfit
}
alive() {
  for i in $(seq 1 30); do
    [[ "$(curl -s -m 5 -o /dev/null -w '%{http_code}' http://127.0.0.1:3100/)" == 200 ]] && return 0
    sleep 1
  done
  return 1
}
switch_to "$D"
ok=1
alive || ok=0
for p in / /brief /course_correction /support; do
  [[ "$(curl -s -m 10 -o /dev/null -w '%{http_code}' "http://127.0.0.1:3100$p")" == 200 ]] || { echo "Сбой страницы $p"; ok=0; }
done
systemctl is-active --quiet popovichfit || ok=0
if [[ "$ok" != 1 ]]; then
  echo "ОШИБКА: возвращаю $PREV" >&2
  switch_to "$PREV"; alive || true
  exit 1
fi
if [[ "$RELOAD" == 1 ]]; then sudo nginx -t && sudo systemctl reload nginx; echo "nginx перезагружен: изменился redirects.map"; else echo "redirects.map без изменений, nginx не трогали"; fi
sudo python3 - "$B/deployment.json" "$REL" "$SHA" "$(basename "$PREV")" <<'PY'
import json, sys, datetime
p, rel, sha, prev = sys.argv[1:]
d = json.load(open(p))
d.update(release=rel, sha256=sha, previous_release=prev, verified_at=datetime.datetime.now(datetime.timezone.utc).isoformat())
json.dump(d, open(p, 'w'), ensure_ascii=False, indent=2)
PY
rm -f "$T"
echo "$PREV" > "/tmp/pf-previous-$REL"
echo "Активен релиз $REL, прежний $(basename "$PREV")"
REMOTE

fail=0
sleep 2
[[ "$(status "$SITE")" == 200 ]] || { echo "ОШИБКА: $SITE не отвечает 200" >&2; fail=1; }
curl -sS -m 25 "https://$SITE/brief" | grep -q 'tz-form__title' || { echo "ОШИБКА: на /brief нет новой формы" >&2; fail=1; }
i=0
for h in "${NEIGHBORS[@]}"; do
  now="$(status "$h")"
  [[ "$now" == "${BEFORE[$i]}" ]] || { echo "ОШИБКА: сосед $h был ${BEFORE[$i]}, стал $now" >&2; fail=1; }
  i=$((i+1))
done
[[ "$(ssh -F "$CONF" vm50 "$CONFS")" == "$CONF_BEFORE" ]] || { echo "ОШИБКА: изменились конфиги nginx" >&2; fail=1; }
if [[ "$fail" != 0 ]]; then
  echo "Проверка не прошла. Откат: bash на VM: прежний релиз записан в /tmp/pf-previous-$REL" >&2
  exit 1
fi
echo "Готово: $REL на https://$SITE, соседи без изменений, конфиги nginx те же"
