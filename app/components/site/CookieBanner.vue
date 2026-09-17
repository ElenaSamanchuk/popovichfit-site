<script setup lang="ts">
// Cookie-баннер — Zero Block со страницы (rec2019524321, артборд fixed внизу) + логика скрипта T123 «cookieConsent»:
// показывать, пока в localStorage нет cookieConsent=accepted; скрыть по клику на кнопку (.cookie-banner-btn) или любому клику
// на странице, кроме ссылки на политику (.cookie-banner-link).
import type { TildaBlock } from '~/utils/tilda-css'
defineProps<{ block: TildaBlock }>()
const STORAGE_KEY = 'cookieConsent'
const STORAGE_DATE_KEY = 'cookieConsentDate'
const visible = ref(false)
const hiding = ref(false)

function accept() {
  try { localStorage.setItem(STORAGE_KEY, 'accepted'); localStorage.setItem(STORAGE_DATE_KEY, new Date().toISOString()) } catch { /* приватный режим */ }
  hiding.value = true
  document.removeEventListener('click', onGlobalClick, true)
  setTimeout(() => { visible.value = false }, 400)
}
function onGlobalClick(e: Event) {
  if ((e.target as HTMLElement | null)?.closest('.cookie-banner-link')) return
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
  <div v-if="visible" class="pf-cookie" :class="hiding ? 'pf-cookie--hidden' : ''" role="region" aria-label="Использование cookie">
    <ZeroBlock :block="block" />
  </div>
</template>

<style>
/* классы из T123 экспорта (.cookieBanner.hidden/.visible) */
.pf-cookie .tz .tz__art { transition: opacity 0.4s ease, transform 0.4s ease; }
.pf-cookie--hidden .tz .tz__art { opacity: 0; transform: translateY(20px); pointer-events: none; }
.pf-cookie .cookie-banner-btn { cursor: pointer; }
</style>
