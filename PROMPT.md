# Промпт: перенос сайта popovichfit.ru с Тильды в код (Nuxt + Vue + Tailwind)

> Как пользоваться: отдать этот файл целиком агенту (Claude Code / Cursor) в папке `~/Projects/popovichfit-site`. Решения владельца зафиксированы в §0 и §14; по оставшимся открытым вопросам агент работает по «допущению по умолчанию» и помечает такие места в коде комментарием `// TODO(grey-zone-N)`.

## 0. Роль, цель, решения владельца

Ты — senior frontend-инженер (Vue/Nuxt/Tailwind). Задача: сделать **точную рабочую копию** сайта https://popovichfit.ru/ (онлайн фитнес-клуб Натальи Попович) в виде статически генерируемого сайта на собственном коде. Сейчас — **только локально**: полный перенос всех страниц, настройка, проверка на `localhost`. Сервер, домен и DNS — отдельный этап позже (§10–11 оставлены как заготовка, сейчас не делать). После переноса сайт **не должен зависеть от Тильды ни одним запросом** (ни скриптов, ни шрифтов, ни картинок, ни форм, ни статистики).

Критерии успеха, в порядке приоритета:

1. **Полная работоспособность**: все URL, ссылки, якоря, попапы, меню, видео, реферальные параметры, виджет, аналитика работают как на живом сайте.
2. **Точная копия**: посетитель не отличает новый сайт от старого на 1200–1440 px и на телефоне 360–430 px. Тексты — дословно, картинки — те же, шрифты и начертания — те же.
3. **Максимум информации**: переносятся **все** страницы экспорта (220) и вся информация с них, включая legacy-уроки и служебные страницы; ничего не «чистится» по собственному усмотрению — сомнительное помечается в статус-файле, решает владелец.
4. **Адекватный код**: читаемые Vue-компоненты, общая шапка/меню/футер, контент отделён от вёрстки, ни одной строки Tilda runtime, jQuery, `#recNNN`-хаков. Тот, кто откроет репозиторий через год, должен понять, где что менять (цены, даты потоков, ссылки на бот).
5. **Допустимые улучшения** (только они): исправить явные баги вёрстки/адаптива Тильды, оптимизировать картинки/шрифты, убрать мёртвый код. Дизайн, тексты, структуру страниц не переосмысливать.

Личный кабинет https://lk.popovichfit.ru/ (платформа NN99) **не трогаем вообще**: все ссылки на него остаются ровно такими, как в экспорте (включая `…/payments/tariff_<id>/checkout`).

**Решения владельца (Елена, 16.09.2026) — не переспрашивать:**

- **Стек: Vue + Tailwind** (стандарт команды) → Nuxt со статической генерацией, см. §3.
- **Страницы переносим все** — все 220 HTML из экспорта, максимально со всей информацией. Приоритет очерёдности — §2, но в итоге должно быть перенесено всё.
- **Пути сохраняем 1:1** — домен позже переедет на наш сервер, поэтому URL не меняются (`/about`, `/course_correction`, `/media_1_otek`, `/20cor1`, `/pageNNN.html` для страниц без slug). Ничего не переименовывать «для красоты».
- **Ни одной ссылки/запроса на Тильду** (`tilda.cc`, `*.tilda.ws`, `*.tildacdn.com`, `*.tildaapi.com`, `tilda-tools`) — в контенте таких почти нет (только `dns-prefetch ws.tildacdn.com`, логотип Тильды на `404.html`, `tilda-fallback`), но проверять автоматически (§12).
- **Блог/статьи переносим к себе**: «POPOVICH media» (`/media` + 5 статей + `/mif`), «Сообщество» (`/community`, `/spikery`, `/guest_*`, `/popovichlec`, `/trends_23`, `/inspiration`, `/guide_makeup`), лид-магниты `/page01`–`/page04` — как собственные страницы с контентом и картинками в репозитории, не через Тильду/iframe.
- **Виджет поддержки — только Sender** (`senndder.ru`) на всех страницах. Виджет NN99 (`www.nn99.ru/widget.js`) и кнопку amoCRM не переносить.
- **GitHub пока не используем**: `git init` локально, коммиты локально, remote не добавлять, ничего не пушить.
- **Сервер, домен, DNS — позже.** Сейчас: локальная разработка (`npm run dev`) и локальная статическая сборка (`npm run generate` + локальный статический сервер для проверки редиректов/404).

## 1. Исходные данные

| Что | Где |
|---|---|
| Экспорт Тильды (220 HTML, css/, js/, images/, htaccess, robots.txt, sitemap.xml) | `old-site/` — только для чтения, в git не попадает (`.gitignore` уже есть) |
| Шрифты Involve/Manrope, скачанные с Tilda CDN (7 woff) + README с привязкой весов | `old-site/_fonts-tildacdn/` |
| Аудит экспорта (что живое, что legacy, зависимости, поведения) | `docs/TILDA-AUDIT.md` — **прочитать целиком до начала работы** |
| Карта всех 220 страниц по категориям A–S + 49 «пустых» маршрутов | `docs/old-site-url-map.md` |
| Инвентарь кастомного кода (225 уникальных блоков T123) и их полные тексты | `docs/custom-code-inventory.md`, `docs/tilda-custom-code/` |
| Скрипты аудита (перегенерация карт, outline страницы по блокам) | `scripts/audit/*.py` (`python3 scripts/audit/outline.py page36594700.html` — список блоков страницы с текстом) |
| Живой сайт — эталон для визуальной сверки | https://popovichfit.ru/ (Last-Modified 31.08.2026 = дата экспорта) |
| Прецеденты в `~/Projects` | `kochfit-redesign` (Тильда → Next.js static export, `scripts/migrate-tilda.mjs`, `scripts/optimize-images.mjs`, `e2e/` Playwright, `docs/HANDOFF.md`), `kochfit-lk` (Vue 3 + Vite + Tailwind 4 — стиль компонентов команды), `popovichfit-tariffs` (виджет тарифов Елены, вставлялся в Тильду inline/iframe) |

Как читать экспорт: страница = `<div id="allrecords">` из блоков `<div id="recNNN" class="r t-rec" data-record-type="…">`. `data-record-type="396"` — Zero Block (абсолютное позиционирование, стили в `<style>` внутри блока, координаты для каждого артборда в `data-field-*-res-<ширина>-value`), `131` — блок «HTML-код» (кастом), остальные — стандартные блоки Тильды. Картинки: `data-original` — оригинал, `src` — плейсхолдер/превью.

## 2. Область и очерёдность переноса

Категории — по `docs/old-site-url-map.md`. **Переносится всё (A–S)**; порядок — по важности для посетителя:

| Порядок | Кат. | Что | Как |
|---|---|---|---|
| 1 | A | Ядро (29): главная, `/about`, `/results`, `/community`, `/media` + 5 статей, `/mif`, `/course_correction`, `/course_power`, `/new-course`, `/korrekciya-new`, `/silovye-new`, `/inventory`, `/sertif`, `/taplink`, `/support`, `/delete`, `/successful_payment`, `/error-auth`, `/promo`, `/priut`, `/draw`, `/money_draw`, `/gift1`, `/mk_msk` | Вручную, максимальное качество, каждый блок — компонент |
| 2 | B | Юрдоки (6): `/oferta`, `/privacy`, `/consent`, `/part_oferta`, `/data-consent`, `/doc_l` | Текст дословно, общий шаблон документа |
| 3 | D | Материалы для учениц (37) — на них ведут ссылки из ЛК и рассылок | Шаблон «материал» (фон, заголовок, список видео Kinescope, кнопка «Назад») + данные |
| 4 | C | Сообщество/гости/лид-магниты (17) | Шаблоны «гость», «статья», «лид-магнит» + контент |
| 5 | F | 11 живых страниц без slug (`/pageNNN.html`) | Как A/D по содержанию; URL `/pageNNN.html` сохранить |
| 6 | E | Legacy «ЛК на Тильде» (84): уроки по датам (`/1day…/14day`, `/20cor1–20`, `/20pow1–20`, `/cor1–5`, `/pow1–5`), стартовые (`/lkcor20`, `/lkpow19`, `/lk_*_end`, `/lkcor_with*`, `/before`, `/test1313`), Tilda Members (`/lknachalo`, `/chatpow`, `/add_tr_ofelia`, `/profile-lk`, `/history-ballance`, `/members/signup`, `/ogin1`, `/m`) | Уроки — один шаблон `Lesson` + данные (дата, название, видео, описание); стартовые — по шаблону «материал». Страницы Tilda Members (7 шт., в экспорте пустой `<div id="allrecords">` с `tilda-members-init`) — перенести как статические страницы с тем же URL и `<title>`, содержимого нет; формы логина/восстановления пароля (`/ogin1`, `/m`) — как разметку без отправки, с пометкой `TODO(grey-zone-3)` |
| 7 | S | Черновики/копии/тесты (36) | Переносить по тем же шаблонам, но в `docs/MIGRATION-STATUS.md` помечать «вероятный черновик: <причина>» (Copy of / lorem ipsum / тест). Demo-контент Тильды (текст «Book design is the art…», «Zero Block Click "Block Editor"», квиз «What kind of traveler are you») переносить дословно — это тоже информация, владелец решит |
| — | X | 49 маршрутов из htaccess без файла | Уже 404 на живом сайте → 404. Список хранить в `app/data/redirects.ts` с пометкой `missing` |

Индексация: `noindex` ставить ровно там, где он был в экспорте (колонка `ni` карты); `robots.txt` — с тем же списком `Disallow`, что в `old-site/robots.txt` (минус `/tilda/*`, `/members/login*`, `/members/signup*` — но сами URL `/members/*` пусть отдают 404, кроме `/members/signup`, который есть в экспорте).

## 3. Стек и принципы

- **Nuxt 4** (Vue 3, `<script setup lang="ts">`), **статическая генерация** `nuxt generate` (`ssr: true`, `nitro.prerender.crawlLinks: true`, все маршруты в `routes` для гарантии), результат — `.output/public/` (чистые HTML + ассеты, отдаётся любым nginx/Apache). Никакого рантайм-сервера в проде.
- **Tailwind CSS 4** через `@tailwindcss/vite`; дизайн-токены в `app/assets/css/main.css` (`@theme`: цвета, шрифты, брейкпоинты `480/640/960/1200` как артборды Тильды, контейнер 1200). Для пиксельной копии допустимы arbitrary values (`text-[13px]`, `leading-[1.15]`, `tracking-[0.02em]`), но повторяющиеся значения — в токены. Сложные декоративные вещи — обычный CSS в `<style scoped>`.
- Vue-компоненты только там, где есть структура/поведение; **никакого лишнего клиентского JS**: по умолчанию компоненты рендерятся статически, интерактив — меню, попапы, аккордеон, реферальные параметры, cookie-баннер, горизонтальный скролл, back-to-top, lazy-видео, карточки тарифов. Без jQuery, без внешних UI-библиотек, без `scrollbooster`/`dragscroll` (заменить нативным `scroll-snap` + pointer events).
- Шрифты self-hosted (`public/fonts/`), `@font-face` с `font-display: swap`, preload основных начертаний (§4 п. 8).
- Картинки: пайплайн-скрипт на `sharp` (`scripts/import-images.mjs`, §8) → `public/img/<раздел>/<имя>.{webp,avif,png,jpg}` + `srcset`; компонент `<PfImage>` для единообразия (`width/height`, `loading="lazy"`, `fetchpriority` для LCP). `@nuxt/image` не использовать (с `generate` даёт лишнюю сложность; в kochfit прошли путём скрипта).
- Все внутренние ссылки — **относительные** (`/about`), через `<NuxtLink>`; внешние (`lk.popovichfit.ru`, `tg://`, `t.me`, соцсети) — через `<a>`. Абсолютный домен только в `canonical`, `og:url`, sitemap (`runtimeConfig.public.siteUrl`, по умолчанию `https://popovichfit.ru`).
- Никаких обращений к `*.tilda*`, `postnikovmd.com`, `storage.yandexcloud.net/tilda-tools`, `functions.yandexcloud.net`, `romanyu.ru`, `mt-webdesign.ru`, `unpkg.com`, `cdnjs`, `fonts.googleapis.com`. Проверяется `scripts/check-no-tilda.mjs` по `.output/public/`.
- Внешние ресурсы, которые остаются: Sender-виджет, Яндекс.Метрика, VK-пиксель, Kinescope/YouTube/Vimeo/Google Drive iframes, `salebot.site`. Плашки NASHA и тарифы с jsDelivr/GitHub Pages Елены — **забрать в репозиторий** (серая зона 8: единая кодовая база), если владелец не скажет иначе.
- Node 22, npm, `package-lock.json` в git. Dev-сервер на порту **3500** (`nuxt dev -p 3500`), чтобы не пересекаться с kochfit (3400).

**Структура репозитория (ориентир, Nuxt 4 `app/`-layout):**

```
popovichfit-site/
  nuxt.config.ts, package.json, tsconfig.json, tailwind (в main.css)
  public/            fonts/, img/ (сгенерированные пайплайном), favicon.ico, robots.txt
  app/
    app.vue                        NuxtLayout + NuxtPage
    layouts/default.vue            шапка, мобильное меню, футер, cookie, плашка ВК, виджет, back-to-top
    layouts/bare.vue               без шапки/футера (страницы, где их не было: тарифы-iframe, плашки, Tilda Members)
    pages/                         маршруты 1:1 со старыми URL (index.vue, about.vue, course_correction.vue, …,
                                   media_1_otek.vue, 20cor1.vue …, page103420636.html.vue, members/signup.vue)
    components/
      site/    SiteHeader, MobileMenu, SiteFooter, CookieBanner, VkNotice, BackToTop, SupportWidget
      ui/      Modal, Accordion, HScroll, VideoEmbed (kinescope/youtube/vimeo/gdrive), PfImage, PfButton, BackButton
      home/    HeroSection, CoursesSection, AdvantagesSection, AppSection, TrainerSection, FaqSection …
      course/  Schedule, AboutCourse, Curators, TariffCards, Equipment …
      content/ LegalDoc, Material, Lesson, GuestPage, ArticlePage, LeadMagnet
    composables/ useRefParams, useModal, useCookieConsent
    data/     nav.ts, links.ts (боты, ЛК, соцсети, приложения), tariffs.ts (PF_CARDS), schedule.ts (даты потоков),
              faq.ts, pages.ts (title/description/og/noindex/layout для каждого URL), redirects.ts, anchors.ts,
              materials/*.ts, lessons/*.ts (данные для шаблонных страниц)
    assets/css/main.css            tailwind + @theme + @font-face + базовая типографика
    plugins/  analytics.client.ts (Метрика, VK-пиксель), ref-params.client.ts
  scripts/   import-images.mjs, extract-meta.mjs, extract-content.mjs, shoot-live.mjs, shoot-local.mjs, compare.mjs,
             check-urls.mjs, check-links.mjs, check-no-tilda.mjs, text-diff.mjs, postgenerate.mjs, build-nginx-redirects.mjs
  e2e/       Playwright smoke
  docs/      TILDA-AUDIT.md, old-site-url-map.md, MIGRATION-STATUS.md, asset-map.md, screens/, HANDOFF.md, DEPLOY.md (заготовка)
  old-site/  (gitignored) экспорт
```

## 4. Метод переноса Zero Block → адаптивная вёрстка

Это 90 % работы. Правила:

1. **Источник правды — живой сайт**, не экспорт. Перед вёрсткой страницы снять скриншоты живой страницы на ширинах 1440, 1200, 960, 640, 480, 390, 360 (Playwright, `scripts/shoot-live.mjs`, папка `docs/screens/live/<slug>/`; полные страницы — `full/`, в git только превью). Снять **все 220 страниц сразу на этапе 0** — это эталон, пока Тильда жива. Экспорт нужен для текстов, ссылок, картинок и точных значений (шрифт, размер, цвет, отступы) из `<style>` блока и `data-field-*`.
2. Артборд **1200** — эталон десктопа (`data-artboard-upscale="grid"` = контейнер 1200 по центру, `window` = тянется на всю ширину, `data-artboard-valign`, `data-artboard-height` — высота секции). Артборды **320** и **480** — эталон мобайла. 640/960 — промежуточные; между артбордами Тильда масштабирует, у нас — обычная резина.
3. Верстать **flex/grid + `clamp()`**, а не absolute. Absolute — только для декоративных элементов (линии, бейджи, подписи поверх фото). Никакого `zoom`/`transform: scale` всей секции.
4. Каждая секция — свой компонент с комментарием-ссылкой на исходный блок: `<!-- old-site: page36594700.html #rec1120250416 -->`. Повторяющиеся блоки (подписка на бот, FAQ, «над курсом работают», плашка ВК, cookie, шапка/футер) — один компонент с пропсами, не копии.
5. **Тексты копировать из экспорта дословно** (включая `&nbsp;`, тире, кавычки «»). Допустимо: убрать хвостовые пробелы, заменить `<br>` на разумную разметку, если перенос не меняет смысл. Не «улучшать» формулировки. Если в Тильде текст разбит на отдельные элементы ради позиционирования — собрать в нормальный `<h2>/<p>/<ul>`.
6. Заголовки: одна `<h1>` на страницу, дальше `<h2>/<h3>` по смыслу; визуальные размеры — как в оригинале.
7. **Шрифты**: `'Involve'` объявить `@font-face` с той же привязкой весов к файлам, что в `old-site/_fonts-tildacdn/README.md` (400 → Manrope-SemiBold, 500 → Involve-Medium, 600 → Involve-SemiBold, 700 → Involve-Bold, 800 → Manrope-ExtraBold, 900 → Manrope-Bold, 100 → Involve-VF), `Manrope` и `Unbounded` — локальные woff2 (скачать с Google Fonts все веса из `<link>` экспорта, subset latin+cyrillic). Для шрифтов без `@font-face` в экспорте (`RockStar`, `tfutura`, `evolventavetrino`, `Bounded`, `Inter`, `Roboto`, `Nunito Sans`) — проверить в браузере, что реально рендерится на живом сайте (computed `font-family`), и использовать это.
8. Картинки: брать `data-original` (оригинал), не `src` (превью `__resize…`/`__empty__`). Фото людей — WebP quality ≥ 85, без даунскейла ниже 2× отображаемого размера; PNG с прозрачностью — WebP lossless или PNG; SVG — как есть (svgo). `og:image` — отдельные файлы без изменений.
9. Приёмка блока: наложение скриншота live vs local на 1200 и 390 (`scripts/compare.mjs`, pixelmatch, порог ≤ 3 % площади, различия только из-за антиалиасинга/рендеринга шрифтов). Всё, что больше — фиксить или явно описать в `docs/MIGRATION-STATUS.md` как намеренное улучшение.
10. «Допустимое исправление адаптива»: горизонтальный скролл страницы, наезжающие тексты, обрезанные кнопки, элементы за краем экрана на 360–390 px, нечитаемые размеры шрифта < 12 px. Чинить, записывая в статус-файл. Компоновку секций не менять.

## 5. Общие компоненты и поведения (паритет 1:1)

Реализовать один раз, подключать через `layouts/default.vue`. Детали — `docs/TILDA-AUDIT.md` §5.

- **SiteHeader** — fixed, высота 44 px (34 px ≤ 480), пункты: курсы → `/#courses` (алиас старого якоря `#rec1120250416`, см. §7), до/после → `/results`, статьи → `/media`, о тренере → `/about`, вопрос/ответ → `/#question-answer`, тех.поддержка → `tg://resolve?domain=popovichfitCare_Bot`, логотип → `/`, «Личный кабинет» → `https://lk.popovichfit.ru/`, гамбургер → MobileMenu. Все ссылки — из `app/data/nav.ts`. На страницах, где в экспорте другая/нет шапки (колонка карты: без `rec1120433846`), — соответствующий вариант (`layouts/bare.vue` или вариант шапки старых страниц `rec1105506586`).
- **MobileMenu** (бывший T450 `#rec592229670`): Главная, Курсы, До/после, Статьи, О тренере, Вопрос-ответ, соцсети (Instagram, Telegram, YouTube), кнопки «ПРЕДЗАПИСЬ» (`tg://resolve?domain=popovichfitcourse_bot`) и «ТЕХ.ПОДДЕРЖКА»; закрытие по крестику/оверлею/Esc, блокировка скролла body, `aria-*`.
- **SiteFooter** — «прилипающий» эффект (`clip-path` + fixed, как `uc-sticky-footer`) воспроизвести (серая зона 11), ссылки как в `#rec1120448561`, включая иконку `shumann.ru`, `mailto:info@popovichfit.ru`.
- **CookieBanner** — показывать, пока нет `localStorage.cookieConsent === 'accepted'`; скрывать по любому клику на странице (кроме ссылки на `/privacy`), та же анимация.
- **VkNotice** — плашка «Дублируем информацию в других соцсетях» → `https://vk.com/popovichfit` там, где она есть в оригинале.
- **useRefParams / plugin `ref-params.client.ts`** — единый модуль вместо ~15 скриптов Тильды: если в URL есть `r` и/или `utm_source|utm_medium|utm_campaign|utm_term|utm_content`, дописать их (сохраняя существующие параметры и hash) во все ссылки на этот же сайт **и на `https://lk.popovichfit.ru/…`** (включая ссылки, которые TariffCards выставляет динамически; в Nuxt — через `router.afterEach` + обработка `<NuxtLink>`/`<a>` после монтирования). На главной ссылку `https://t.me/POPOVICHcourse_bot` при наличии `r` заменить на `https://salebot.site/62b5cbabae0fe1409f44ce65d9274be9_1?utm_content=r%3D<r>` (серая зона 4). Значение `r` держать в `sessionStorage`, чтобы не терять при переходах (серая зона 4).
- **TariffCards** — данные из `app/data/tariffs.ts` (перенести `PF_CARDS` из `docs/tilda-custom-code/061_*.html` дословно: 4 карточки × 3 опции, `newPrice/oldPrice/link`), переключение 1/3/6 потоков, подсветка активной опции, кнопка ведёт на checkout ЛК. Цены и ссылки меняются в одном файле, с комментарием «как обновить».
- **Schedule** («Расписание потоков»: «Набор закрыт / поток 52 / СТАРТ 5 октября / поток 53…») — данные в `app/data/schedule.ts`.
- **Modal** — один компонент; открытие по `href="#popup:<name>"`, `#zeropopup…`, `#dop`, `#tarif1..4`, `#about1..7` (сохранить старые хуки: внешние ссылки вида `/course_correction#popup:mygallery_svt` должны открывать попап), закрытие Esc/оверлей/крестик/`#closepopup`; hash не ломает роутинг Nuxt. Контент попапов — в компонентах страницы.
- **VideoEmbed** — Kinescope: `<iframe src="https://kinescope.io/embed/<id>" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen>`, ленивая загрузка (постер + клик или `loading="lazy"`); YouTube — `youtube-nocookie.com`, lazy; Vimeo и Google Drive iframe — как есть. В попапах видео стартует при открытии и останавливается при закрытии (как на Тильде).
- **Accordion** (FAQ) — `<details>/<summary>` с анимацией, стили как T585; якорь `#question-answer` над блоком.
- **HScroll** — горизонтальная прокрутка карточек стрелками и drag (заменяет VORON/romanyu/scrollbooster), на мобиле нативный свайп.
- **BackToTop** — кнопка слева снизу (`left: 20px`), появляется после прокрутки.
- **Anchors** — плавный скролл к `#id` с учётом высоты fixed-шапки (в Nuxt — `app/router.options.ts` `scrollBehavior`); `javascript:history.back()` (116 ссылок на материалах) → `<BackButton>` (`history.back()`, при пустой истории — `/`).
- **SupportWidget** — **Sender на всех страницах**: `<script src="https://senndder.ru/popovichfit-widget/widget.js" data-widget-id="cmsiry9fw1ef4a7c912b3" data-api-key="cmsiry9fxde42d839d1ed" data-api-url="https://senndder.ru/api" async>` (через `useHead`, один раз, только на клиенте). Виджет NN99 и amoCRM не подключать.
- **Analytics** (`plugins/analytics.client.ts`) — Яндекс.Метрика `88400923` с `{clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true, ecommerce:"dataLayer"}` + `<noscript>`, при клиентской навигации вызывать `ym(id, 'hit', url)`; VK-пиксель `VK-RTRG-1817271-8E0Ye`; `<meta name="yandex-verification" content="ef3a6b04ad30f479">`. Убрать `ymCms: tilda` и `tilda-stat`. В dev-режиме аналитику не грузить (`import.meta.dev`).
- **SEO/head** — `title`, `description`, `og:*` (`og:image` абсолютный URL), `canonical` (без www, без слэша, как у Тильды), favicon (`.ico` из экспорта + svg/png), `lang="ru"`, `viewport`, `format-detection`. Данные — `app/data/pages.ts`, заполняются скриптом `scripts/extract-meta.mjs` из `<title>/<meta>` каждой старой страницы, потом проверяются руками. `noindex` — где был в экспорте.
- **404** — своя страница `app/error.vue` в стиле сайта (шапка/футер, ссылка на главную); при `generate` появляется `404.html`.

## 6. Шаблоны контентных страниц (B, C, D, E, F, S)

- Разобрать оригиналы: материалы (D) и legacy-уроки (E) — фиксированный фон (T674), заголовок, список видео Kinescope с подписями, описание, кнопка «Назад», иногда табы/аккордеон/попапы. Сделать шаблоны `Material`, `Lesson`, `LegalDoc`, `GuestPage`, `ArticlePage`, `LeadMagnet`; контент — в `app/data/materials/*.ts`, `app/data/lessons/*.ts` (типизированные объекты: `title, date, blocks[]`) либо прямо в `<template>` страницы, если структура уникальна. Длинные тексты (юрдоки, статьи) — как HTML в `<template>` с классами типографики (`prose`-подобный набор в `main.css`), не в JSON-строках.
- Для извлечения текста/видео из старых страниц написать `scripts/extract-content.mjs` (по образцу `kochfit-redesign/scripts/migrate-tilda.mjs`: `.t-text`, `tn-atom`, `data-videolazy-id`, `kinescope.io/embed/<id>`, `field="title"`), но результат **обязательно вычитывать** и сверять со скриншотом — автоизвлечение теряет порядок и форматирование.
- Юрдоки: сохранить нумерацию пунктов, реквизиты, даты; ни один абзац не потерян (`scripts/text-diff.mjs`: нормализованный plain-text старой и новой страницы).
- Страницы Tilda Members (7 шт.) и формы (§9) — по правилам §2/§9.

## 7. URL, редиректы, статусы

- Все slug'и из `htaccess` сохраняются 1:1: `app/pages/<slug>.vue` (для `members/signup` — `app/pages/members/signup.vue`). Страницы без slug и категория F — `app/pages/pageNNN.html.vue` (маршрут `/pageNNN.html`).
- Для **каждой** страницы со slug старый «сырой» URL `/pageNNN.html` → **301** на slug. Карта в `app/data/redirects.ts`; из неё `scripts/build-nginx-redirects.mjs` (заготовка на будущее) и `scripts/postgenerate.mjs` генерирует в `.output/public/` файлы-заглушки `pageNNN.html` с `<meta http-equiv="refresh" content="0;url=/slug">` + `<link rel="canonical">` (для локальной проверки и любого статического хостинга до появления nginx).
- `scripts/postgenerate.mjs` также нормализует вывод: каталоги `pageNNN.html/index.html` → файлы `pageNNN.html`; проверяет, что для каждого из 224 маршрутов htaccess + 220 файлов есть либо страница, либо редирект, либо запись `missing` (X → 404).
- Регистр: на Тильде `[NC]`; в Nuxt добавить `app/middleware/lowercase.global.ts` (или `routeRules`) — редирект `/About` → `/about` на клиенте; серверную нечувствительность обеспечит nginx позже (заметка в `DEPLOY.md`).
- Завершающий слэш: генерировать без слэша (`nitro.prerender` + `router.options.trailingSlash: false`), `/about/` → `/about`.
- Якоря: секция курсов на главной получает `id="courses"` **и** алиас `id="rec1120250416"` (пустой `<span>` с id внутри), FAQ — `id="question-answer"`; в `app/data/anchors.ts` перечислить все старые `#rec…`-якоря из ссылок экспорта (`grep -oh 'popovichfit.ru/[^"]*#rec[0-9]*' old-site/*.html | sort -u`) и повесить алиасы.
- `robots.txt` — из `old-site/robots.txt` (см. §2), `Sitemap: https://popovichfit.ru/sitemap.xml`; `sitemap.xml` — `@nuxtjs/sitemap` или свой скрипт: все перенесённые индексируемые страницы.
- Проверка: `scripts/check-urls.mjs` поднимает `.output/public/` статическим сервером (`npx serve`/`sirv`, порт 3501) и прогоняет все старые URL, сверяя ожидаемый статус/редирект с таблицей.

## 8. Картинки и медиа

- Пайплайн: `scripts/import-images.mjs` копирует из `old-site/images/` только используемые оригиналы (по `data-original`/`src`/`og:image`/CSS `background-image` страниц) в `public/img/<раздел>/<осмысленное-имя>.<ext>` + генерирует WebP/AVIF и размеры для `srcset` (sharp), пишет `docs/asset-map.md` (новое имя → исходный файл). Неиспользуемые 360 resize-вариантов и 113 плейсхолдеров не копировать. Оригиналы под пайплайн держать в `assets-src/` (в git, чтобы пересборка была воспроизводима; если > 300 МБ — оставить в `old-site/` и читать оттуда).
- Бюджет: главная ≤ 2 МБ на первый экран, LCP-картинка с `fetchpriority="high"` + preload; остальные lazy. Не пережимать до артефактов — фото Натальи и кураторов сравнивать глазами на retina.
- Видео не хостим — только embeds.

## 9. Формы (серая зона 3)

В экспорте формы Тильды на `/gift1` (4 формы + корзина T706 CloudPayments «Купить в подарок»), `/mk_msk` (1), `/members/signup`, `/ogin1`, `/m`, `/payment-test`, `/testvvedenie` и в черновиках. Бэкенда после ухода с Тильды нет. По умолчанию: сверстать формы как в оригинале (поля, тексты, кнопки, чекбокс согласия), отправку не реализовывать — `submit` показывает то же «сообщение об успехе» из экспорта? **Нет**: без бэкенда это обман. Кнопка отправки задизейблена с пометкой в статус-файле и `TODO(grey-zone-3)`; корзину CloudPayments не воспроизводить. Если владелец даст канал (бот/почта/ЛК) — сделать минимальный обработчик отдельным этапом.

## 10. Сервер и деплой — ПОЗЖЕ (заготовка)

Сейчас не делать. В `docs/DEPLOY.md` оставить заготовку: статика из `.output/public/`, nginx (`try_files`, `error_page 404`, `include redirects.conf` из `scripts/build-nginx-redirects.mjs`, gzip/brotli, `Cache-Control: immutable` для `/_nuxt/*` и шрифтов, заголовки безопасности; `X-Frame-Options` не ставить/`frame-ancestors` — серая зона 12), Let's Encrypt, rsync-деплой по образцу `kochfit-redesign/scripts/deploy-kochfit.mjs`, стейджинг-домен. Для shared-хостинга Apache — `.htaccess` с теми же правилами (образец в `old-site/htaccess`).

## 11. Переключение домена — ПОЗЖЕ (заготовка runbook)

DNS на reg.ru (`ns1/ns2.hosting.reg.ru`): снизить TTL `@`/`www`, выпустить SSL, поменять **только A-записи `@` и `www`**; не трогать `lk` (158.160.195.8), MX (`mx1/mx2.hosting.reg.ru`), TXT SPF/unisender. Тильду не отключать ≥ 2 недель. Post-cutover чек-лист — §12. Записать в `docs/DEPLOY.md`, исполнять по команде владельца.

## 12. Проверка и приёмка (локально)

Обязательные артефакты:

- `docs/MIGRATION-STATUS.md` — таблица: URL → категория → статус (не начата / сверстана / сверена / принята) → скриншоты live/local → намеренные отличия → пометки («вероятный черновик», «форма без отправки»).
- `scripts/shoot-live.mjs`, `scripts/shoot-local.mjs`, `scripts/compare.mjs` (Playwright + pixelmatch) — все страницы на 1440/1200/960/640/480/390/360, diff; результаты в `docs/screens/` (в git — превью, не полноразмерные).
- `e2e/` Playwright smoke по локальной сборке: каждая страница — 200 и нет ошибок в консоли; меню открывается/закрывается; FAQ раскрывается; попапы по hash открываются; `?r=TESTREF&utm_source=qa` попадает в ссылки шапки, курсов и checkout; cookie-баннер скрывается и не возвращается; видео-iframe появляется; «Личный кабинет» → `https://lk.popovichfit.ru/`; 404 отдаёт 404; заглушки `pageNNN.html` → slug; виджет Sender подключён на каждой странице ровно один раз.
- `scripts/check-links.mjs` — все внутренние ссылки и якоря существуют; внешние — HEAD ≠ 404 (исключения для `tg://`, `mailto:`).
- `scripts/check-no-tilda.mjs` — в `.output/public/` нет `tilda`, `postnikov`, `tilda-tools`, `functions.yandexcloud`, `googleapis.com/css`, `unpkg`, `cdnjs`, `nn99.ru/widget`, `amocrm`.
- `scripts/text-diff.mjs` — для текстовых страниц (B/C/D/E/S) сравнение видимого текста старой и новой страницы — расхождения только в пробелах/переносах.
- Lighthouse (mobile) на главной и странице курса: Performance ≥ 80, Accessibility ≥ 90, SEO ≥ 95; нет горизонтального скролла на 360 px; CLS < 0.1. `npx nuxi typecheck` и `eslint` чистые.
- HTML валиден (`html-validate`), картинки с `alt` (из экспорта; декоративные — `alt=""`).

Definition of Done для страницы: 200 по старому URL + заглушка-редирект с `pageNNN.html`; визуальный diff ≤ 3 % на 1200 и 390; текст-diff чистый; ссылки/попапы/видео проверены руками; запись в `MIGRATION-STATUS.md`.

## 13. Порядок работ и правила для агента

**Этапы (каждый — серия локальных коммитов, статус в `docs/MIGRATION-STATUS.md`):**

0. Инициализация: `git init` (без remote), `.gitignore`, Nuxt 4 + Tailwind 4 + TS + ESLint, `main.css` с токенами и `@font-face`, шрифты в `public/fonts/`, `pages.ts` из `extract-meta.mjs`, скелет `layouts/default.vue`, `scripts/shoot-live.mjs` → **скриншоты всех 220 страниц** в `docs/screens/live/`.
1. Общий каркас: SiteHeader, MobileMenu, SiteFooter, CookieBanner, VkNotice, BackToTop, RefParams, Analytics, SupportWidget (Sender), Modal, Accordion, VideoEmbed, PfImage, BackButton, error.vue. Приёмка на пустой странице.
2. Главная `/` (18 Zero Block) — полностью: попапы, FAQ, ссылки на приложение, якоря-алиасы. Показать владельцу (скриншоты live/local рядом).
3. Курсы: `/course_correction`, `/course_power`, `/new-course` (TariffCards + Schedule), `/korrekciya-new`, `/silovye-new` (серая зона 8).
4. Остальное ядро A: `/about`, `/results`, `/community`, `/media` + статьи, `/mif`, `/inventory`, `/sertif`, `/taplink`, сервисные, `/gift1`, `/mk_msk`.
5. B юрдоки, F страницы без slug.
6. D материалы (шаблон + 37), C сообщество/гости.
7. E legacy-уроки (шаблон `Lesson` + 84), S черновики (с пометками).
8. URL-слой: `redirects.ts`, `postgenerate.mjs`, `robots.txt`, `sitemap.xml`, `check-urls`; полный прогон §12 по `npm run generate`; отчёт владельцу.
9. (позже, по команде) сервер, деплой, DNS по §10–11; `docs/HANDOFF.md` (как менять цены/даты/ссылки, как добавить страницу, как собрать).

**Правила:**

- Не выдумывать контент. Если чего-то нет в экспорте и на живом сайте — оставить пусто и записать в статус-файл.
- Не менять тексты, ссылки, порядок секций, цвета, шрифты. Любое отличие от оригинала — осознанное, записанное, из категории «исправление бага адаптива/производительности».
- Всё, что касается ЛК, ботов, оплат, реферальной программы — воспроизводить буквально; при малейшем сомнении — вопрос владельцу, а не собственное решение.
- Не удалять внешние сервисы, которые остаются (Sender, Kinescope, salebot) и не добавлять новые.
- Коммиты небольшие, сообщения по-русски, в теле — какие страницы/блоки затронуты. README на русском. Remote не добавлять, не пушить.
- Перед тем как считать страницу готовой — открыть её на 1200 и 390 рядом с живой и сравнить глазами, а не только diff-скриптом.
- Не трогать `old-site/` и `docs/tilda-custom-code/`.
- В конце каждого этапа — короткий отчёт: что сделано, что отличается от оригинала, какие вопросы открыты.

## 14. Серые зоны — решено / открыто

| # | Вопрос | Статус | Решение / допущение по умолчанию |
|---|---|---|---|
| 1 | Legacy-страницы «ЛК на Тильде» (84) | **Решено** | Переносить (все страницы переносим), шаблон `Lesson`/`Material` |
| 2 | Стек | **Решено** | Vue + Tailwind → Nuxt 4 static generate + Tailwind 4 + TS |
| 3 | Формы на `/gift1`, `/mk_msk`, Tilda Members и оплата CloudPayments: куда должны уходить заявки/оплата? | Открыто | Сверстать, отправку не делать (кнопка disabled, `TODO(grey-zone-3)`), корзину не воспроизводить |
| 4 | `?r=` и utm: пробрасывать глобально во все внутренние ссылки и во все ссылки на ЛК; держать `r` в sessionStorage; подмена бота на salebot при `r` | Открыто | Да / да / сохранить |
| 5 | Сервер | **Решено: позже** | Ничего не делать, заготовка в `DEPLOY.md` |
| 6 | Репозиторий на GitHub | **Решено: пока нет** | Локальный git без remote |
| 7 | Черновики S и 49 маршрутов X | **Частично** | S — переносить с пометкой «вероятный черновик»; X → 404 (редиректы — если владелец назовёт) |
| 8 | `/korrekciya-new`, `/silovye-new` (iframe GitHub Pages) и плашки NASHA с jsDelivr — забрать в репозиторий? Какой блок тарифов актуален — `PF_CARDS` или GitHub-виджет? | Открыто | Забрать в репозиторий (код из `~/Projects/popovichfit-tariffs`), данные тарифов — единый `tariffs.ts`; оба варианта страниц перенести |
| 9 | Виджет поддержки | **Решено** | Sender на всех страницах; NN99 и amoCRM не переносить |
| 10 | Бонусы Collabza/NOLIM (Tilda Members) и страница `/page60771825.html` «Реферальная программа» | Открыто | Collabza/NOLIM не переносить (для посетителей ничего не рендерят); страницу перенести как статичную |
| 11 | «Прилипающий» футер | Открыто | Сохранить |
| 12 | `Header unset X-Frame-Options` — сайт где-то встраивают во фреймы? | Открыто (к этапу сервера) | `frame-ancestors 'self' https://lk.popovichfit.ru` |
| 13 | Метрика 88400923 и VK-пиксель; цели; другие счётчики из интерфейса Тильды | Открыто | Оставить как есть, целей нет |
| 14 | `www` → 301 на без-www | Открыто (к этапу сервера) | Да |
| 15 | Kinescope whitelist доменов для стейджинга | Открыто (к этапу сервера) | Проверить на стейджинге |
| 16 | DNS | **Решено: пока не трогаем** | — |
| 17 | Улучшения адаптива | Открыто | Только явные баги |
| 18 | Почта/рассылки на reg.ru — сайт сам писем не шлёт | Открыто | Не шлёт |

Ответы по открытым пунктам вписывать в эту таблицу; после этого обновить допущения в коде (`grep -rn "grey-zone" app/`).
