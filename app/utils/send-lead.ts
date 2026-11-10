// Отправка заявки с формы сайта. В режиме просмотра (POPOVICHFIT_PREVIEW=1, превью и тестовая VM) запрос
// не создаётся: форма проходит обычный путь с проверкой полей и показывает успех, заявка никуда не уходит.
export interface LeadBody { form: string; page: string; fields: Record<string, string> }

export async function sendLead(body: LeadBody, previewMode: boolean): Promise<void> {
  if (previewMode) {
    await new Promise((resolve) => setTimeout(resolve, 400))
    return
  }
  await $fetch('/api/lead', { method: 'POST', body })
}
