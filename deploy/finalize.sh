#!/usr/bin/env bash
# Переключение уже загруженного релиза на сервере (выполняется НА СЕРВЕРЕ, можно через ssh … 'bash -s' < deploy/finalize.sh):
# симлинк current → последний релиз, .data, права, HTTPS (самоподписанный сертификат на IP до переноса домена),
# перезапуск сервиса popovichfit и nginx, проверка. Идемпотентно — можно запускать повторно.
set -e
DIR=/var/www/popovichfit
REL="${REL:-$(ls -1 $DIR/releases | sort | tail -1)}"
[ -d "$DIR/releases/$REL/server" ] || { echo "нет релиза $REL"; exit 1; }
sudo ln -sfn "$DIR/releases/$REL" "$DIR/current"
sudo mkdir -p "$DIR/.data"; sudo ln -sfn "$DIR/.data" "$DIR/current/.data"
sudo chown -R www-data:www-data "$DIR/releases/$REL" "$DIR/.data"
# HTTPS по IP: самоподписанный сертификат (браузер предупредит; после DNS — certbot)
sudo mkdir -p /etc/nginx/ssl
[ -f /etc/nginx/ssl/popovichfit.crt ] || sudo openssl req -x509 -nodes -newkey rsa:2048 -days 825 \
  -keyout /etc/nginx/ssl/popovichfit.key -out /etc/nginx/ssl/popovichfit.crt \
  -subj "/CN=146.185.241.179" -addext "subjectAltName=IP:146.185.241.179" >/dev/null 2>&1
grep -q "listen 443" /etc/nginx/sites-available/popovichfit || sudo sed -i \
  's#listen \[::\]:80 default_server;#listen [::]:80 default_server;\n    listen 443 ssl default_server;\n    listen [::]:443 ssl default_server;\n    ssl_certificate /etc/nginx/ssl/popovichfit.crt;\n    ssl_certificate_key /etc/nginx/ssl/popovichfit.key;#' \
  /etc/nginx/sites-available/popovichfit
sudo systemctl restart popovichfit
sleep 2; echo "сервис: $(systemctl is-active popovichfit)"
sudo nginx -t 2>&1 | tail -1
sudo systemctl reload nginx 2>/dev/null || sudo systemctl restart nginx
echo "страница: $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/course_correction)  api: $(curl -s -o /dev/null -w '%{http_code}' -X POST http://127.0.0.1/api/lead -H 'content-type: application/json' -d '{"form":"check","fields":{"x":"y"}}')"
echo "✓ релиз $REL включён"
