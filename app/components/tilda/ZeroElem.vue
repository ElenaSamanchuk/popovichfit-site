<script setup lang="ts">
// Один элемент Zero Block: text / button / image / shape / vector / html / video / form.
// Геометрия и стили — в CSS (класс .e<id>, см. utils/tilda-css.ts); здесь только разметка и контент.
import type { ZeroElem } from '~/utils/tilda-css'

const props = defineProps<{ elem: ZeroElem }>()
const e = props.elem
const cls = computed(() => `tz__el tz__el--${e.type} e${e.id}${e.cls ? ' ' + e.cls : ''}`)
// фигура с картинкой: inline background-image или ленивый data-original (img)
const bgStyle = computed(() => (e.bgImg || e.img ? { backgroundImage: `url('${e.bgImg || e.img}')` } : undefined))
/** внешняя ссылка? → target/rel; hash и tg: — как есть */
const isExternal = computed(() => !!e.href && /^https?:\/\//.test(e.href) && !e.href.includes('popovichfit.ru'))
const isInternal = computed(() => !!e.href && e.href.startsWith('/') && !e.href.startsWith('/page') && !e.href.includes('.html'))
</script>

<template>
  <!-- текст -->
  <template v-if="e.type === 'text'">
    <NuxtLink v-if="isInternal" :to="e.href!" :class="cls" v-html="e.html" />
    <a v-else-if="e.href" :href="e.href" :class="cls" :target="isExternal ? '_blank' : undefined" :rel="isExternal ? 'noopener' : undefined" v-html="e.html" />
    <div v-else :class="cls" v-html="e.html" />
  </template>

  <!-- кнопка -->
  <template v-else-if="e.type === 'button'">
    <NuxtLink v-if="isInternal" :to="e.href!" :class="cls"><span class="tz__btn-text" v-html="e.text" /></NuxtLink>
    <a v-else-if="e.href" :href="e.href" :class="cls" :target="isExternal ? '_blank' : undefined" :rel="isExternal ? 'noopener' : undefined"><span class="tz__btn-text" v-html="e.text" /></a>
    <div v-else :class="cls"><span class="tz__btn-text" v-html="e.text" /></div>
  </template>

  <!-- картинка -->
  <template v-else-if="e.type === 'image'">
    <NuxtLink v-if="isInternal" :to="e.href!" :class="cls"><img :src="e.img" alt="" loading="lazy"></NuxtLink>
    <a v-else-if="e.href" :href="e.href" :class="cls" :target="isExternal ? '_blank' : undefined" :rel="isExternal ? 'noopener' : undefined"><img :src="e.img" alt="" loading="lazy"></a>
    <div v-else :class="cls"><img :src="e.img" alt="" loading="lazy"></div>
  </template>

  <!-- фигура (в т.ч. с фоновой картинкой) -->
  <template v-else-if="e.type === 'shape'">
    <NuxtLink v-if="isInternal" :to="e.href!" :class="cls" :style="bgStyle" />
    <a v-else-if="e.href" :href="e.href" :class="cls" :style="bgStyle" :target="isExternal ? '_blank' : undefined" :rel="isExternal ? 'noopener' : undefined" />
    <div v-else :class="cls" :style="bgStyle" />
  </template>

  <!-- inline SVG -->
  <template v-else-if="e.type === 'vector'">
    <a v-if="e.href" :href="e.href" :class="cls" v-html="e.svg" />
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
