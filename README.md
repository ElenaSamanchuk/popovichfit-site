# popovichfit-site — перенос popovichfit.ru с Тильды в код

Подготовка (16.09.2026): аудит экспорта и промпт для агента. Самого сайта в репозитории пока нет.

Решения: стек Nuxt 4 (Vue 3) + Tailwind 4 + TS, статическая генерация; переносим все 220 страниц с сохранением URL; виджет поддержки — Sender; GitHub, сервер и DNS — позже, сейчас только локально.

- [PROMPT.md](PROMPT.md) — исчерпывающее ТЗ/промпт для агента; в §14 таблица серых зон, которую нужно заполнить.
- [docs/TILDA-AUDIT.md](docs/TILDA-AUDIT.md) — что внутри экспорта, зависимости от Тильды, поведения для паритета, риски.
- [docs/old-site-url-map.md](docs/old-site-url-map.md) — все 220 страниц по категориям (A ядро … S черновики) + 49 пустых маршрутов.
- [docs/custom-code-inventory.md](docs/custom-code-inventory.md) — 225 уникальных блоков «HTML-код»; тексты в `docs/tilda-custom-code/`.
- `old-site/` — распакованный экспорт Тильды (в git не попадает), `old-site/_fonts-tildacdn/` — шрифты Involve/Manrope с Tilda CDN.
- `scripts/audit/` — скрипты, которыми сгенерированы документы: `urlmap.py`, `t123.py`, `analyze.py`, `outline.py <file.html>`, `graph.py`.

Исходный архив: `~/Downloads/natalya-popovich_3e2230807a6d35e2376a7f268346a5b84709a629.zip`.
