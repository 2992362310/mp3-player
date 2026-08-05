<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <!-- music -->
    <template v-if="name === 'music'">
      <circle cx="11" cy="13" r="6.5" />
      <circle cx="11" cy="13" r="1.8" />
      <path d="M15.8 8.2L19.5 4.5" />
      <path d="M18 3.5H20.5V6" />
      <path d="M7.4 10.6C8.3 9.8 9.5 9.4 11 9.4" />
      <path d="M7.1 15.6C8 16.6 9.4 17.1 11 17.1" />
    </template>

    <!-- heart -->
    <template v-else-if="name === 'heart'">
      <path
        d="M12 20.6C9.2 18.8 3.8 15.1 3.8 10.2C3.8 7 6.1 4.8 8.6 4.8C10.1 4.8 11.4 5.6 12.2 6.9C13 5.6 14.3 4.8 15.8 4.8C18.3 4.8 20.6 7 20.6 10.2C20.6 15.1 15.2 18.8 12 20.6Z"
        :fill="filled ? 'currentColor' : 'none'"
      />
    </template>

    <!-- settings -->
    <template v-else-if="name === 'settings'">
      <circle cx="12" cy="12" r="3.5" />
      <path
        d="M12 2.5V4.5M12 19.5V21.5M21.5 12H19.5M4.5 12H2.5M18 18L16.8 19.2M7.2 7.2L6 6M18 6L16.8 7.2M7.2 16.8L6 18"
      />
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke-dasharray="1,3"
      />
    </template>

    <!-- search -->
    <template v-else-if="name === 'search'">
      <circle cx="10" cy="10" r="6.5" />
      <path d="M15.5 15.5L21 21" />
    </template>

    <!-- plus -->
    <template v-else-if="name === 'plus'">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </template>

    <!-- folder -->
    <template v-else-if="name === 'folder'">
      <path
        d="M3 7.5C3 6.5 3.8 5.5 5 5.5H9L11 7.5H19C20.2 7.5 21 8.3 21 9.5V17.5C21 18.7 20.2 19.5 19 19.5H5C3.8 19.5 3 18.7 3 17.5V7.5Z"
      />
    </template>

    <!-- globe -->
    <template v-else-if="name === 'globe'">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12H21" />
      <path
        d="M12 3C14.5 6.5 15.5 9.5 15.5 12C15.5 14.5 14.5 17.5 12 21C9.5 17.5 8.5 14.5 8.5 12C8.5 9.5 9.5 6.5 12 3Z"
      />
    </template>

    <!-- prev：竖线 + 左三角 -->
    <template v-else-if="name === 'prev'">
      <path d="M6.8 5V19" />
      <path d="M17.5 5.2L8.2 12L17.5 18.8Z" fill="currentColor" stroke="none" />
    </template>

    <!-- next -->
    <template v-else-if="name === 'next'">
      <path d="M17.2 5V19" />
      <path d="M6.5 5.2L15.8 12L6.5 18.8Z" fill="currentColor" stroke="none" />
    </template>

    <!-- play：饱满三角 -->
    <template v-else-if="name === 'play'">
      <path
        d="M8.2 4.8C7.8 4.6 7.2 4.9 7.2 5.4V18.6C7.2 19.1 7.8 19.4 8.2 19.2L19.1 12.9C19.5 12.7 19.5 12.1 19.1 11.8L8.2 4.8Z"
        fill="currentColor"
        stroke="none"
      />
    </template>

    <!-- pause：两根竖条 -->
    <template v-else-if="name === 'pause'">
      <rect x="7" y="5" width="3.2" height="14" rx="1" fill="currentColor" stroke="none" />
      <rect x="13.8" y="5" width="3.2" height="14" rx="1" fill="currentColor" stroke="none" />
    </template>

    <!-- loading -->
    <template v-else-if="name === 'loading'">
      <circle cx="12" cy="12" r="8" stroke-dasharray="4 5" />
      <path d="M12 4v2.2" />
    </template>

    <!-- volume：喇叭 + 双弧 -->
    <template v-else-if="name === 'volume'">
      <path d="M4.5 9.2H7.2L12.4 5.6C12.9 5.3 13.5 5.6 13.5 6.2V17.8C13.5 18.4 12.9 18.7 12.4 18.4L7.2 14.8H4.5C4 14.8 3.6 14.4 3.6 13.9V10.1C3.6 9.6 4 9.2 4.5 9.2Z" />
      <path d="M16.2 9.2C17.3 10.2 17.9 11.5 17.9 12.9C17.9 14.3 17.3 15.6 16.2 16.6" />
      <path d="M18.6 7C20.4 8.6 21.4 10.6 21.4 12.9C21.4 15.2 20.4 17.2 18.6 18.8" />
    </template>

    <!-- mute -->
    <template v-else-if="name === 'mute'">
      <path d="M4.5 9.2H7.2L12.4 5.6C12.9 5.3 13.5 5.6 13.5 6.2V17.8C13.5 18.4 12.9 18.7 12.4 18.4L7.2 14.8H4.5C4 14.8 3.6 14.4 3.6 13.9V10.1C3.6 9.6 4 9.2 4.5 9.2Z" />
      <path d="M16.4 9.2L21 13.8" />
      <path d="M21 9.2L16.4 13.8" />
    </template>

    <!-- lyric：卷轴纸条 + 墨点 -->
    <template v-else-if="name === 'lyric'">
      <path d="M5.2 5.4C5.2 4.6 5.9 4 6.7 4H17.3C18.1 4 18.8 4.6 18.8 5.4V16.8C18.8 17.6 18.1 18.2 17.3 18.2H6.7C5.9 18.2 5.2 17.6 5.2 16.8V5.4Z" />
      <path d="M8 8.2H16" />
      <path d="M8 11.2H14.5" />
      <path d="M8 14.2H15.2" />
      <circle cx="7.2" cy="20.2" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="16.8" cy="19.6" r="1.2" fill="currentColor" stroke="none" />
      <path d="M7.2 18.2V19" />
      <path d="M16.8 18.2V18.8" />
    </template>

    <!-- mode-order：顺序双箭头 -->
    <template v-else-if="name === 'mode-order'">
      <path d="M4.5 8.2H15.5" />
      <path d="M13.2 5.8L16.6 8.2L13.2 10.6" />
      <path d="M19.5 15.8H8.5" />
      <path d="M10.8 13.4L7.4 15.8L10.8 18.2" />
    </template>

    <!-- mode-random：交错乱序 -->
    <template v-else-if="name === 'mode-random'">
      <path d="M4.2 7.2H9.2L14.8 16.8H19.5" />
      <path d="M17.2 14.4L19.8 16.8L17.2 19.2" />
      <path d="M4.2 16.8H9.2L11.4 13.6" />
      <path d="M13.2 10.2L14.8 7.2H19.5" />
      <path d="M17.2 4.8L19.8 7.2L17.2 9.6" />
    </template>

    <!-- mode-loop：环绕 + 中心 ∞ -->
    <template v-else-if="name === 'mode-loop'">
      <path d="M17.4 8A6.4 6.4 0 1 0 18.2 13.8" />
      <path d="M15.4 5.6L17.6 8.2L14.8 9.5" />
      <path d="M8.6 12.2C9.2 11 10.4 10.4 11.6 10.4C12.6 10.4 13.4 10.9 14 11.8C14.6 12.7 15.4 13.2 16.2 12.4" />
      <path d="M15.4 11.8C14.8 13 13.6 13.6 12.4 13.6C11.4 13.6 10.6 13.1 10 12.2C9.4 11.3 8.6 10.8 7.8 11.6" />
    </template>

    <!-- mode-single：单曲循环 + 1 -->
    <template v-else-if="name === 'mode-single'">
      <path d="M17.2 8.2A6.2 6.2 0 1 0 18 13.5" />
      <path d="M15.4 5.8L17.4 8.4L14.8 9.6" />
      <path d="M11.2 10.6V15.6" />
      <path d="M10.2 11.4L11.2 10.6L12.2 11.4" />
    </template>
  </svg>
</template>

<script setup lang="ts">
export type SketchIconName =
  | 'music'
  | 'heart'
  | 'settings'
  | 'search'
  | 'plus'
  | 'folder'
  | 'globe'
  | 'prev'
  | 'next'
  | 'play'
  | 'pause'
  | 'loading'
  | 'volume'
  | 'mute'
  | 'lyric'
  | 'mode-order'
  | 'mode-random'
  | 'mode-loop'
  | 'mode-single';

withDefaults(
  defineProps<{
    name: SketchIconName;
    size?: number | string;
    /** 实心填充（如已收藏的心形） */
    filled?: boolean;
    strokeWidth?: number | string;
  }>(),
  { size: 20, filled: false, strokeWidth: 2.2 },
);
</script>
