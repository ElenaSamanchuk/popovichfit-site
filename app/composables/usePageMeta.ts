import { pages } from '~/data/pages'

/** Мета страницы (title/description/og/canonical/noindex) из экспорта Тильды по имени старого файла. */
export function usePageMeta(oldFile: string) {
  const page = pages[oldFile]
  if (!page) throw new Error(`Нет меты для ${oldFile} в app/data/pages.ts`)
  const { siteUrl } = useRuntimeConfig().public
  const canonical = page.url === '/' ? siteUrl : siteUrl + page.url
  useSeoMeta({
    title: page.title,
    description: page.description || undefined,
    ogTitle: page.ogTitle || page.title,
    ogDescription: page.ogDescription || page.description || undefined,
    ogImage: page.ogImageOld ? siteUrl + '/img/og/' + page.ogImageOld.split('/').pop() : undefined,
    ogUrl: canonical,
    ogType: 'website',
    robots: page.noindex ? 'noindex' : undefined,
  })
  useHead({ link: [{ rel: 'canonical', href: canonical }] })
  return page
}
