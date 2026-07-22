<template>
  <p
    :ref="setLineRef"
    :class="lineClasses"
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

function handleClick() {
  emit('lineClick', props.line.time);
}

function setLineRef(el: Element | ComponentPublicInstance | null) {
  props.lineRefSetter?.(el instanceof Element ? (el as HTMLElement) : null);
}
</script>

<style scoped>
.lyrics-line {
  margin: 0;
  padding: 10px 16px;
  font-size: 15px;
  line-height: 1.8;
  font-family: 'Ma Shan Zheng', cursive;
  color: var(--muted);
  font-weight: normal;
  cursor: pointer;
  transition: color 0.3s ease, transform 0.3s ease, opacity 0.3s ease;
  text-align: center;
}

.lyrics-line.active {
  color: var(--ink);
  font-weight: 700;
  font-size: 17px;
}

.lyrics-line.passed {
  color: var(--faint);
}

.active-animated {
  animation: lyricPulse 1.2s ease-in-out infinite;
}

@keyframes lyricPulse {
  0%,
  100% {
    opacity: 0.85;
  }
  50% {
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .lyrics-line {
    padding: 12px 18px;
    font-size: 16px;
  }

  .lyrics-line.active {
    font-size: 18px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .active-animated {
    animation: none;
  }
}
</style>
