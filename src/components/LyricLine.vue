<template>
  <p
    :ref="setLineRef"
    :class="lineClasses"
    :style="lineStyle"
    @click="handleClick"
  >
    {{ line.text || '· · ·' }}
  </p>
</template>

<script setup lang="ts">
import { computed, type ComponentPublicInstance } from 'vue';
import type { LyricLine } from '../core/sources/types';

interface Props {
  line: LyricLine;
  index: number;
  isActive: boolean;
  isPassed: boolean;
  lineRefSetter?: (el: HTMLElement | null) => void;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  lineClick: [time: number];
}>();

const lineClasses = computed(() => [
  'lyrics-line',
  props.isActive ? 'active active-animated' : '',
  props.isPassed ? 'passed' : '',
]);

const lineStyle = computed(() => ({
  cursor: 'pointer',
  fontFamily: "'Ma Shan Zheng', cursive",
  transition: 'all 0.3s',
  margin: '0',
  padding: '8px 12px',
  fontSize: '15px',
  color: props.isActive ? '#2d2d2d' : props.isPassed ? '#b0a080' : '#999',
  fontWeight: props.isActive ? 'bold' : 'normal',
}));

function handleClick() {
  emit('lineClick', props.line.time);
}

function setLineRef(el: Element | ComponentPublicInstance | null) {
  props.lineRefSetter?.(el instanceof Element ? (el as HTMLElement) : null);
}
</script>

<style scoped>
.lyrics-line {
  line-height: 1.8;
}

.lyrics-line.active {
  color: #2d2d2d !important;
  font-weight: 700;
}

.lyrics-line.passed {
  color: #b0a080 !important;
}

.active-animated {
  animation: lyricPulse 1.2s ease-in-out infinite;
}

@keyframes lyricPulse {
  0% {
    opacity: 0.85;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.85;
  }
}
</style>
