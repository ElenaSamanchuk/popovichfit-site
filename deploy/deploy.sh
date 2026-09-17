#!/usr/bin/env bash
# Деплой на сервер: локальная сборка → rsync .output → переключение симлинка current → перезапуск сервиса.
#   SERVER=ubuntu@146.185.241.179 KEY=~/Downloads/ubuntu-STD3-8-16-200GB-M9I9y4Dw.pem deploy/deploy.sh
# Первый запуск на сервере: deploy/server-setup.sh (node, nginx, каталоги, сервис).
set -euo pipefail
SERVER="${SERVER:-ubuntu@146.185.241.179}"
KEY="${KEY:-$HOME/Downloads/ubuntu-STD3-8-16-200GB-M9I9y4Dw.pem}"
DIR=/var/www/popovichfit
REL=$(date +%Y%m%d-%H%M%S)
cd "$(dirname "$0")/.."

echo "→ сборка"; NODE_OPTIONS=--max-old-space-size=6144 npm run build
echo "→ загрузка релиза $REL"
ssh -i "$KEY" "$SERVER" "sudo mkdir -p $DIR/releases/$REL && sudo chown -R \$USER $DIR/releases"
rsync -az --delete -e "ssh -i $KEY" .output/ "$SERVER:$DIR/releases/$REL/"
ssh -i "$KEY" "$SERVER" "set -e; sudo ln -sfn $DIR/releases/$REL $DIR/current; sudo mkdir -p $DIR/.data; sudo ln -sfn $DIR/.data $DIR/current/.data; sudo chown -R www-data:www-data $DIR/releases/$REL $DIR/.data; sudo systemctl restart popovichfit; sudo nginx -t && sudo systemctl reload nginx; ls -dt $DIR/releases/* | tail -n +4 | xargs -r sudo rm -rf"
echo "✓ выкачено: $REL → http://$(echo "$SERVER" | cut -d@ -f2)/"
