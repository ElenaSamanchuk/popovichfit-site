// Приём заявок с форм сайта (замена форм Тильды). Каналы доставки настраиваются переменными окружения:
//   NUXT_TELEGRAM_BOT_TOKEN + NUXT_TELEGRAM_CHAT_ID — сообщение в Telegram;
//   NUXT_SMTP_URL (smtp://user:pass@host:port) + NUXT_MAIL_TO — письмо (nodemailer, подключается динамически).
// Без настроенных каналов заявка пишется в .data/leads.jsonl (локальная разработка) и возвращается ok.
import fs from 'node:fs'
import path from 'node:path'

interface LeadBody { form: string; page?: string; fields: Record<string, string> }

export default defineEventHandler(async (event) => {
  const body = await readBody<LeadBody>(event)
  if (!body || typeof body !== 'object' || !body.fields || typeof body.fields !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Некорректная заявка' })
  }
  // honeypot: скрытое поле website должно быть пустым
  if (body.fields.website) return { ok: true }
  const fields = Object.fromEntries(Object.entries(body.fields).filter(([, v]) => typeof v === 'string' && v.trim()).map(([k, v]) => [k.slice(0, 60), (v as string).trim().slice(0, 2000)]))
  if (!Object.keys(fields).length) throw createError({ statusCode: 400, statusMessage: 'Пустая заявка' })

  const config = useRuntimeConfig()
  const lead = { at: new Date().toISOString(), form: String(body.form || 'form').slice(0, 80), page: String(body.page || '').slice(0, 200), fields, ip: getRequestIP(event, { xForwardedFor: true }) }
  const text = `Заявка с сайта popovichfit.ru\nФорма: ${lead.form}\nСтраница: ${lead.page}\n` + Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n')

  let delivered = false
  if (config.telegramBotToken && config.telegramChatId) {
    const res = await $fetch<{ ok: boolean }>(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
      method: 'POST', body: { chat_id: config.telegramChatId, text },
    }).catch(() => null)
    delivered = !!res?.ok
  }
  if (config.smtpUrl && config.mailTo) {
    try {
      const nodemailer = await import('nodemailer').catch(() => null)
      if (nodemailer) {
        const transport = nodemailer.default.createTransport(config.smtpUrl)
        await transport.sendMail({ to: config.mailTo, from: config.mailTo, subject: `Заявка с сайта: ${lead.form}`, text })
        delivered = true
      }
    } catch { /* письмо не ушло — ниже запишем в файл */ }
  }
  // журнал заявок на сервере (и единственный канал, пока не настроены Telegram/почта)
  try {
    const dir = path.resolve('.data'); fs.mkdirSync(dir, { recursive: true })
    fs.appendFileSync(path.join(dir, 'leads.jsonl'), JSON.stringify({ ...lead, delivered }) + '\n')
  } catch { /* noop */ }
  return { ok: true, delivered }
})
