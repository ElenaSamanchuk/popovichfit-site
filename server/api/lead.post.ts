// Приём заявок с форм сайта (замена форм Тильды): формы Zero Block, попапы T702 и другие типовые формы.
// Доставка — server/utils/notify.ts (Telegram / почта по переменным окружения) + журнал .data/leads.jsonl.
interface LeadBody { form: string; page?: string; fields: Record<string, string> }

export default defineEventHandler(async (event) => {
  const body = await readBody<LeadBody>(event)
  if (!body || typeof body !== 'object' || !body.fields || typeof body.fields !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Некорректная заявка' })
  }
  // honeypot: скрытое поле website должно быть пустым
  if (body.fields.website) return { ok: true }
  const fields = cleanFields(body.fields)
  if (!Object.keys(fields).length) throw createError({ statusCode: 400, statusMessage: 'Пустая заявка' })

  const lead = { at: new Date().toISOString(), form: String(body.form || 'form').slice(0, 80), page: String(body.page || '').slice(0, 200), fields, ip: getRequestIP(event, { xForwardedFor: true }) }
  const text = `Форма: ${lead.form}\nСтраница: ${lead.page}\n` + Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n')
  const delivered = await notify('Заявка с сайта popovichfit.ru', text)
  appendLog('leads.jsonl', { ...lead, delivered })
  return { ok: true, delivered }
})
