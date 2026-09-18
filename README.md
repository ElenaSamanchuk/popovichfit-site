# popovichfit.ru — сайт без Тильды

Репозиторий: https://github.com/ElenaSamanchuk/popovichfit-site (приватный). Тестовый сервер: http://146.185.241.179 (до переноса DNS).

Nuxt 4 (Vue 3, Tailwind 4, TypeScript). Все 220 страниц экспорта Тильды перенесены с сохранением адресов 1:1,
без единой ссылки на серверы Тильды. Личный кабинет `lk.popovichfit.ru` (NN99) не трогаем — все ссылки на него как были.

## Как устроено

| Что | Где |
|---|---|
| Все страницы (включая главную): данные экспорта → универсальный рендерер | `app/pages/index.vue`, `app/pages/[...tilda].vue` → `app/data/tilda/<pageNNN>.json` → `app/components/tilda/TildaPage.vue` |
| Zero Block (T396): элементы/группы/артборды 1600–320, sbs-анимации, blur → CSS | `app/components/tilda/ZeroBlock.vue`, `ZeroNode.vue`, `ZeroElem.vue`, `app/utils/tilda-css.ts` |
| Типовые блоки Тильды (FAQ, табы, попапы, слайдеры/галереи T746, видео…) — свой JS вместо runtime Тильды | `app/components/tilda/TildaBlock.vue`, CSS экспорта `app/assets/css/tilda-blocks-export.css` (`scripts/audit/extract_block_css.py`) |
| Скрытые (неопубликованные) страницы: 404 без `?preview=<NUXT_PREVIEW_TOKEN>`, нет в sitemap | `docs/unpublished.json` → `npm run pages:sync`, `server/middleware/unpublished.ts` |
| Общие части: шапка, меню, футер, cookie, плашка ВК, виджет Sender | `app/components/site/*`, `app/layouts/default.vue` |
| Мета страниц (title/description/og/canonical/noindex) | `app/data/pages.ts` (из `docs/meta.json`), `app/composables/usePageMeta.ts` |
| Карточки тарифов (варианты/цены/ссылки на checkout ЛК) | `app/data/tariffs.ts`, `app/utils/pf-cards.ts` |
| Реферальный `?r=` и utm во всех ссылках (в т.ч. на ЛК) | `app/plugins/ref-params.client.ts` |
| Попапы по hash (`#popup:x`, `#zeropopup`, `#tarif1`…) | `app/composables/useModal.ts`, `app/plugins/modal-links.client.ts` |
| Корзина (T706, `#order:Товар=цена`) + оплата CloudPayments | `app/components/site/Cart.vue`, `server/api/order.post.ts`, `server/api/cloudpayments/pay.post.ts` |
| Формы (Zero Block и попапы T702) | `app/components/tilda/ZeroForm.vue`, `app/plugins/tilda-forms.client.ts`, `server/api/lead.post.ts` |
| Горизонтальный скролл со стрелками | `app/components/tilda/HScroll.vue` |
| Анимации появления (t-animate Тильды), hover-переходы, слайдеры/аккордеон/табы | `app/utils/appear.ts`, `app/utils/tilda-css.ts`, `app/components/tilda/TildaBlock.vue`, CSS в `app/assets/css/tilda-blocks.css` |
| Редиректы старых адресов, 404, sitemap, robots | `server/middleware/redirects.ts`, `app/error.vue`, `server/routes/sitemap.xml.ts`, `public/robots.txt` |
| Картинки экспорта (WebP), шрифты (Involve/Manrope/Unbounded — свои файлы) | `public/img/**`, `public/fonts/**` |

Данные страниц (`app/data/tilda/*.json`, 69 МБ) генерируются из экспорта скриптом `scripts/audit/build_tilda_json.py`
(экспорт лежит в `old-site/`, в git не попадает) и отдаются серверу как ассеты (`server/api/tilda/[file].get.ts`).

Точечные поправки данных (битые группы экспорта, правки текстов с живого сайта) — `scripts/audit/fixups.json`.

## Команды

```bash
npm run dev            # http://localhost:3500
npm run build          # сборка: пререндер всех страниц + node-сервер (.output) + проверки
npm run start          # node .output/server/index.mjs (порт из PORT, по умолчанию 3000)
npm run generate       # чисто статическая сборка (.output/public), формы через NUXT_PUBLIC_API_BASE
npm run check:urls     # все URL экспорта на месте
npm run check:links    # внутренние ссылки ведут на существующие страницы
npm run check:no-tilda # ни одной ссылки на tilda.cc / tildacdn.com / tilda.ws
```

Сверка с живым сайтом (пока он доступен): `node scripts/measure-diff.mjs /url [1200|320]`, `node scripts/measure-diff-all.mjs 1200`
(→ `docs/specs/diff/SUMMARY.md`), скриншоты `scripts/shoot-live.mjs` / `shoot-local.mjs` / `compare.mjs`, SEO — `scripts/check-seo.mjs`.

## Окружение и деплой

Переменные — `.env.example` (уведомления о заявках в Telegram/почту, ключи CloudPayments, адрес сайта).
Без настроенных каналов заявки и заказы пишутся в `.data/leads.jsonl` и `.data/orders.jsonl`.

Сервер: `deploy/server-setup.sh` (один раз, на сервере), затем `deploy/deploy.sh` с локальной машины
(сборка → rsync → symlink `current` → перезапуск сервиса). nginx отдаёт пререндер из `public/`, `/api/*` и sitemap — node.
Подробности переноса и решений — `docs/HANDOFF.md`, статус страниц — `docs/MIGRATION-STATUS.md`, QA — `docs/QA-REPORT.md`.
