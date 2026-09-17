// Доставка уведомлений о заявках/заказах: Telegram (NUXT_TELEGRAM_BOT_TOKEN + NUXT_TELEGRAM_CHAT_ID) и/или
// почта (NUXT_SMTP_URL smtp://user:pass@host:port + NUXT_MAIL_TO, nodemailer подключается динамически).
// Плюс журнал в .data/<file>.jsonl на сервере — единственный канал, пока каналы не настроены.
import fs from 'node:fs'
import path from 'node:path'

export async function notify(subject: string, text: string): Promise<boolean> {
  const config = useRuntimeConfig()
  let delivered = false
  if (config.telegramBotToken && config.telegramChatId) {
    const res = await $fetch<{ ok: boolean }>(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
      method: 'POST', body: { chat_id: config.telegramChatId, text: `${subject}\n${text}` },
    }).catch(() => null)
    delivered = !!res?.ok
  }
  if (config.smtpUrl && config.mailTo) {
    try {
      const nodemailer = await import('nodemailer').catch(() => null)
      if (nodemailer) {
        const transport = nodemailer.default.createTransport(config.smtpUrl)
        await transport.sendMail({ to: config.mailTo, from: config.mailTo, subject, text })
        delivered = true
      }
    } catch { /* письмо не ушло — запись в журнале останется с delivered:false */ }
  }
  return delivered
}

/** строка в журнал .data/<file>.jsonl (создаёт папку при необходимости) */
export function appendLog(file: string, record: Record<string, unknown>) {
  try {
    const dir = path.resolve('.data'); fs.mkdirSync(dir, { recursive: true })
    fs.appendFileSync(path.join(dir, file), JSON.stringify(record) + '\n')
  } catch { /* noop */ }
}

/** чистим поля формы: только непустые строки, ограничиваем длину */
export function cleanFields(fields: unknown): Record<string, string> {
  if (!fields || typeof fields !== 'object') return {}
  return Object.fromEntries(Object.entries(fields as Record<string, unknown>)
    .filter(([, v]) => typeof v === 'string' && v.trim())
    .map(([k, v]) => [k.slice(0, 60), (v as string).trim().slice(0, 2000)]))
}
