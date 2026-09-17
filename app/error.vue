<script setup lang="ts">
// Страница ошибки. У Тильды 404 была стандартной пустой страницей «404 Page Not Found.» (без блоков) —
// показываем тот же заголовок в общей обёртке сайта (шапка/футер) и ссылку на главную.
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const is404 = computed(() => props.error?.statusCode === 404)
useSeoMeta({ title: is404.value ? '404 Page Not Found.' : `Ошибка ${props.error?.statusCode || ''}`, robots: 'noindex' })
</script>

<template>
  <NuxtLayout name="default">
    <div class="pf-container flex min-h-[60vh] flex-col items-center justify-center py-[120px] text-center">
      <h1 class="text-[40px] font-semibold leading-[1.2] text-ink max-xs:text-[28px]">{{ is404 ? '404 Page Not Found.' : `Ошибка ${error?.statusCode || ''}` }}</h1>
      <p v-if="!is404" class="mt-[16px] text-[16px] text-[#777]">{{ error?.statusMessage || 'Что-то пошло не так.' }}</p>
      <a href="/" class="pf-btn-blue mt-[30px] inline-flex h-[50px] items-center rounded-[6px] px-[30px] text-[13px] font-bold uppercase text-white" @click.prevent="clearError({ redirect: '/' })">На главную</a>
    </div>
  </NuxtLayout>
</template>
