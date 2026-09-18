<script setup lang="ts">
// Окно корзины/заказа (замена блока T706 Тильды). Поля формы, подпись кнопки и валюта — из разметки
// блока экспорта (block.html). Отправка: POST /api/order → номер заказа → виджет CloudPayments
// (NUXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID); без настроенного publicId заказ просто фиксируется и уходит менеджеру.
import type { TildaBlock } from '~/utils/tilda-css'

const props = defineProps<{ block: TildaBlock }>()
const cart = useCart()
const config = useRuntimeConfig()

interface Field { type: string; name: string; label: string; placeholder: string; required: boolean }
/** поля из .t-input-group экспорта: nm/em/ph/in/pc(промокод) */
const fields = computed<Field[]>(() => {
  const h = props.block.html || ''
  const out: Field[] = []
  for (const m of h.matchAll(/<div class="t-input-group t-input-group_(\w+)[^"]*"[^>]*data-field-name="([^"]*)"[^>]*>([\s\S]*?)<div class="t-input-error/g)) {
    const [, type, name, inner] = m
    const label = (inner.match(/class="t-input-title[^>]*>([\s\S]*?)<\/(?:label|div)>/)?.[1] || '').replace(/<[^>]+>/g, '').trim()
    const placeholder = inner.match(/placeholder="([^"]*)"/)?.[1] || ''
    const required = /data-tilda-req="1"/.test(inner)
    out.push({ type: type!, name: name || label || type!, label, placeholder, required })
  }
  return out.length ? out : [{ type: 'nm', name: 'Name', label: 'Ваше имя', placeholder: '', required: true }, { type: 'em', name: 'Email', label: 'Ваш email', placeholder: '', required: true }, { type: 'ph', name: 'Phone', label: 'Ваш телефон', placeholder: '', required: true }]
})
const submitText = computed(() => props.block.html?.match(/t-btnflex__text">([^<]*)</)?.[1]?.trim() || 'Купить')
const currency = computed(() => props.block.html?.match(/data-project-currency="([^"]*)"/)?.[1] || 'р.')
const fmt = (n: number) => n.toLocaleString('ru-RU') + ' ' + currency.value

const values = reactive<Record<string, string>>({})
const state = ref<'idle' | 'sending' | 'paying' | 'ok' | 'error'>('idle')
const error = ref('')
const orderId = ref('')

const promoField = computed(() => fields.value.find((f) => f.type === 'pc'))
const total = computed(() => (cart.product.value ? cart.product.value.price * cart.product.value.quantity : 0))

function validate(): string {
  for (const f of fields.value) {
    const v = (values[f.name] || '').trim()
    if (f.type === 'pc') continue
    if (f.required && !v) return 'Пожалуйста, заполните все обязательные поля'
    if (f.type === 'em' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Укажите, пожалуйста, корректный email'
    if (f.type === 'ph' && v && v.replace(/\D/g, '').length < 10) return 'Укажите, пожалуйста, корректный номер телефона'
  }
  return ''
}

async function submit() {
  const p = cart.product.value
  if (!p) return
  error.value = validate()
  if (error.value) return
  state.value = 'sending'
  try {
    const formFields: Record<string, string> = {}
    for (const f of fields.value) if (f.type !== 'pc' && values[f.name]) formFields[f.label || f.name] = values[f.name]!
    const res = await $fetch<{ ok: boolean; orderId: string; amount: number; email: string; cloudpaymentsPublicId: string }>('/api/order', {
      method: 'POST', body: { page: location.pathname, product: p, fields: formFields, promocode: promoField.value ? values[promoField.value.name] || '' : '' },
    })
    orderId.value = res.orderId
    const publicId = res.cloudpaymentsPublicId || config.public.cloudpaymentsPublicId
    if (publicId) {
      state.value = 'paying'
      await pay(publicId, res)
    } else {
      state.value = 'ok'
    }
  } catch (e: any) {
    state.value = 'error'
    error.value = e?.data?.statusMessage || e?.data?.message || 'Не удалось оформить заказ. Попробуйте ещё раз или напишите в тех.поддержку.'
  }
}

/** виджет CloudPayments (внешний скрипт платёжной системы, не Тильды) */
function loadWidget(): Promise<any> {
  return new Promise((resolve, reject) => {
    const w = window as any
    if (w.cp?.CloudPayments) return resolve(w.cp)
    const s = document.createElement('script')
    s.src = 'https://widget.cloudpayments.ru/bundles/cloudpayments.js'
    s.onload = () => resolve((window as any).cp)
    s.onerror = () => reject(new Error('CloudPayments widget'))
    document.head.appendChild(s)
  })
}
async function pay(publicId: string, order: { orderId: string; amount: number; email: string }) {
  const p = cart.product.value!
  const cp = await loadWidget()
  await new Promise<void>((resolve) => {
    new cp.CloudPayments().pay('charge', {
      publicId, description: p.name, amount: order.amount, currency: 'RUB', invoiceId: order.orderId,
      accountId: order.email || undefined, email: order.email || undefined, skin: 'mini',
      data: { orderId: order.orderId, product: p.name, ...values },
    }, {
      onSuccess: () => { state.value = 'ok'; resolve() },
      onFail: (reason: string) => { state.value = 'error'; error.value = 'Оплата не прошла: ' + (reason || 'попробуйте ещё раз'); resolve() },
      onComplete: () => resolve(),
    })
  })
}

// ссылки «в корзину»: href="#order:Название=цена" (перехватываем клики по всей странице)
function onClick(e: MouseEvent) {
  const a = (e.target as HTMLElement | null)?.closest('a[href*="#order:"]') as HTMLAnchorElement | null
  if (!a) return
  const p = cart.parseOrderHref(a.getAttribute('href') || '')
  if (!p) return
  e.preventDefault()
  state.value = 'idle'; error.value = ''
  cart.add(p)
}
function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && cart.isOpen.value) cart.close() }
onMounted(() => { document.addEventListener('click', onClick, true); document.addEventListener('keydown', onKey) })
onBeforeUnmount(() => { document.removeEventListener('click', onClick, true); document.removeEventListener('keydown', onKey); cart.close() })
</script>

<template>
  <Teleport to="body">
    <Transition name="pf-modal">
      <div v-if="cart.isOpen.value && cart.product.value" class="pf-cart fixed inset-0 z-[100000] overflow-y-auto bg-black/80" role="dialog" aria-modal="true" aria-label="Корзина" @click.self="cart.close()">
        <button type="button" class="fixed right-[20px] top-[20px] z-[2] flex h-[23px] w-[23px] items-center justify-center max-xs:right-[12px] max-xs:top-[12px]" aria-label="Закрыть корзину" @click="cart.close()">
          <svg width="23" height="23" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg" role="presentation"><g fill="#fff" fill-rule="evenodd"><rect transform="translate(11.313708, 11.313708) rotate(-45) translate(-11.313708, -11.313708)" x="10.3137085" y="-3.6862915" width="2" height="30" /><rect transform="translate(11.313708, 11.313708) rotate(-315) translate(-11.313708, -11.313708)" x="10.3137085" y="-3.6862915" width="2" height="30" /></g></svg>
        </button>
        <div class="flex min-h-full items-start justify-center px-[20px] py-[60px] max-xs:px-[10px] max-xs:py-[40px]">
          <div class="pf-modal__box relative w-full max-w-[560px] rounded-[10px] bg-white p-[40px] max-xs:p-[20px]" @click.stop>
            <div class="mb-[30px] text-[26px] font-semibold leading-[1.23] text-ink">Ваш заказ</div>

            <div class="flex items-start justify-between gap-[20px] border-b border-[#e5e5e5] py-[20px]">
              <div class="text-[16px] font-medium leading-[1.4] text-ink">{{ cart.product.value.name }}</div>
              <div class="whitespace-nowrap text-[16px] font-semibold text-ink">{{ fmt(cart.product.value.price) }}</div>
            </div>
            <div class="flex items-center justify-between py-[20px] text-[18px] font-semibold text-ink">
              <span>Итого:</span><span>{{ fmt(total) }}</span>
            </div>

            <form v-if="state !== 'ok'" class="mt-[10px] flex flex-col gap-[20px]" novalidate @submit.prevent="submit">
              <label v-for="f in fields" :key="f.name" class="block">
                <span v-if="f.label" class="mb-[8px] block text-[14px] font-medium text-ink">{{ f.label }}<span v-if="f.required && f.type !== 'pc'" class="text-[#f83e60]"> *</span></span>
                <input
                  v-model="values[f.name]"
                  :type="f.type === 'em' ? 'email' : f.type === 'ph' ? 'tel' : 'text'"
                  :placeholder="f.placeholder"
                  :autocomplete="f.type === 'em' ? 'email' : f.type === 'ph' ? 'tel' : f.type === 'nm' ? 'name' : 'off'"
                  class="h-[56px] w-full rounded-[6px] border border-black px-[20px] text-[16px] text-black outline-none focus:border-[#4f86c4]"
                >
              </label>
              <input v-model="values.website" type="text" name="website" tabindex="-1" autocomplete="off" class="hidden" aria-hidden="true">
              <p v-if="error" class="text-[14px] text-[#f83e60]">{{ error }}</p>
              <button type="submit" class="h-[56px] rounded-[6px] bg-black text-[16px] font-bold uppercase text-white disabled:opacity-60" :disabled="state === 'sending' || state === 'paying'">
                {{ state === 'sending' ? 'Оформляем…' : state === 'paying' ? 'Ожидаем оплату…' : submitText }}
              </button>
              <p class="text-[12px] leading-[1.5] text-[#777]">Нажимая кнопку, вы соглашаетесь с <a href="/oferta" class="underline">договором-офертой</a> и <a href="/privacy" class="underline">политикой обработки персональных данных</a>.</p>
            </form>
            <div v-else class="py-[10px] text-[16px] leading-[1.55] text-ink">
              <p class="font-semibold">Спасибо! Заказ №{{ orderId }} принят.</p>
              <p class="mt-[8px]">Мы свяжемся с вами по указанным контактам.</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
