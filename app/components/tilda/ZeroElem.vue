<script setup lang="ts">
// Один элемент Zero Block: text / button / image / shape / vector / html / video / form.
// Геометрия и стили — в CSS (класс .e<id>, см. utils/tilda-css.ts); здесь только разметка и контент.
import type { ZeroElem } from '~/utils/tilda-css'

import { tariffs } from '~/data/tariffs'

const props = defineProps<{ elem: ZeroElem }>()
const e = props.elem
const cls = computed(() => `tz__el tz__el--${e.type} e${e.id}${e.cls ? ' ' + e.cls : ''}${e.flex ? ' tz__flex' : ''}`)

// карточки тарифов: начальное состояние из данных (SSR), клики — utils/pf-cards.ts
const pfKey = inject<string | null>('pfKey', null)
const pf = computed(() => (pfKey && tariffs[pfKey] ? tariffs[pfKey]!.options[tariffs[pfKey]!.defaultOption || 0] : null))
const classes = (e.cls || '').split(' ')
const html = computed(() => {
  if (pf.value && classes.includes('pf-price-new')) return pf.value.newPrice
  if (pf.value && classes.includes('pf-price-old')) return pf.value.oldPrice ? `<s>${pf.value.oldPrice}</s>` : ''
  return e.html
})
const btnText = computed(() => (pf.value && classes.includes('pf-price-new') ? pf.value.newPrice : e.text))
const href = computed(() => (pf.value && classes.includes('pf-buy') ? pf.value.link : e.href))
/** внешняя ссылка? → target/rel; hash и tg: — как есть */
const isExternal = computed(() => !!e.href && /^https?:\/\//.test(e.href) && !e.href.includes('popovichfit.ru'))
const hasIcon = computed(() => Object.values(e.eff ?? {}).some((x) => x.style?.icon))
const isInternal = computed(() => !!e.href && e.href.startsWith('/') && !e.href.startsWith('/page') && !e.href.includes('.html'))
</script>

<template>
  <!-- текст -->
  <template v-if="e.type === 'text'">
    <NuxtLink v-if="isInternal" :to="href!" :class="cls"><span class="tz__atom" v-html="html" /></NuxtLink>
    <a v-else-if="href" :href="href" :class="cls" :target="isExternal ? '_blank' : undefined" :rel="isExternal ? 'noopener' : undefined"><span class="tz__atom" v-html="html" /></a>
    <component :is="e.tag || 'div'" v-else :class="cls"><span class="tz__atom" v-html="html" /></component>
  </template>

  <!-- кнопка -->
  <template v-else-if="e.type === 'button'">
    <NuxtLink v-if="isInternal" :to="href!" :class="cls"><span v-if="hasIcon" class="tz__icon" /><span class="tz__btn-text" v-html="btnText" /></NuxtLink>
    <a v-else-if="href" :href="href" :class="cls" :target="isExternal ? '_blank' : undefined" :rel="isExternal ? 'noopener' : undefined"><span v-if="hasIcon" class="tz__icon" /><span class="tz__btn-text" v-html="btnText" /></a>
    <div v-else :class="cls"><span v-if="hasIcon" class="tz__icon" /><span class="tz__btn-text" v-html="btnText" /></div>
  </template>

  <!-- картинка -->
  <template v-else-if="e.type === 'image'">
    <NuxtLink v-if="isInternal" :to="href!" :class="cls"><img :src="e.img" alt="" loading="lazy"></NuxtLink>
    <a v-else-if="href" :href="href" :class="cls" :target="isExternal ? '_blank' : undefined" :rel="isExternal ? 'noopener' : undefined"><img :src="e.img" alt="" loading="lazy"></a>
    <div v-else :class="cls"><img :src="e.img" alt="" loading="lazy"></div>
  </template>

  <!-- фигура (картинка фона — в CSS элемента, см. elemRules: url + градиент) -->
  <template v-else-if="e.type === 'shape'">
    <NuxtLink v-if="isInternal" :to="href!" :class="cls" />
    <a v-else-if="href" :href="href" :class="cls" :target="isExternal ? '_blank' : undefined" :rel="isExternal ? 'noopener' : undefined" />
    <div v-else :class="cls" />
  </template>

  <!-- inline SVG -->
  <template v-else-if="e.type === 'vector'">
    <a v-if="href" :href="href" :class="cls" v-html="e.svg" />
    <div v-else :class="cls" v-html="e.svg" />
  </template>

  <!-- встроенный HTML (обычно iframe Kinescope) -->
  <div v-else-if="e.type === 'html'" :class="cls" v-html="e.embed" />

  <!-- видео -->
  <div v-else-if="e.type === 'video'" :class="cls">
    <VideoEmbed v-if="e.video" :kind="e.video.kind" :id="e.video.id" ratio="0" class="!absolute !inset-0 !h-full !rounded-none" />
    <div v-else-if="e.embed" class="relative h-full w-full" v-html="e.embed" />
  </div>

  <!-- форма Zero Block -->
  <div v-else-if="e.type === 'form'" :class="cls">
    <ZeroForm :fields="(e.form as any[]) ?? []" :services="e.formServices ?? []" :elem-id="e.id" />
  </div>

  <div v-else :class="cls" />
</template>
