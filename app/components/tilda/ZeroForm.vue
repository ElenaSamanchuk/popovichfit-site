<script setup lang="ts">
// Форма внутри Zero Block (tn-atom__form). Поля — из data-value экспорта: [{li_type:'em'|'ph'|'in'|'ta'|'cb', li_name, li_ph}].
// Отправка — на свой сервер /api/lead (server/api/lead.post.ts): письмо/Telegram по настройкам окружения.
interface Field { lid?: string; li_type?: string; li_name?: string; li_ph?: string; li_nm?: string; li_req?: string }
const props = defineProps<{ fields: Field[]; services: string[]; elemId: string; formName?: string }>()
const values = reactive<Record<string, string>>({})
const state = ref<'idle' | 'sending' | 'ok' | 'error'>('idle')
const error = ref('')
const previewMode = Boolean(useRuntimeConfig().public.previewMode)
const formEl = ref<HTMLFormElement | null>(null)
// после отправки поля скрываются: форма держит прежнюю высоту, надпись об успехе стоит по её центру
const keptHeight = ref(0)

async function submit() {
  state.value = 'sending'
  error.value = ''
  try {
    await sendLead({ form: props.formName || 'zero-' + props.elemId, page: location.pathname, fields: { ...values } }, previewMode)
    keptHeight.value = formEl.value?.offsetHeight ?? 0
    state.value = 'ok'
  } catch (e: any) {
    state.value = 'error'
    error.value = e?.data?.message || 'Не удалось отправить. Попробуйте ещё раз или напишите в тех.поддержку.'
  }
}
</script>

<template>
  <form ref="formEl" class="tz-form flex h-full w-full flex-col gap-[10px]" :style="keptHeight ? { minHeight: keptHeight + 'px' } : undefined" @submit.prevent="submit">
    <template v-if="state !== 'ok'">
      <template v-for="f in fields" :key="f.lid || f.li_name">
        <textarea v-if="f.li_type === 'ta'" v-model="values[f.li_name || f.lid!]" :placeholder="f.li_ph" class="tz-form__input min-h-[80px]" />
        <label v-else-if="f.li_type === 'cb'" class="flex items-center gap-2 text-[12px]"><input type="checkbox" @change="values[f.li_name || f.lid!] = ($event.target as HTMLInputElement).checked ? 'да' : ''">{{ f.li_ph }}</label>
        <input v-else v-model="values[f.li_name || f.lid!]" :type="f.li_type === 'em' ? 'email' : f.li_type === 'ph' ? 'tel' : 'text'" :placeholder="f.li_ph" :required="f.li_req === '1' || f.li_type === 'em'" class="tz-form__input">
      </template>
      <button type="submit" class="pf-btn-blue h-[45px] rounded-[6px] text-[12px] font-bold uppercase text-white" :disabled="state === 'sending'">{{ state === 'sending' ? 'Отправляем…' : 'Отправить' }}</button>
      <p v-if="state === 'error'" class="text-[12px] text-[#f83e60]">{{ error }}</p>
    </template>
    <p v-else class="tz-form__ok text-[18px] font-semibold text-ink">Спасибо! Заявка отправлена.</p>
  </form>
</template>

<style>
.tz-form__input { height: 45px; width: 100%; border: 1px solid #dbdbdb; border-radius: 6px; padding: 0 14px; font-size: 14px; background: #fff; }
.tz-form__input:focus { outline: 2px solid #4f86c4; outline-offset: 1px; }
/* успех по центру области формы: высота блока задана макетом и после скрытия полей не меняется */
.tz-form__ok { margin: auto; text-align: center; animation: tz-form-ok .3s ease-out both; }
@keyframes tz-form-ok { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
/* Safari на телефоне увеличивает страницу при фокусе на поле мельче 16 px */
@media (max-width: 959.98px) { .tz-form__input { font-size: 16px; } }
</style>
