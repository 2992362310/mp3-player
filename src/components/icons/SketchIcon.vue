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
      <circle cx="11" cy="13" r="6.5" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="11" cy="13" r="1.8" fill="none" />
      <path d="M15.8 8.2L19.5 4.5" stroke-linecap="round" />
      <path d="M18 3.5H20.5V6" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M7.4 10.6C8.3 9.8 9.5 9.4 11 9.4" stroke-linecap="round" />
      <path d="M7.1 15.6C8 16.6 9.4 17.1 11 17.1" stroke-linecap="round" />
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

    <!-- folder -->
    <template v-else-if="name === 'folder'">
      <path
        d="M3 7.5C3 6.5 3.8 5.5 5 5.5H9L11 7.5H19C20.2 7.5 21 8.3 21 9.5V17.5C21 18.7 20.2 19.5 19 19.5H5C3.8 19.5 3 18.7 3 17.5V7.5Z"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </template>

    <!-- globe -->
    <template v-else-if="name === 'globe'">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12H21" stroke-linecap="round" />
      <path
        d="M12 3C14.5 6.5 15.5 9.5 15.5 12C15.5 14.5 14.5 17.5 12 21C9.5 17.5 8.5 14.5 8.5 12C8.5 9.5 9.5 6.5 12 3Z"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </template>
  </svg>
</template>

<script setup lang="ts">
export type SketchIconName = 'music' | 'heart' | 'settings' | 'search' | 'plus' | 'folder' | 'globe';

withDefaults(
  defineProps<{
    name: SketchIconName;
    size?: number | string;
  }>(),
  { size: 20 },
);
</script>
