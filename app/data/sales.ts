/**
 * Режим продаж — один переключатель на весь сайт (смена: правка этой строки + одна сборка и выкладка).
 *  false (сейчас): продажи закрыты — «/» показывает закрытую главную, /predcor, /predpow, /pred редиректят (302) на курсы/главную;
 *  true: продажи открыты — «/» показывает версию /open, страницы /predcor, /predpow, /pred отдаются.
 * /open и /close работают всегда. Порядок смены и редиректы nginx — README, раздел «Режим продаж».
 */
export const SALES_OPEN = false

/** Адреса страниц продаж и куда их редиректить, пока продажи закрыты (query r/utm и #якорь сохраняются) */
export const SALES_REDIRECTS: Record<string, string> = {
  '/pred': '/',
  '/predcor': '/course_correction',
  '/predpow': '/course_power',
}
/** Данные страниц /predcor, /predpow (app/data/tilda/<файл>.json, делает pages:sync); /pred — своя разметка components/home/html/pred.html */
export const SALES_PAGES: Record<string, string> = {
  '/predcor': 'page41134729.html',
  '/predpow': 'page41134747.html',
}
