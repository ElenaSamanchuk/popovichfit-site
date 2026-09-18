import { links } from './links'

export interface NavItem { label: string; href: string; accent?: boolean; external?: boolean }

/** Шапка (Zero Block #rec1120433846): ссылки в том же порядке, что на Тильде. */
export const headerNav: NavItem[] = [
  { label: 'курсы', href: '/#courses' },
  { label: 'до/после', href: '/results' },
  { label: 'статьи', href: '/media' },
  { label: 'о тренере', href: '/about' },
  { label: 'вопрос/ответ', href: '/#question-answer', accent: true },
  { label: 'тех.поддержка', href: links.supportBot, accent: true, external: true },
]

/** Мобильное меню (T450 #rec592229670). */
export const mobileNav: NavItem[] = [
  { label: 'Главная', href: '/' },
  { label: 'Курсы', href: '/#rec1120250416' }, // блок курсов на главной (как в T450 на живом сайте)
  { label: 'До/после', href: '/results' },
  { label: 'Статьи', href: '/media' },
  { label: 'О тренере', href: '/about' },
  { label: 'Вопрос-ответ', href: '/#question-answer' },
]

/** Футер (Zero Block #rec1120448561). */
export const footerNav: NavItem[] = [
  { label: 'Главная', href: '/' },
  { label: 'Курсы', href: '/' },
  { label: 'Результаты', href: '/results' },
  { label: 'Обо мне', href: '/about' },
  { label: 'Media', href: '/media' },
  { label: 'Сообщество', href: '/community' },
  { label: 'Тех.поддержка', href: links.supportBot, external: true },
]

export const footerLegal: NavItem[] = [
  { label: 'Договор-оферта', href: '/oferta' },
  { label: 'Партнерское соглашение (Договор-оферта) о реферальной программе', href: '/part_oferta' },
  { label: 'Политика в отношении обработки персональных данных', href: '/privacy' },
  { label: 'Согласие на обработку персональных данных', href: '/data-consent' },
  { label: 'Согласие на рассылку информационных сообщений', href: '/consent' },
]
