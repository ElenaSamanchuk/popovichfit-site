<script setup lang="ts">
// old-site: cookie-баннер = Zero Block #rec2019524321 (карточка 270×152 слева снизу, полупрозрачный
// белый фон, кнопка «Согласен») + скрипт T123 «cookieConsent»: показывать, пока в localStorage нет
// cookieConsent=accepted; скрыть по клику на кнопку или любому клику на странице, кроме ссылки на политику.
const STORAGE_KEY = 'cookieConsent'
const STORAGE_DATE_KEY = 'cookieConsentDate'

const visible = ref(false)
const hiding = ref(false)

function accept() {
  try {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    localStorage.setItem(STORAGE_DATE_KEY, new Date().toISOString())
  } catch { /* приватный режим — просто прячем */ }
  hiding.value = true
  document.removeEventListener('click', onGlobalClick, true)
  setTimeout(() => { visible.value = false }, 400)
}

function onGlobalClick(e: Event) {
  const link = (e.target as HTMLElement | null)?.closest('.cookie-banner-link')
  if (link) return
  accept()
}

onMounted(() => {
  let accepted = false
  try { accepted = localStorage.getItem(STORAGE_KEY) === 'accepted' } catch { accepted = false }
  if (accepted) return
  visible.value = true
  setTimeout(() => document.addEventListener('click', onGlobalClick, true), 100)
})
onBeforeUnmount(() => document.removeEventListener('click', onGlobalClick, true))
</script>

<template>
  <div
    v-if="visible"
    class="cookieBanner fixed bottom-[20px] left-[20px] z-[1000] flex w-[270px] flex-col items-start gap-[12px] rounded-[10px] bg-white/60 p-[12px] shadow-[0_0_4px_0_rgba(150,150,150,0.25)] transition-[opacity,transform] duration-300 max-xs:bottom-[5px] max-xs:left-[5px] max-xs:w-[233px] max-xs:gap-[10px] max-xs:rounded-[6px] max-xs:p-[10px]"
    :class="hiding ? 'translate-y-[20px] opacity-0' : 'translate-y-0 opacity-100'"
    role="region"
    aria-label="Использование cookie"
  >
    <p class="m-0 w-[257px] max-w-full text-[12px] font-medium leading-[1.3] text-[#262626] max-xs:w-[218px] max-xs:text-[10px] max-xs:leading-[1.35]">
      Наш сайт использует куки. Продолжая им пользоваться, вы соглашаетесь на обработку персональных данных в&nbsp;соответствии с
      <NuxtLink to="/privacy" class="cookie-banner-link text-[#4f86c4] underline">политикой в отношении обработки персональных данных</NuxtLink>
    </p>
    <button
      type="button"
      class="cookie-banner-btn flex bg-[#4f86c4] transition-opacity hover:opacity-90 h-[36px] w-[100px] items-center justify-center rounded-[8px] text-[14px] font-bold leading-[1.45] text-white shadow-[0_15px_10px_-13px_rgba(77,101,85,0.4)] max-xs:h-[31px] max-xs:w-[79px] max-xs:rounded-[6px] max-xs:text-[10px]"
      @click="accept"
    >Согласен</button>
  </div>
</template>
