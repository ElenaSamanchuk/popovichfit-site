#!/usr/bin/env bash
# Деплой на сервер: локальная сборка → rsync .output → переключение симлинка current → перезапуск сервиса.
#   SERVER=ubuntu@146.185.241.179 KEY=~/Downloads/ubuntu-STD3-8-16-200GB-M9I9y4Dw.pem deploy/deploy.sh
# Первый запуск на сервере: deploy/server-setup.sh (node, nginx, каталоги, сервис). Только переключить загруженный релиз: deploy/finalize.sh.
set -euo pipefail
SERVER="${SERVER:-ubuntu@146.185.241.179}"
KEY="${KEY:-$HOME/Downloads/ubuntu-STD3-8-16-200GB-M9I9y4Dw.pem}"
DIR=/var/www/popovichfit
REL=$(date +%Y%m%d-%H%M%S)
cd "$(dirname "$0")/.."

echo "→ сборка"; NODE_OPTIONS=--max-old-space-size=6144 npm run build
echo "→ загрузка релиза $REL"
ssh -i "$KEY" "$SERVER" "sudo mkdir -p $DIR/releases/$REL && sudo chown -R \$USER $DIR/releases"
# --bwlimit: сервер маленький (2 ГБ), на полной скорости он «замолкает» на десятки минут; --partial — докачка при обрыве
rsync -az --delete --partial --bwlimit=3000 -e "ssh -i $KEY -o ServerAliveInterval=15" .output/ "$SERVER:$DIR/releases/$REL/"
echo "→ переключение релиза"
REL=$REL ssh -i "$KEY" "$SERVER" 'REL='"$REL"' bash -s' < "$(dirname "$0")/finalize.sh"
ssh -i "$KEY" "$SERVER" "ls -dt $DIR/releases/* | tail -n +4 | xargs -r sudo rm -rf"
echo "✓ выкачено: $REL → http://$(echo "$SERVER" | cut -d@ -f2)/"
