<template>
  <div class="lyric-header">
    <div>
      <h2 v-if="isTitle" class="lyric-header-title">{{ title }}</h2>
      <h3 v-else class="lyric-header-subtitle">{{ title }}</h3>
      <p class="lyric-header-artist">{{ artist }}</p>
    </div>
    <div v-if="showActions" class="lyric-header-actions">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    artist: string;
    isTitle?: boolean;
    showActions?: boolean;
  }>(),
  {
    isTitle: true,
    showActions: false,
  }
);
</script>

<style scoped>
.lyric-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  border-bottom: 2px dashed #d4c5a0;
  padding-bottom: 14px;
}

.lyric-header-title {
  margin: 0;
  font-family: 'Ma Shan Zheng', cursive;
  color: #2e2a24;
  font-size: 28px;
}

.lyric-header-subtitle {
  margin: 0 0 4px 0;
  color: #333;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 18px;
}

.lyric-header-artist {
  margin: 6px 0 0;
  color: #7f7568;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 16px;
}

.lyric-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
