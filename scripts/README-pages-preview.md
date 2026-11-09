# GitHub Pages preview: PopovichFit

Изолированная сборка под `/popovichfit-preview/`, только локально, без установки пакетов, сети, публикации и изменения общей `.output` или sales flag.

```sh
node scripts/build-pages-preview.mjs /tmp/popovichfit-pages-preview-NEW
PLAYWRIGHT_BROWSERS_PATH="$HOME/Library/Caches/ms-playwright" node scripts/test-pages-preview.mjs /tmp/popovichfit-pages-preview-NEW /tmp/popovichfit-pages-preview-test.json
```

Выходная папка должна быть новой и находиться вне рабочего проекта. Скрипт печатает `WORK` (временная сборочная копия) и `OUTPUT` (только публикуемая статика). Зависимости берутся реальною APFS-копией `cp -cR node_modules`; `.env`, `.data`, `.git`, docs, старые сборки и кеш `.nuxt` не копируются. Из окружения допускаются только PATH/HOME/TMPDIR/LANG. Nuxt запускается напрямую, без lifecycle-команд проекта.

Если сборка завершилась, а упаковка прервалась, можно продолжить без новой сборки:

```sh
node scripts/package-pages-preview.mjs /absolute/WORK /tmp/popovichfit-pages-preview-NEW
```

Для GitHub нужен **только OUTPUT**, не WORK. Серверная сборка для VM — отдельная работа владельца основной задачи. Скрипты ничего не публикуют.

## Публикация после локального теста

Репозиторий превью: [ElenaSamanchuk/popovichfit-preview](https://github.com/ElenaSamanchuk/popovichfit-preview). Скопировать содержимое проверенного OUTPUT в отдельный checkout ветки `main`, сохранив `.git/` и `.github/workflows/pages.yml`. Workflow выкладывает готовую статику из корня репозитория. После завершения запуска открыть главную, документы и страницы курсов по адресу [GitHub Pages](https://elenasamanchuk.github.io/popovichfit-preview/), проверить меню на 390 px и сохранение UTM при переходе.

## Состав и защита

Разрешённый список задан в build-pages-preview.mjs, проверяется по актуальным `pages.ts` и `docs/unpublished.json`. Sitemap не используется целиком: в нём есть старые уроки и тесты. В текущем снимке 31 страница:

- Главная, `/about`, `/results`, `/community`, `/media` и 4 статьи `media_*`.
- `/course_correction`, `/course_power`, `/course_prod`, `/course_corprod`, `/course_powprod`.
- `/inventory`, `/sertif`, `/promo`, `/taplink`.
- `/oferta`, `/part_oferta`, `/privacy`, `/data-consent`, `/consent`, `/doc_l`.
- Поддержка приложения/ЛК: `/support`, `/delete`, `/m`, `/nutric-lk`, `/analys-lk`, `/menu7-lk`, `/profile-lk`.

`/course_prod` и `/profile-lk` — явные функциональные исключения из sitemap из-за исходного noindex; published=false и entries в unpublished.json исключаются всегда. Изменение списка требует пересборки.

`/speakers`, `/pred*`, `/open`, `/close`, тесты, старые уроки, неопубликованные и `pageNNN.html` не выдаются. Маршруты удаляются **до компиляции**; метаданные универсального маршрута ограничены allowlist. Дизайнерские speakers HTML/CSS и каталог его изображений удаляются в копии до build. HTML, JSON и JS проверяются на маркеры черновика. Общие CSS-классы публичных карточек сохраняются.

Публикуются только 31 HTML + payload, клиентские `_nuxt`, выбранные статические данные Tilda и ресурсы. Для общего cookie-баннера из `page36666832.json` берётся только один блок, не полная страница. Изображения/шрифты/home/tariffs прореживаются по упоминаниям имён файлов в опубликованных HTML/CSS/JS/JSON. Общие ресурсы, упомянутые общим CSS, сохраняются. `.map`, `.env`, серверный код и hidden JSON не экспортируются. Публичный manifest содержит разрешённые маршруты и счётчик исключений, без списка исключённых путей.

Все HTML имеют noindex/nofollow/noarchive, robots запрещает индексацию. Это не механизм приватности: приватный контент исключается из артефакта. Статическая 404 не делает SPA-fallback к скрытым страницам. `.nojekyll` сохраняет доступ к `_nuxt`.

Метрика/VK и Sender отключены. CSP запрещает отправку форм и внешние API/скрипты; guard до гидрации блокирует submit и POST fetch с понятным уведомлением. Checkout-ссылки нейтрализуются только в временной копии, обычные внешние ссылки остаются. Реальные формы, оплаты и внешние сайты тест не открывает. Дубли CDN-шрифтов в тарифах удалены: используются существующие локальные семейства.

## Проверка

Тест использует установленный Playwright и те же базовые селекторы/проверки здоровья изображений, что существующий verify-priority.mjs. Локальный HTTP-сервер обслуживает только точный подпуть, редиректит каталоги на trailing slash и отдаёт 404 без SPA-fallback. Внешние запросы браузера заблокированы.

Проверяются все маршруты HTTP/noindex/CSP, отсутствие исключённых URL, 8 репрезентативных страниц × desktop 1440 и мобильная эмуляция 390×844 DPR3, JS-гидрация, консоль/локальная сеть, шапка/подвал/картинки, мобильное меню, настоящий SPA-переход без перезагрузки, сохранение UTM и блокировка отправки. JSON и два скрина — рядом с указанным отчётом, вне публикуемой папки.

Это проверка упаковки, не полная визуальная приёмка сайта. Реальные телефоны, production, платёжные системы и GitHub Pages в этом прогоне не проверяются.

## Фактический результат 09.11.2026

- Готовый проверенный каталог: `/tmp/popovichfit-pages-preview-ready` (74 МБ), base `/popovichfit-preview/`.
- Изолированный WORK: `/var/folders/gm/78dvp8cx5s11gt2n0hjv44th0000gn/T/popovichfit-pages-preview-itnmfx`.
- Лог сборки: `/tmp/popovichfit-pages-preview-build-final.log`. Последняя сборка успешно сгенерировала HTML; первоначальная упаковка остановилась из-за слишком широкого маркера общего CSS. Маркер уточнён, упаковка повторена отдельной командой, финальный пакет проверен полностью.
- Проверка: `node scripts/test-pages-preview.mjs /tmp/popovichfit-pages-preview-ready /tmp/popovichfit-pages-preview-final-test.json` с PLAYWRIGHT_BROWSERS_PATH из команды выше. 31/31 маршрутов, 16/16 браузерных сценариев, errors=[]; меню/SPA/UTM и запрет POST прошли на 1440 и 390. Скрины `/tmp/popovichfit-pages-preview-final-test-{1440,390}.png` просмотрены.
- Удалены 1057 неиспользуемых ресурсов. Публичный manifest содержит только счётчик 196 исключённых исходных маршрутов. Разметка/картинки speakers и закрытые страницы продаж отсутствуют; тестовые/скрытые маршруты не экспортируются. `/taplink` содержит 4 и 14 декабря.
- Общие исходники приложения, sales flag, `.output`, HANDOFF/PROGRESS не изменялись: разрешённая область этой подзадачи — только новые `scripts/*pages-preview*`. Основному владельцу задачи передать результат в существующий HANDOFF/PROGRESS. Публикации, удалённых запросов, commit/push и платных инструментов не было.
