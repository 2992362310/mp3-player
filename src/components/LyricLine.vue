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
import { computed } from 'vue';
import type { LyricLine } from '../core/sources/types';

interface Props {
  line: LyricLine;
  index: number;
  isActive: boolean;
  isPassed: boolean;
  variant?: 'sidebar' | 'modal' | 'fullscreen';
  lineRefSetter?: (el: HTMLElement | null) => void;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'modal',
});

const emit = defineEmits<{
  lineClick: [time: number];
}>();

const lineClasses = computed(() => [
  'lyrics-line',
  props.isActive ? 'active active-animated' : '',
  props.isPassed ? 'passed' : '',
]);

const lineStyle = computed(() => {
  const baseStyle: Record<string, string> = {
    cursor: 'pointer',
    fontFamily: "'Ma Shan Zheng', cursive",
    transition: 'all 0.3s',
    margin: '0',
  };

  if (props.variant === 'sidebar') {
    return {
      ...baseStyle,
      padding: '8px 12px',
      fontSize: '15px',
      color: props.isActive ? '#e74c3c' : props.isPassed ? '#9b9b9b' : '#666',
      fontWeight: props.isActive ? 'bold' : 'normal',
      borderRadius: '6px',
      background: props.isActive ? 'rgba(231, 76, 60, 0.1)' : 'transparent',
    };
  } else if (props.variant === 'fullscreen') {
    return {
      ...baseStyle,
      fontSize: '24px',
      color: '#5f564b',
      padding: '10px 0',
    };
  } else {
    // modal
    return {
      ...baseStyle,
      padding: '8px 0',
      fontSize: '16px',
      color: '#666',
    };
  }
});

function handleClick() {
  emit('lineClick', props.line.time);
}

function setLineRef(el: Element | null) {
  props.lineRefSetter?.(el as HTMLElement | null);
}
</script>

<style scoped>
.lyrics-line {
  line-height: 1.8;
}

.lyrics-line.active {
  color: #e74c3c !important;
  font-weight: 700;
}

.lyrics-line.passed {
  color: #9b9b9b !important;
}

.active-animated {
  transform: scale(1.08);
  text-shadow: 0 0 8px rgba(231, 76, 60, 0.28);
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
