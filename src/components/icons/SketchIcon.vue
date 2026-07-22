<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    aria-hidden="true"
  >
    <!-- music -->
    <template v-if="name === 'music'">
      <path
        d="M7 2C7.2 2.3 7.3 2.8 7.3 3.5L7.5 14C7.5 15.2 6.7 16 5.5 16C4.2 16 3.5 15.2 3.5 14C3.5 12.8 4.2 12 5.5 12L16 10.5C16.8 10.3 17.5 9.5 17.5 8.5V3M17 3V12C17.2 12.3 17.3 12.8 17.3 13.5L17.5 20C17.5 21.2 16.7 22 15.5 22C14.2 22 13.5 21.2 13.5 20C13.5 18.8 14.2 18 15.5 18"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </template>

    <!-- heart -->
    <template v-else-if="name === 'heart'">
      <path
        d="M12 21C9 19 3 15 3 10C3 6.5 5.5 4 8 4C9.5 4 11 5 12 6.5C13 5 14.5 4 16 4C18.5 4 21 6.5 21 10C21 15 15 19 12 21Z"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </template>

    <!-- settings -->
    <template v-else-if="name === 'settings'">
      <circle cx="12" cy="12" r="3.5" fill="none" />
      <path
        d="M12 2.5V4.5M12 19.5V21.5M21.5 12H19.5M4.5 12H2.5M18 18L16.8 19.2M7.2 7.2L6 6M18 6L16.8 7.2M7.2 16.8L6 18"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="8.5"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-dasharray="1,3"
      />
    </template>

    <!-- search -->
    <template v-else-if="name === 'search'">
      <circle cx="10" cy="10" r="6.5" fill="none" />
      <path d="M15.5 15.5L21 21" stroke-linecap="round" stroke-linejoin="round" />
    </template>

    <!-- plus -->
    <template v-else-if="name === 'plus'">
      <line x1="12" y1="5" x2="12" y2="19" stroke-linecap="round" />
      <line x1="5" y1="12" x2="19" y2="12" stroke-linecap="round" />
    </template>
  </svg>
</template>

<script setup lang="ts">
export type SketchIconName = 'music' | 'heart' | 'settings' | 'search' | 'plus';

withDefaults(
  defineProps<{
    name: SketchIconName;
    size?: number | string;
  }>(),
  { size: 20 },
);
</script>
