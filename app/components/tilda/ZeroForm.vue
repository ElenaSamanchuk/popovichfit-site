<script setup lang="ts">
// Форма внутри Zero Block (tn-atom__form). Поля — из data-value экспорта: [{li_type:'em'|'ph'|'in'|'nm'|'ta'|'cb'|'uw', li_name, li_title, li_ph, li_rows, li_req}].
// Отправка — на свой сервер /api/lead (server/api/lead.post.ts): письмо/Telegram по настройкам окружения.
interface Field { lid?: string; li_type?: string; li_name?: string; li_title?: string; li_ph?: string; li_nm?: string; li_req?: string; li_rows?: string }
const props = defineProps<{ fields: Field[]; services: string[]; elemId: string; formName?: string }>()
const values = reactive<Record<string, string>>({})
const state = ref<'idle' | 'sending' | 'ok' | 'error'>('idle')
const error = ref('')
const previewMode = Boolean(useRuntimeConfig().public.previewMode)
const formEl = ref<HTMLFormElement | null>(null)
// после отправки поля скрываются: форма держит прежнюю высоту, надпись об успехе стоит по её центру
const keptHeight = ref(0)

const fieldKey = (f: Field) => f.li_name || f.li_nm || f.lid!
const isRequired = (f: Field) => f.li_req === 'y' || f.li_req === '1' || f.li_type === 'em'
// файл на сервер не передаётся: в заявку уходит только его имя
function pickFile(f: Field, e: Event) {
  values[fieldKey(f)] = [...((e.target as HTMLInputElement).files ?? [])].map((file) => file.name).join(', ')
}

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
      <div v-for="f in fields" :key="f.lid || f.li_name" class="tz-form__group">
        <label v-if="f.li_title && f.li_type !== 'cb'" :for="`${elemId}-${f.lid}`" class="tz-form__title">{{ f.li_title }}</label>
        <textarea v-if="f.li_type === 'ta'" :id="`${elemId}-${f.lid}`" v-model="values[fieldKey(f)]" :placeholder="f.li_ph" :required="isRequired(f)" :style="{ '--rows': f.li_rows || 3 }" class="tz-form__input" />
        <label v-else-if="f.li_type === 'cb'" class="flex items-center gap-2 text-[12px]"><input type="checkbox" :required="isRequired(f)" @change="values[fieldKey(f)] = ($event.target as HTMLInputElement).checked ? 'да' : ''">{{ f.li_ph }}</label>
        <label v-else-if="f.li_type === 'uw'" class="tz-form__file">
          <input :id="`${elemId}-${f.lid}`" type="file" class="tz-form__file-input" :required="isRequired(f)" @change="pickFile(f, $event)">
          <span class="tz-form__file-btn pf-btn-blue">Выбрать файл</span>
          <span class="tz-form__file-name">{{ values[fieldKey(f)] }}</span>
        </label>
        <input v-else :id="`${elemId}-${f.lid}`" v-model="values[fieldKey(f)]" :type="f.li_type === 'em' ? 'email' : f.li_type === 'ph' ? 'tel' : 'text'" :placeholder="f.li_ph" :required="isRequired(f)" class="tz-form__input">
      </div>
      <button type="submit" class="pf-btn-blue h-[45px] rounded-[6px] text-[12px] font-bold uppercase text-white" :disabled="state === 'sending'">{{ state === 'sending' ? 'Отправляем…' : 'Отправить' }}</button>
      <p v-if="state === 'error'" class="text-[12px] text-[#f83e60]">{{ error }}</p>
    </template>
    <p v-else class="tz-form__ok text-[18px] font-semibold text-ink">Спасибо! Заявка отправлена.</p>
  </form>
</template>

<style>
.tz-form__group { display: flex; flex-direction: column; }
.tz-form__title { display: block; color: #000; font-size: calc(16 * var(--u, 1px)); line-height: normal; padding-bottom: calc(5 * var(--u, 1px)); }
.tz-form__input { height: 45px; width: 100%; border: 1px solid #dbdbdb; border-radius: 0; padding: 0 calc(20 * var(--u, 1px)); color: #000; font-size: 14px; line-height: 1.33; background: #fff; }
/* высота многострочного поля по числу строк из экспорта; селектор сильнее правил zero-forms.css */
.tz-form textarea.tz-form__input { height: calc((var(--rows, 3) * 25 + 10) * var(--u, 1px)); padding-top: calc(10 * var(--u, 1px)); resize: none; }
.tz-form__file { position: relative; display: flex; align-items: center; gap: 12px; cursor: pointer; }
.tz-form__file-input { position: absolute; left: 0; top: 0; width: 1px; height: 1px; opacity: 0; }
.tz-form__file-btn { display: inline-flex; align-items: center; height: calc(38 * var(--u, 1px)); padding: 0 calc(20 * var(--u, 1px)); border-radius: calc(6 * var(--u, 1px)); color: #fff; font-size: calc(14 * var(--u, 1px)); }
.tz-form__file-input:focus-visible + .tz-form__file-btn { outline: 2px solid #4f86c4; outline-offset: 1px; }
.tz-form__file-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; }
.tz-form__input:focus { outline: 2px solid #4f86c4; outline-offset: 1px; }
/* успех по центру области формы: высота блока задана макетом и после скрытия полей не меняется */
.tz-form__ok { margin: auto; text-align: center; animation: tz-form-ok .3s ease-out both; }
@keyframes tz-form-ok { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
/* Safari на телефоне увеличивает страницу при фокусе на поле мельче 16 px */
@media (max-width: 959.98px) { .tz-form__input { font-size: 16px; } }
</style>
