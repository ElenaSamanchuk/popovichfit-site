#!/usr/bin/env bash
# Первичная настройка Ubuntu-сервера (выполнять на сервере под sudo): node 22, nginx, каталоги, сервис, .env.
set -euo pipefail
if ! command -v node >/dev/null || [ "$(node -v | cut -c2-3)" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
sudo apt-get install -y nginx rsync
sudo mkdir -p /var/www/popovichfit/releases /var/www/popovichfit/.data
[ -f /var/www/popovichfit/.env ] || sudo cp "$(dirname "$0")/../.env.example" /var/www/popovichfit/.env
sudo cp "$(dirname "$0")/popovichfit.service" /etc/systemd/system/popovichfit.service
sudo cp "$(dirname "$0")/popovichfit.nginx.conf" /etc/nginx/sites-available/popovichfit
sudo ln -sfn /etc/nginx/sites-available/popovichfit /etc/nginx/sites-enabled/popovichfit
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl daemon-reload
sudo systemctl enable popovichfit
echo "✓ сервер подготовлен: заполните /var/www/popovichfit/.env и запустите deploy/deploy.sh с локальной машины"
