// Тарифы курсов — данные карточек PF_CARDS из блока T123 экспорта (docs/tilda-custom-code/061_*.html).
// Цены и ссылки на checkout ЛК менять здесь. Ключ = класс карточки pf-card--<ключ> в Zero Block
// (страницы /new-course, /course_correction, /course_power). Тонкий пробел \u2009 в ценах — как в оригинале.
export interface TariffOption { newPrice: string; oldPrice: string; link: string }
export interface TariffCard { defaultOption: number; options: TariffOption[] }
export const tariffs: Record<string, TariffCard> = {
  "korekciya": {
    "defaultOption": 0,
    "options": [
      {
        "newPrice": "3 799 р.",
        "oldPrice": "",
        "link": "https://lk.popovichfit.ru/payments/tariff_D9nEQP/checkout"
      },
      {
        "newPrice": "9 599 р.",
        "oldPrice": "12 899 р.",
        "link": "https://lk.popovichfit.ru/payments/tariff_6KWjno/checkout"
      },
      {
        "newPrice": "17 799 р.",
        "oldPrice": "24 399 р.",
        "link": "https://lk.popovichfit.ru/payments/tariff_qoAM5o/checkout"
      }
    ]
  },
  "korekciya-trener": {
    "defaultOption": 0,
    "options": [
      {
        "newPrice": "5 599 р.",
        "oldPrice": "7 699 р.",
        "link": "https://lk.popovichfit.ru/payments/tariff_Jo4XGo/checkout"
      },
      {
        "newPrice": "14 899 р.",
        "oldPrice": "19 299 р.",
        "link": "https://lk.popovichfit.ru/payments/tariff_2Kd1wP/checkout"
      },
      {
        "newPrice": "25 799 р.",
        "oldPrice": "34 799 р.",
        "link": "https://lk.popovichfit.ru/payments/tariff_wo2xkP/checkout"
      }
    ]
  },
  "silovoj": {
    "defaultOption": 0,
    "options": [
      {
        "newPrice": "4 299 р.",
        "oldPrice": "6 399 р.",
        "link": "https://lk.popovichfit.ru/payments/tariff_B9DEYo/checkout"
      },
      {
        "newPrice": "12 399 р.",
        "oldPrice": "16 599 р.",
        "link": "https://lk.popovichfit.ru/payments/tariff_3o8NwP/checkout"
      },
      {
        "newPrice": "22 399 р.",
        "oldPrice": "29 099 р.",
        "link": "https://lk.popovichfit.ru/payments/tariff_v9vQDP/checkout"
      }
    ]
  },
  "silovoj-trener": {
    "defaultOption": 0,
    "options": [
      {
        "newPrice": "6 699 р.",
        "oldPrice": "8 799 р.",
        "link": "https://lk.popovichfit.ru/payments/tariff_1K7zmo/checkout"
      },
      {
        "newPrice": "18 399 р.",
        "oldPrice": "23 199 р.",
        "link": "https://lk.popovichfit.ru/payments/tariff_dPkm0o/checkout"
      },
      {
        "newPrice": "31 899 р.",
        "oldPrice": "40 899 р.",
        "link": "https://lk.popovichfit.ru/payments/tariff_X9GEVK/checkout"
      }
    ]
  }
}
