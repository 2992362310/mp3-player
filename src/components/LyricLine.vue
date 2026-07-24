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
  isUpcoming?: boolean;
  size?: 'normal' | 'karaoke';
  lineRefSetter?: (el: HTMLElement | null) => void;
}

const props = withDefaults(defineProps<Props>(), {
  isUpcoming: false,
  size: 'normal',
});

const emit = defineEmits<{
  lineClick: [time: number];
}>();

const lineClasses = computed(() => [
  'lyrics-line',
  props.size === 'karaoke' ? 'is-karaoke' : '',
  props.isActive ? 'active active-animated' : '',
  props.isPassed ? 'passed' : '',
  props.isUpcoming ? 'upcoming' : '',
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
  transition: color 0.3s ease, transform 0.3s ease, opacity 0.3s ease, font-size 0.25s ease;
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

.lyrics-line.upcoming {
  color: var(--ink-soft);
  opacity: 0.85;
}

.lyrics-line.is-karaoke {
  padding: 14px 20px;
  font-size: clamp(18px, 4.2vw, 28px);
  line-height: 1.55;
}

.lyrics-line.is-karaoke.active {
  font-size: clamp(24px, 5.6vw, 38px);
  color: var(--accent);
  text-shadow: 0 2px 0 color-mix(in srgb, var(--accent-soft) 80%, transparent);
}

.lyrics-line.is-karaoke.upcoming {
  font-size: clamp(16px, 3.6vw, 22px);
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
