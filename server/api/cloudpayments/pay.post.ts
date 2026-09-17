// Вебхук CloudPayments «Pay» (уведомление об успешной оплате). В личном кабинете CloudPayments указать
// URL https://popovichfit.ru/api/cloudpayments/pay, кодировка JSON или form. Подпись проверяется по
// заголовку Content-HMAC (HMAC-SHA256 тела запроса ключом NUXT_CLOUDPAYMENTS_API_SECRET).
import { createHmac, timingSafeEqual } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const raw = (await readRawBody(event, 'utf8')) || ''
  if (config.cloudpaymentsApiSecret) {
    const expected = createHmac('sha256', config.cloudpaymentsApiSecret).update(raw).digest('base64')
    const got = getHeader(event, 'content-hmac') || ''
    const ok = expected.length === got.length && timingSafeEqual(Buffer.from(expected), Buffer.from(got))
    if (!ok) { setResponseStatus(event, 403); return { code: 13 } }
  }
  const ct = getHeader(event, 'content-type') || ''
  const data: Record<string, string> = ct.includes('json') ? JSON.parse(raw || '{}') : Object.fromEntries(new URLSearchParams(raw))
  const record = { at: new Date().toISOString(), event: 'pay', orderId: data.InvoiceId || '', transactionId: data.TransactionId || '', amount: data.Amount || '', currency: data.Currency || '', email: data.Email || '', status: data.Status || '', testMode: data.TestMode || '' }
  appendLog('orders.jsonl', { ...record, status: 'paid' })
  await notify('Оплата заказа на popovichfit.ru', `Заказ №${record.orderId}: оплачено ${record.amount} ${record.currency}\nТранзакция ${record.transactionId}\nEmail: ${record.email}`)
  return { code: 0 }
})
