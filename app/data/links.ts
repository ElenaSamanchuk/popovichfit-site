/** Все внешние ссылки сайта в одном месте (боты, ЛК, соцсети, приложения). Значения — из экспорта Тильды. */
export const links = {
  lk: 'https://lk.popovichfit.ru/',
  /** Бот предзаписи (Telegram deep-link, как в оригинале) */
  preorderBot: 'tg://resolve?domain=popovichfitcourse_bot',
  preorderBotWeb: 'https://t.me/POPOVICHcourse_bot',
  /** Ссылка на бот предзаписи через salebot — подставляется при наличии ?r= (реферальная программа) */
  preorderBotSalebot: (r: string) => `https://salebot.site/62b5cbabae0fe1409f44ce65d9274be9_1?utm_content=r%3D${encodeURIComponent(r)}`,
  supportBot: 'tg://resolve?domain=popovichfitCare_Bot',
  supportBotWeb: 'https://t.me/PopovichfitCare_Bot',
  telegramNatalya: 'tg://resolve?domain=natalyapopovich87',
  telegramNatalyaWeb: 'https://t.me/natalyapopovich87',
  instagram: 'https://instagram.com/natalyapopovich?igshid=MmJiY2I4NDBkZg==',
  youtube: 'https://www.youtube.com/@popovichfit',
  vk: 'https://vk.com/popovichfit',
  email: 'mailto:info@popovichfit.ru',
  appStore: 'https://apps.apple.com/ru/app/popovichfit-%D1%83%D0%BC%D0%BD%D1%8B%D0%B9-%D1%84%D0%B8%D1%82%D0%BD%D0%B5%D1%81/id6736619389',
  googlePlay: 'https://play.google.com/store/apps/details?id=com.popovichfit.twopcsth',
  shumann: 'https://shumann.ru/',
} as const
