// Заказ из корзины (замена T706 Тильды, страницы с покупкой сертификата в подарок и т.п.).
// Сохраняем заказ (.data/orders.jsonl), уведомляем менеджера, возвращаем номер заказа — по нему клиент
// открывает виджет CloudPayments (NUXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID); подтверждение оплаты —
// вебхук server/api/cloudpayments/pay.post.ts.
import { randomUUID } from 'node:crypto'

interface OrderBody { page?: string; product: { name: string; price: number; quantity?: number }; fields: Record<string, string>; promocode?: string }

export default defineEventHandler(async (event) => {
  const body = await readBody<OrderBody>(event)
  const p = body?.product
  if (!p || typeof p.name !== 'string' || !p.name.trim() || !Number.isFinite(+p.price) || +p.price <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Некорректный заказ' })
  }
  if (body.fields?.website) return { ok: true, orderId: 'spam' }
  const fields = cleanFields(body.fields)
  const email = Object.entries(fields).find(([k, v]) => /email|почт/i.test(k) && v.includes('@'))?.[1] || ''
  const quantity = Math.max(1, Math.min(99, Math.round(+(p.quantity || 1))))
  const amount = Math.round(+p.price * quantity)
  const orderId = new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + randomUUID().slice(0, 8)
  const order = {
    at: new Date().toISOString(), orderId, page: String(body.page || '').slice(0, 200),
    product: { name: p.name.trim().slice(0, 200), price: +p.price, quantity }, amount, currency: 'RUB',
    promocode: String(body.promocode || '').slice(0, 60), fields, email, status: 'new',
    ip: getRequestIP(event, { xForwardedFor: true }),
  }
  const text = `Заказ №${orderId}\nТовар: ${order.product.name} × ${quantity}\nСумма: ${amount} р.\nСтраница: ${order.page}\n`
    + (order.promocode ? `Промокод: ${order.promocode}\n` : '') + Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n')
    + '\nСтатус: ожидает оплаты (CloudPayments)'
  const delivered = await notify('Новый заказ на popovichfit.ru', text)
  appendLog('orders.jsonl', { ...order, delivered })
  const config = useRuntimeConfig()
  return { ok: true, orderId, amount, currency: 'RUB', email, delivered, cloudpaymentsPublicId: config.public.cloudpaymentsPublicId || '' }
})
