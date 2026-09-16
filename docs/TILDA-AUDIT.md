# Аудит экспорта popovichfit.ru (Тильда) перед переносом в код

Дата аудита: 16.09.2026. Источник: архив `natalya-popovich_3e2230807a6d35e2376a7f268346a5b84709a629.zip` (экспорт Тильды, страницы датированы 31.08.2026 — совпадает с `Last-Modified` живого сайта), распакован в `old-site/`. Живой сайт: https://popovichfit.ru/ (Tilda project id 4517250, за DDoS-Guard). Личный кабинет https://lk.popovichfit.ru/ — отдельная система (NN99: Laravel + Inertia + Vue, nginx, IP 158.160.195.8), **не трогаем**.

Связанные документы: [карта URL](old-site-url-map.md) · [инвентарь кастомного кода](custom-code-inventory.md) · тексты T123 в `tilda-custom-code/` · скрипты аудита в `../scripts/audit/`.

## 1. Что в архиве

| | |
|---|---|
| HTML-страниц | 220 (все в корне, `pageNNN.html`; главная — `page36594700.html` через `DirectoryIndex`) |
| Маршрутов в `htaccess` | 224 «человеческих» URL → `pageNNN.html`; 49 из них ведут на файлы, которых в архиве нет (на живом сайте — 404, страницы сняты с публикации) |
| В `sitemap.xml` | 176 URL (в т.ч. черновики и «Blank page» — sitemap Тильда собирает автоматически) |
| `robots.txt` | Disallow для ~90 URL (legacy-уроки, ЛК-страницы, служебные) + `/tilda/*`, `/members/*` |
| Изображения | 1 935 файлов, 635 МБ (jpg 895, png 805, svg 170, jpeg 63, ico 2); 360 файлов — resize-варианты Тильды (`__resize…`), 113 — пустые плейсхолдеры (`__empty__`) для lazyload |
| CSS | `tilda-grid`, `tilda-animation`, `tilda-popup`, `tilda-forms`, `tilda-cart` … + по одному `tilda-blocks-pageNNN.min.css` на страницу (стили блоков + `@font-face`) |
| JS | jQuery 1.10.2, `tilda-scripts-3.0`, `tilda-zero-1.1` (движок Zero Block), popup/menu/animation/video/forms/cart/quiz… + `tilda-blocks-pageNNN.min.js` на страницу |
| Шрифтов в архиве | **нет** — все грузятся снаружи (см. §4) |
| Размер | 819 МБ |

Внешние зависимости, которые остаются в экспорте (без них страницы «сломаются» после отключения Тильды):

- `https://neo.tildacdn.com/js/tilda-fallback-1.0.min.js` (на всех 214 страницах) — загрузчик-фолбэк Тильды.
- `@font-face` семейства **Involve** → `static.tildacdn.com` (7 файлов), плюс Google Fonts (Unbounded, Manrope).
- Tilda Members (`members.tildaapi.com`, `members2.tildacdn.com`) на 7 страницах — legacy ЛК Тильды.
- Формы Тильды (`data-formactiontype="2"`, `tilda-forms`) — отправка через `forms.tildaapi.com`; корзина `T706` + CloudPayments на `/gift1`.
- Collabza / «tilda-tools» (3 скрипта на всех страницах с `storage.yandexcloud.net/tilda-tools/…`, бэкенд `functions.yandexcloud.net`) — динамические блоки, зависят от профиля Tilda Members в `localStorage`. Для анонимного посетителя не рендерят ничего (проверено на живом сайте).
- `cdn.postnikovmd.com/tilda@1.5/mods.min.js` — библиотека модов Тильды (на всех страницах).
- NOLIM (`NLM607`) — скрывает блоки `#rec840321609,#rec840321608` (кнопки бонусов), если нет профиля Tilda Members.

## 2. Из чего собраны страницы (типы блоков)

| Тип | Кол-во | Что это | Как переносить |
|---|---|---|---|
| T123 (`data-record-type="131"`) | 271 вхождение, 225 уникальных | «HTML-код»: кастомные скрипты/стили фрилансеров, виджеты, пиксели, плашки Елены | Разобрать по назначению — см. [custom-code-inventory](custom-code-inventory.md). Большинство заменяется 5–6 общими модулями |
| **T396 Zero Block** | **1 651 на 211 страницах** | Абсолютное позиционирование с отдельными координатами для артбордов 320/480/640/960/1200 (иногда 380, 1600); зависит от `tilda-zero-1.1.min.js` | Главная сложность переноса. Верстать заново flex/grid по макету 1200 (десктоп) и 320/480 (мобайл), сверяясь со скриншотами живого сайта |
| T868 (embed-попап), T331 (YouTube-попап), T390 (текстовый попап), T702 (попап с формой), T746 (галерея-попап), T1093 (zero-попап) | 354 / 104 / 88 / 6 / 48 / 30 | Попапы, открываются по `href="#popup:…"`, `#zeropopup…`, `#dop` и т.п. | Один компонент Modal + карта хуков → контент; сохранить hash-хуки |
| T270 | 216 | Плавный скролл к якорям + смещение | Один скрипт |
| T890 | 207 | Кнопка «наверх» | Один компонент |
| T450 | 182 | Мобильное меню (гамбургер, `#menu_open`) | Один компонент |
| T106/T004, T033/T017, T043/T030, T248/T220, T223/T195 | 124+18+6+6+5 | Обычные текстовые блоки (юрдоки, статьи) | Markdown/MDX-контент + типографика |
| T674 | 77 | Фиксированный фон страницы | CSS |
| T215 | 70 | Якорь | `id` на секции |
| T585 | 13 | Аккордеон FAQ («Ответы на вопросы») | Компонент Accordion (`<details>`) |
| T395, T663, T431, T806, T367, T887, T4, T3/T107 | единичные | Табы, галерея, таблица, квиз (demo), таймер-попап, cookie-бар Тильды, картинка | Разобрать по месту; T806-квиз на `/gift1` — демо-контент, не переносить |
| T706 | 7 | Корзина Тильды (CloudPayments) — только `/gift1` и черновики | Не переносится без бэкенда — серая зона |

## 3. Что на самом деле живое (структура сайта)

По ссылкам из главной (шапка, меню, футер) достижимы всего **20 страниц**: главная, `/about`, `/results`, `/community`, `/media` + 5 статей (`/media_1_otek`, `/mediah`, `/media_gluteal_muscles`, `/media_mtd2`, `/media_kor`) и `/mif`, `/course_correction`, `/course_power`, `/inventory`, `/sertif`, 5 юрдоков. Остальное — «входы снаружи» (Telegram-бот, рассылки, ЛК, реклама, таплинк). Категоризация всех 220 файлов — в [old-site-url-map.md](old-site-url-map.md):

- **A. Ядро (29)** — навигация, курсы, продажи, сервисные (`/support`, `/delete`, `/successful_payment`, `/error-auth`, `/taplink`, `/new-course`, `/korrekciya-new`, `/silovye-new`, `/promo`, `/priut`, `/draw`, `/money_draw`, `/gift1`, `/mk_msk`).
- **B. Юрдоки (6)** — `/oferta`, `/privacy`, `/consent`, `/part_oferta`, `/data-consent`, `/doc_l`.
- **C. Сообщество/гости/лид-магниты (17)** — `/spikery`, `/guest_*`, `/guide_makeup` (3 МБ, 70 Zero Block!), `/trends_23`, `/inspiration`, `/popovichlec`, `/page01`–`/page04`.
- **D. Материалы для учениц (37)** — `/bonus*`, `/nutric*`, `/eat`, `/warmup`, `/ifr`, `/taping`, `/regime`, `/health`, `/lifestyle`, `/knees`, `/body`, `/max`, `/extra`, `/test_*`, `/menu*`, `/pitanie`, `/ins`, `/brief`, `/inventar`, `/inv_*`… На них ведут ссылки из ЛК (`lk.popovichfit.ru/folders/pitanie|health|lifestyle`) и рассылок; подключён виджет NN99. **URL менять нельзя.**
- **E. Legacy «ЛК на Тильде» (84)** — уроки по датам (`/1day`…`/14day`, `/20cor1`…`/20cor20`, `/20pow1`…`/20pow20`, `/cor1`–`/cor5`, `/pow1`–`/pow5`), стартовые (`/lkcor20`, `/lkpow19`, `/lk_*_end`, `/lkcor_with*`), Tilda Members (`/lknachalo`, `/members/signup`, `/ogin1`, `/m`, `/profile-lk`, `/history-ballance`, `/chatpow`, `/add_tr_ofelia`). Датированы февралём–апрелем, половина `noindex`+`Disallow`. Скорее всего мертвы после переезда ЛК — **серая зона**.
- **F. Без slug, но живые (11)** — `/page103420636.html` «Итоги 2025», `/page50584427.html` «Инструкция к курсу», `/page60771825.html` «Реферальная программа», `/page53039655.html` «Программа курса», плашки ВК, лендинги «Бесплатные тренировки», «РЕДИЗ» и др.
- **S. Черновики/копии/тесты (36)** — «Copy of…», «черновик», «Blank page» (с lorem ipsum), «Оплата для теста», «Тест платежных систем», старые версии главной/курсов (`page70281657`, `page70505671`, `page70866373`, `page70697897`), `/futer`, «Шапка». Не переносить (список на подтверждение).
- **X. 49 маршрутов без файла** — `/questions`, `/year-results`, `/predresults`, `/prodresult`, все `/buy*`, `/cor1k`… `/pow6k`, `/tariff_*`, `/corprod*`, `/pow*prod`, `/pred*`, `/course_cor|pow|prod*`, `/265|377|836|120`, `/introduction*`, `/admin`, `/testclo`, `/prod12`. На живом сайте 404.

## 4. Шрифты (критично, легко потерять)

- Семейство `'Involve'` (7 653 упоминания) объявлено в каждом `tilda-blocks-pageNNN.min.css` через `@font-face` с файлами на `static.tildacdn.com`. **Под одним именем смешаны два шрифта**: 100 → Involve-VF, 500 → Involve-Medium, 600 → Involve-SemiBold, 700 → Involve-Bold, **400 → Manrope-SemiBold, 800 → Manrope-ExtraBold, 900 → Manrope-Bold**. Эту привязку веса к файлу надо воспроизвести 1:1 (иначе поменяются начертания). Файлы скачаны в `old-site/_fonts-tildacdn/`.
- `Manrope` (3 603) и `Unbounded` (17) — с Google Fonts (`fonts.googleapis.com/css2?family=Unbounded…&family=Manrope…`). Перенести локально (woff2, subset latin+cyrillic).
- `RockStar` (256), `tfutura` (208), `evolventavetrino` (10), `Bounded`, `Inter`, `Roboto`, `Nunito Sans` — упоминаются в стилях, но `@font-face` для них **нет** → на живом сайте это фолбэк на системный шрифт. Не тащить, при переносе явно заменить на то, что реально рендерится (проверить на живом сайте computed font-family).
- `font-family: var(...)` (3 328) — CSS-переменные Тильды.

## 5. Поведения, которые нужно сохранить (функциональный паритет)

1. **Реферальная программа `?r=`** — при наличии `r` (и `utm_*`) в URL параметры дописываются во внутренние ссылки шапки/меню/блоков курсов (реализовано ~15 отдельными скриптами на разные `#rec…`, часть ссылается на уже несуществующие блоки). На главной ссылка на бот предзаписи `https://t.me/POPOVICHcourse_bot` при наличии `r` подменяется на `https://salebot.site/62b5cbabae0fe1409f44ce65d9274be9_1?utm_content=r%3D<r>`. На страницах курсов есть скрипт, дописывающий `r`+utm в ссылки `lk.popovichfit.ru` внутри блока тарифов. Проверено на живом сайте: `/?r=TESTREF&utm_source=qa` → `/results?r=TESTREF`, `/course_power?r=TESTREF&utm_source=qa`. Страница `/page60771825.html` описывает программу («вывести деньги при достижении 5 000 ₽»), `/part_oferta` — партнёрское соглашение.
2. **Тарифы** — блок `PF_CARDS` (T123, страницы `/new-course`, `/course_correction`, `/course_power`): выбор 1/3/6 потоков переключает цену/старую цену/ссылку `https://lk.popovichfit.ru/payments/tariff_<id>/checkout`. Цены вшиты в JS. Плюс `/korrekciya-new`, `/silovye-new` — iframe на `elenasamanchuk.github.io/popovichfit-tariffs/…` (репо Елены), плашки NASHA с jsDelivr.
3. **Шапка** (Zero Block, fixed, 44px / 34px на мобиле): курсы (`/#rec1120250416`), до/после, статьи, о тренере, вопрос/ответ (`/#question-answer`), тех.поддержка (`tg://resolve?domain=popovichfitCare_Bot`), логотип, кнопка «Личный кабинет» → `https://lk.popovichfit.ru/`, гамбургер `#menu_open`.
4. **Мобильное меню T450** — Главная, Курсы, До/после, Статьи, О тренере, Вопрос-ответ, соцсети (Instagram, Telegram, YouTube), кнопки «ПРЕДЗАПИСЬ» (`tg://resolve?domain=popovichfitcourse_bot`) и «ТЕХ.ПОДДЕРЖКА».
5. **Футер** (Zero Block, `uc-sticky-footer` — «прилипающий» через `clip-path` + fixed): Главная, Курсы, Результаты, Обо мне, Media, Сообщество, Тех.поддержка, 5 юрдоков, Предзапись, Личный кабинет, иконки (shumann.ru, Telegram, YouTube, Instagram, mail `info@popovichfit.ru`).
6. **Cookie-баннер** (Zero Block + скрипт): показывается, пока в `localStorage` нет `cookieConsent=accepted`; закрывается по любому клику на странице (кроме ссылки на политику).
7. **Плашка «Дублируем информацию в других соцсетях → ВК»** (`vk.com/popovichfit`) вверху страниц.
8. **Попапы**: `#zeropopup` («подпишись на бот предзаписи»), `#popup:youtubevideo_*`, `#popup:embedcode*` (Kinescope/YouTube), `#popup:mygallery_*` (фото кураторов/отзывы), `#dop`, `#tarif1..4`, `#about1..7`, `#popup:form1`, `#popup:myform`.
9. **FAQ-аккордеон** («Ответы на вопросы», T585) на главной и страницах курсов; якорь `#question-answer`.
10. **Горизонтальный скролл** Zero-блоков стрелками (VORON / romanyu + scrollbooster) — «из чего состоит курс», «над курсом работают».
11. **Кнопка «наверх»**, плавный скролл к якорям, `history.back()` кнопки «Назад» (116 ссылок `javascript:history.back()` на материалах).
12. **Видео**: Kinescope iframe (`kinescope.io/embed/<id>`, 111 страниц, в т.ч. lazy `data-videolazy-type="kinescope"`), YouTube (200 страниц: ссылки и попапы), 1 Vimeo, 1 Google Drive iframe.
13. **Виджеты поддержки** (взаимоисключающие): Sender `senndder.ru/popovichfit-widget/widget.js` (39 публичных страниц), NN99 `www.nn99.ru/widget.js` (33 страницы материалов), amoCRM social button (126 страниц — в основном legacy).
14. **Аналитика**: Яндекс.Метрика **88400923** (clickmap, trackLinks, accurateTrackBounce, webvisor, ecommerce `dataLayer`, загрузка с задержкой 2 с), VK-пиксель `VK-RTRG-1817271-8E0Ye` (196 страниц), `<meta name="yandex-verification" content="ef3a6b04ad30f479">`. Целей `reachGoal` в коде нет. Tilda stat (`tilda-stat-1.0`) — выбросить.
15. **SEO**: `<title>`, `description`, OG (`og:image` → локальные картинки), `canonical` (на главной `https://popovichfit.ru`), favicon `images/tild3834-3931-4164-b935-643265363733__favicon_5.ico`, `sitemap.xml`, `robots.txt` (+ `sitemap-store.xml` — на живом отдаёт 200, в архиве нет).
16. **Ссылки на приложение**: App Store / Google Play (главная, лендинги). Deep-links `tg://resolve?domain=…` и `https://t.me/…` — оставить как есть.

## 6. Поведение URL на живом сайте (воспроизвести на сервере)

- `http://` → 301 на `https://`. `www.popovichfit.ru` сейчас отдаёт 200 без редиректа (canonical — без www) → лучше 301 на `https://popovichfit.ru`.
- Slug'и без расширения (`/about`), с завершающим слэшем (`/about/`) и **без учёта регистра** (`/About`, флаг `[NC]`) — все 200.
- «Сырые» URL `/pageNNN.html` тоже отдают 200 (и присутствуют в sitemap для страниц без slug).
- 404 — `404.html` (заглушка Тильды с логотипом Tilda) → нужна своя страница 404 в дизайне сайта.
- `/members/*` → `ma_start.html` (Tilda Members, файла нет).

## 7. DNS и инфраструктура

- `popovichfit.ru` → `176.57.64.88` (Tilda, за DDoS-Guard); `www` → тот же IP. NS: `ns1/ns2.hosting.reg.ru` — DNS ведётся в панели хостинга reg.ru.
- `lk.popovichfit.ru` → `158.160.195.8` (Yandex Cloud, nginx/Ubuntu, NN99). Куки ЛК выставляются на `.popovichfit.ru` (`popovichfit_session`, `XSRF-TOKEN`) — будут долетать и на основной домен; для статического сайта безвредно.
- MX → `mx1/mx2.hosting.reg.ru` (почта на reg.ru), TXT: SPF (`include:_spf.hosting.reg.ru include:spf.unisender.com`), `unisender-go-validate-hash` — **не трогать при смене A-записи**.
- Прецедент команды: kochfit.ru (тоже перенесён с Тильды) — Next.js static export на VPS hostline (`212.233.93.50`, nginx/1.24 Ubuntu), деплой rsync (`kochfit-redesign/scripts/deploy-kochfit.mjs`), ЛК `v2.kochfit.ru` на том же IP NN99, что и `lk.popovichfit.ru`.

## 8. Риски и ловушки

- Zero Block 1 651 шт. — ручная адаптивная вёрстка; нельзя «сконвертировать скриптом» в адекватный код (получится абсолютное позиционирование на пяти брейкпоинтах).
- Шрифты Involve исчезнут вместе с Тильдой; Google Fonts в РФ медленные — self-host.
- Картинки: PNG по 2–3 МБ (`frame_1_3.png`, фото), суммарно 635 МБ; нужна конвертация в WebP/AVIF + srcset, но без потери качества на фото Натальи.
- Кастомный код фрилансеров ссылается на `#recNNN` — ids исчезнут; поведения нужно реализовать заново, а не копировать скрипты.
- Формы Тильды (`/gift1`, `/mk_msk`, черновики) и корзина CloudPayments — нет бэкенда. Решение нужно от владельца.
- Collabza/NOLIM/Tilda Members — по факту неактивны для посетителей; но если бонусная программа где-то ещё жива — уточнить.
- Много ссылок `https://popovichfit.ru/...` абсолютные — при переносе делать относительными, чтобы работать на стейджинг-домене.
- Ссылки `/#recNNN` (якорь «курсы» в шапке) могут быть в Telegram-постах/рекламе — сохранить старые якоря как алиасы.
- В `sitemap.xml` Тильды попали черновики — новый sitemap собирать только из перенесённых страниц.
- `guide_makeup` (3 МБ, 70 Zero Block) и `inventory` (2 МБ, 20 Zero Block) — самые тяжёлые страницы.
