# PopovichFit — релиз безопасного превью для администратора VM

Подготовлено 09.11.2026. Назначение: **существующая preview-VM `146.185.241.179`**, `/var/www/popovichfit/current`, systemd `popovichfit`, Nitro на `127.0.0.1:3100`. Боевой `popovichfit.ru`, DNS и ЛК не переключать. Это инструкция для последующего выполнения администратором после приёмки Еленой, а не свидетельство выполненного деплоя.

Сверено локально: `agent-setup/docs/ADMIN.md` (§4.3, §5.3), `deploy/popovichfit.nginx.conf`, `deploy/popovichfit.service`, `nuxt.config.ts`, `app/data/sales.ts`, `scripts/postgenerate.mjs`. Состояние VM в ADMIN.md историческое; текущие конфиги и предыдущий релиз администратор устанавливает на месте. За образец передачи взят `sistemayasnosti-site/deploy/ADMIN-PREVIEW.md`; здесь нужен **гибрид**, не только статика.

## Что передать

- Каталог пакета: `popovichfit-<RELEASE_ID>.tar.gz`, одноимённый `.sha256`, `CONTENTS.txt`, `RELEASE.txt`, эта инструкция
- Результат ретеста именно упакованной сборки, дату/ID релиза и подтверждение Елены на установку preview
- Перечень принятых ограничений, страницы для просмотра и контакт ответственного за решение об откате

Секреты, `.env`, `.data`, заявки, исходники и локальный `node_modules` проекта в пакет не входят. Зависимости внутри `server/node_modules` нужны Nitro и входят. Архив распаковывается непосредственно в каталог релиза: `server/`, `public/`, `redirects.map`, при наличии `nitro.json`; дополнительного уровня `.output/` нет. Node уже установлен на VM (по справочнику Node 22); npm install и сборка на VM не нужны. Нативные зависимости, если появятся, должны быть собраны для Linux/архитектуры VM, а не macOS.

## Упаковка после ретеста — выполняет Елена

Собрать гибрид с режимом просмотра, при закрытых продажах. Файл окружения для сборки пустой. Во время упаковки `.output` должен оставаться стабильным.

```bash
cd /Users/elena/Projects/popovichfit-site
POPOVICHFIT_PREVIEW=1 node_modules/.bin/nuxt build --dotenv /dev/null
node scripts/postgenerate.mjs
bash deploy/package-admin-preview.sh .output ../popovichfit-admin-packages 20261109-preview-01
cd ../popovichfit-admin-packages/popovichfit-20261109-preview-01
shasum -a 256 -c popovichfit-20261109-preview-01.tar.gz.sha256
```

Для следующей версии выбрать новый ID. Скрипт не пересобирает сайт, не меняет `.output`, не выполняет HTTP/SSH/Git, не отправляет формы и не перезаписывает существующий пакет. При сбое проверить оставшийся каталог пакета перед повтором. Проверки упаковщика структурные: они не заменяют ретест noindex, Nitro, клиентских интеграций и закрытых продаж. Отсутствие `.env` не доказывает отсутствие секретов, ошибочно встроенных в JS: разрешена только сборка, подготовленная без производственных секретов.

## Условия безопасного preview

**Обновление nginx нужно:** в локальном `popovichfit.nginx.conf` отсутствует общий `X-Robots-Tag`, API доступен для записи. Одной замены `current` недостаточно. Фактический серверный конфиг может отличаться; править его точечно с сохранением HTTP/HTTPS, сертификатов и существующих настроек. Не копировать локальный конфиг целиком: в нём нет действующего HTTPS-блока.

До открытия релиза для просмотра администратор добавляет в оба обслуживающих preview server-блока (HTTP и HTTPS):

```nginx
add_header X-Robots-Tag "noindex, nofollow, noarchive" always;
# Просмотр без заявок, заказов и платежных callback:
if ($request_method !~ ^(GET|HEAD)$) { return 405; }

location = /robots.txt {
    default_type text/plain;
    return 200 "User-agent: *\nDisallow: /\n";
}
```

В **каждом location с собственным `add_header`** повторить `add_header X-Robots-Tag "noindex, nofollow, noarchive" always;`: в имеющемся конфиге это `/_nuxt/` и regex статики. Иначе наследование заголовка пропадёт. Проверить также ошибки и редиректы. `robots.txt` — дополнительная мера; noindex проверяется по HTTP-заголовку, а не только по HTML/meta. Это не парольная защита.

Не открывать Nitro наружу: администратор проверяет без вывода секретов `HOST=127.0.0.1`, `PORT=3100` в серверном окружении и отсутствие конфликтующих `NITRO_HOST`/`NITRO_PORT`. В service эти значения не заданы — он читает `/var/www/popovichfit/.env`. Данные окружения не присылать в отчёте. `NUXT_PREVIEW_TOKEN` относится к скрытым страницам и не включает общий безопасный preview.

Режим просмотра убирает Sender, добавляет robots noindex, возвращает локальную конфигурацию тарифов и отклоняет изменяющие запросы в Nitro. Метрика и VK включаются на боевых доменах. В nginx сохраняется дополнительный запрет изменяющих запросов. Для проверки Nitro используйте POST на вымышленный путь `/__qa-preview-readonly` и ожидайте 405, без заявок и заказов.

## Приём архива на VM и подготовка отката

Команды ниже администратор выполняет на согласованной VM, в отдельной bash-сессии. Сначала согласовать окно короткого перезапуска. Архив уже должен быть доставлен разрешённым способом; здесь загрузка не автоматизирована.

```bash
set -euo pipefail
BASE=/var/www/popovichfit
REL=20261109-preview-01
# Перейти в каталог доставленного пакета перед следующими командами.
sha256sum -c "popovichfit-$REL.tar.gz.sha256"
tar -tzf "popovichfit-$REL.tar.gz"
test -L "$BASE/current"
PREVIOUS=$(readlink -f "$BASE/current")
test -f "$PREVIOUS/server/index.mjs"
test ! -e "$BASE/releases/$REL"
sudo mkdir "$BASE/releases/$REL"
sudo tar --no-same-owner -xzf "popovichfit-$REL.tar.gz" -C "$BASE/releases/$REL"
test -s "$BASE/releases/$REL/server/index.mjs"
test -s "$BASE/releases/$REL/public/index.html"
test -s "$BASE/releases/$REL/redirects.map"
test ! -e "$BASE/releases/$REL/public/sales-open"
sudo ln -s "$BASE/.data" "$BASE/releases/$REL/.data"
sudo chown -R www-data:www-data "$BASE/releases/$REL"
```

Перед распаковкой сверить список архива с `CONTENTS.txt`: никаких абсолютных путей, `..`, внешних ссылок, `.env` и `.data`. SHA-256 должен совпасть с переданным Еленой значением; сумма рядом с подменённым архивом сама по себе не удостоверяет источник.

Сохранить вне webroot с доступом только администратору: путь `PREVIOUS`, фактический конфиг `/etc/nginx/sites-available/popovichfit` (и все затрагиваемые include), unit/drop-in сервиса, резервную копию серверных `.env` и `.data`. Эти копии не входят в пакет и не отправляются Елене. Старые releases не удалять. Если `current` не ссылка, предыдущий релиз отсутствует или неизвестно, как восстановить конфиг, остановиться до переключения.

## Подключение и включение

1. Внести preview-защиту nginx, проверить `sudo nginx -t`, затем `sudo systemctl reload nginx`. Сначала проверить защиту на прежнем релизе. Сохранить этот рабочий защищённый конфиг как конфиг отката preview. Обновление unit обычно не нужно; если менялся unit/drop-in — выполнить `daemon-reload`. Изменение окружения требует restart.
2. Перед переключением проверить новый `redirects.map`: сделать временную копию **вне активных include nginx**, подставить в ней новый путь карты вместо `current/redirects.map` и проверить конфигурацию через `nginx -t -c <полный-временный-конфиг>`. Ошибка карты должна остановить выпуск до смены ссылки.
3. Переключить ссылку атомарно и перезапустить Nitro. Ниже переменные из предыдущей bash-сессии; если сессия сменилась — восстановить их из записи администратора.

```bash
test ! -e "$BASE/.current-$REL"
test ! -L "$BASE/.current-$REL"
sudo ln -s "$BASE/releases/$REL" "$BASE/.current-$REL"
sudo mv -Tf "$BASE/.current-$REL" "$BASE/current"
sudo systemctl restart popovichfit
sudo systemctl is-active --quiet popovichfit
sudo nginx -t
sudo systemctl reload nginx
```

Reload nginx обязателен даже при неизменном конфиге: `redirects.map` читается при загрузке конфигурации, а не на каждый запрос. Если restart, проверка nginx или smoke не прошли — сразу откат по следующему разделу. Не запускать `deploy.sh`, `server-setup.sh` и **`finalize.sh`**: последний делает POST `/api/lead`; обычный deploy вызывает его и удаляет старые релизы.

## Проверки администратора — без заявок и оплаты

Только GET/HEAD, без POST и без нажатия «Отправить/Оплатить». Сначала локальный backend, затем nginx HTTP и HTTPS. Для текущего самоподписанного сертификата `curl -k` допустим только при проверке известного IP этой VM; это не проверка доверенного TLS.

```bash
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3100/course_correction
curl -sSI http://146.185.241.179/
curl -ksSI https://146.185.241.179/
curl -sS http://146.185.241.179/robots.txt
curl -sSI 'http://146.185.241.179/predcor?r=preview-check&utm_source=preview-check'
curl -sSI 'http://146.185.241.179/predpow?r=preview-check&utm_source=preview-check'
curl -sSI 'http://146.185.241.179/pred?r=preview-check&utm_source=preview-check'
curl -sSI http://146.185.241.179/preview-nonexistent-check
```

Критерии:

- `popovichfit` active, слушает только `127.0.0.1:3100`; нет 502 и циклов перезапуска
- `/`, `/course_correction`, `/course_power`, документы из меню/подвала — 200; неизвестный путь — 404
- Все ответы preview, включая 301/302, 404, `sitemap.xml`, реальный `/_nuxt/*.js` из HTML и изображение — `X-Robots-Tag: noindex, nofollow, noarchive` и по HTTP, и по HTTPS
- `/pred` → 302 `/`, `/predcor` → 302 `/course_correction`, `/predpow` → 302 `/course_power`; query `r/utm` сохраняются. Со слэшем допустим промежуточный 301, затем ожидаемый 302. Якорь не передаётся серверу, его проверяют в браузере
- Закрытая главная соответствует принятой сборке; нет маркера `public/sales-open/index.html`. Само отсутствие маркера не доказывает состояние SSR — проверить редиректы также напрямую на `127.0.0.1:3100`
- Выбранный старый URL из `redirects.map` даёт ожидаемый 301 с query; `/members/login` ведёт на существующий ЛК. Не проходить оплату или регистрацию
- Блокировка изменяющих методов подтверждена чтением активного nginx-конфига; не проверять POST-заявкой. Серверные данные `.data` и настройки интеграций сохраняются
- Проверить просмотр на десктопе и мобильном экране, загрузку ресурсов и отсутствие внешних интеграций согласно переданному ретесту. Не считать открытие одного HTML полной приёмкой

## Откат

Администратор использует **записанный до переключения** абсолютный путь `PREVIOUS`, а не «последний по дате» релиз. Не выполнять откат вслепую в новой сессии с пустыми переменными.

```bash
set -euo pipefail
: "${BASE:?}" "${PREVIOUS:?}" "${REL:?}"
test -f "$PREVIOUS/server/index.mjs"
test ! -e "$BASE/.rollback-$REL"
test ! -L "$BASE/.rollback-$REL"
sudo ln -s "$PREVIOUS" "$BASE/.rollback-$REL"
sudo mv -Tf "$BASE/.rollback-$REL" "$BASE/current"
sudo systemctl restart popovichfit
sudo systemctl is-active --quiet popovichfit
sudo nginx -t
sudo systemctl reload nginx
```

При проблеме nginx восстановить сохранённый **рабочий конфиг с защитой preview**, проверить `nginx -t`, затем reload. Если доступна только исходная копия без защиты, не открывать preview до повторного применения noindex и запрета записи. Если менялись unit/окружение, вернуть их резервные копии, `daemon-reload` при изменении unit и restart. Повторить GET/HEAD-проверки. `.data` не откатывать автоматически: это общие данные, восстановление из копии может стереть новые записи. Не удалять неудачный релиз до разбора.

## Статус подготовки

Фактические результаты ретеста и ссылка на пакет ведутся в `docs/HANDOFF.md`. После установки администратор фиксирует ID активного релиза, результат `nginx -t`, ответы HTTP и путь отката.

Локальная проверка упаковщика 09.11.2026: `bash -n` — PASS; на временной фикстуре проверены состав tar, совпадение SHA-256 и неизменность исходных файлов; отклонены повторный ID, открытые продажи, `.env`, внешняя символьная ссылка, неполная сборка и некорректный ID. Фикстура удалена автоматически. Это проверка упаковщика, не ретест сайта и не проверка nginx на VM.
