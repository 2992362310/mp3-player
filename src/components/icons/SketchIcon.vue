<template>
  <span
    class="sketch-icon-component"
    :class="`icon-${name}`"
    :style="{ color: color, width: size, height: size, fontSize: size }"
    :title="title"
    v-html="iconSvg"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Icons } from './SketchIcons';

interface Props {
  name: keyof typeof Icons;
  size?: string;
  color?: string;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: '24px',
  color: 'currentColor',
});

const iconSvg = computed(() => {
  const icon = Icons[props.name];
  if (!icon) return '';
  // 替换 SVG 中的 currentColor 为实际颜色
  return icon.replace(/currentColor/g, props.color);
});
</script>

<style scoped>
.sketch-icon-component {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sketch-icon-component :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
