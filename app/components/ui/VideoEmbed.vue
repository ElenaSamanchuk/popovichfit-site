<script setup lang="ts">
// Встраивание видео как на Тильде: Kinescope (основной хостинг), YouTube (nocookie), Vimeo, Google Drive.
// iframe создаётся только на клиенте; в попапах при закрытии компонент размонтируется — видео останавливается.
const props = withDefaults(defineProps<{
  kind: 'kinescope' | 'youtube' | 'vimeo' | 'gdrive'
  id: string
  /** соотношение сторон, по умолчанию 16:9 */
  ratio?: string
  autoplay?: boolean
  title?: string
}>(), { ratio: '56.25%', autoplay: false, title: 'Видео' })

const src = computed(() => {
  switch (props.kind) {
    case 'kinescope': return `https://kinescope.io/embed/${props.id}${props.autoplay ? '?autoplay=1' : ''}`
    case 'youtube': return `https://www.youtube-nocookie.com/embed/${props.id}?rel=0${props.autoplay ? '&autoplay=1' : ''}`
    case 'vimeo': return `https://player.vimeo.com/video/${props.id}${props.autoplay ? '?autoplay=1' : ''}`
    case 'gdrive': return `https://drive.google.com/file/d/${props.id}/preview`
  }
})
</script>

<template>
  <div class="relative w-full overflow-hidden rounded-[10px] bg-black" :style="{ paddingTop: ratio }">
    <ClientOnly>
      <iframe
        :src="src"
        :title="title"
        class="absolute inset-0 h-full w-full"
        frameborder="0"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write"
        allowfullscreen
      />
    </ClientOnly>
  </div>
</template>
