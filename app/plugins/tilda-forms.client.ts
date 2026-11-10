// Формы типовых блоков Тильды (T702-попапы и др.), отрисованные из HTML экспорта: перехватываем submit
// формы .t-form, проверяем обязательные поля, шлём на /api/lead и показываем стандартные тексты Тильды
// об успехе/ошибке в её же контейнерах (.js-successbox / .js-errorbox-all).
const SUCCESS = 'Спасибо! Данные успешно отправлены.'
const ERR = { req: 'Пожалуйста, заполните все обязательные поля', email: 'Укажите, пожалуйста, корректный email', phone: 'Укажите, пожалуйста, корректный номер телефона', name: 'Укажите, пожалуйста, имя' }

function showError(form: HTMLFormElement, text: string) {
  const box = form.querySelector<HTMLElement>('.js-errorbox-all')
  if (!box) { alert(text); return }
  box.querySelectorAll<HTMLElement>('.js-rule-error').forEach((li) => { li.textContent = ''; li.style.display = 'none' })
  const li = box.querySelector<HTMLElement>('.js-rule-error-all') || box.querySelector<HTMLElement>('li')
  if (li) { li.textContent = text; li.style.display = 'block' }
  box.style.display = 'block'
  const mid = form.querySelector<HTMLElement>('.t-form__errorbox-middle'); if (mid) mid.style.display = 'block'
}

function validate(form: HTMLFormElement): string {
  for (const input of form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea, select')) {
    if (input.type === 'hidden' || input.type === 'submit' || input.name === 'website') continue
    const v = (input.value || '').trim()
    const req = input.getAttribute('data-tilda-req') === '1' || input.required
    if (input.type === 'checkbox') { if (req && !(input as HTMLInputElement).checked) return ERR.req; continue }
    if (req && !v) return ERR.req
    const rule = input.getAttribute('data-tilda-rule')
    if (v && (rule === 'email' || input.type === 'email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return ERR.email
    if (v && (rule === 'phone' || input.type === 'tel') && v.replace(/\D/g, '').length < 10) return ERR.phone
  }
  return ''
}

export default defineNuxtPlugin((nuxtApp) => {
  const previewMode = Boolean(useRuntimeConfig().public.previewMode)
  nuxtApp.hook('app:mounted', () => {
    document.addEventListener('submit', async (e) => {
      const form = e.target as HTMLFormElement | null
      if (!form || !form.matches('form.t-form') || form.closest('.pf-cart')) return
      e.preventDefault()
      const err = validate(form)
      if (err) { showError(form, err); return }
      const fields: Record<string, string> = {}
      for (const input of form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea, select')) {
        if (!input.name || input.type === 'hidden' || input.type === 'submit') continue
        const group = input.closest<HTMLElement>('.t-input-group')
        const label = group?.querySelector('.t-input-title')?.textContent?.trim() || group?.getAttribute('data-field-name') || input.placeholder || input.name
        if (input.type === 'checkbox') { if ((input as HTMLInputElement).checked) fields[label] = 'да'; continue }
        if (input.value.trim()) fields[label] = input.value.trim()
      }
      const submit = form.querySelector<HTMLButtonElement>('[type="submit"]')
      if (submit) submit.disabled = true
      const formName = form.querySelector<HTMLInputElement>('input[name="tildaspec-formname"]')?.value
        || form.closest('[data-tilda-rec]')?.getAttribute('data-tilda-rec') || form.id || 'form'
      try {
        await sendLead({ form: formName, page: location.pathname, fields }, previewMode)
        form.querySelectorAll<HTMLElement>('.t-form__inputsbox, .t-form__submit, .t-form__errorbox-middle').forEach((el) => { el.style.display = 'none' })
        const ok = form.querySelector<HTMLElement>('.js-successbox')
        if (ok) { ok.textContent = ok.textContent?.trim() || SUCCESS; ok.style.display = 'block' }
        // заголовок/описание попапа оставляем, форму заменяем сообщением
      } catch {
        showError(form, 'Не удалось отправить. Попробуйте ещё раз или напишите в тех.поддержку.')
      } finally {
        if (submit) submit.disabled = false
      }
    }, true)
  })
})
