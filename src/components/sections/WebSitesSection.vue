<template>
  <div class="web-immersive-root">
    <div class="web-frame-wrap">
      <iframe
        v-for="site in sites"
        v-show="activeId === site.id && mountedIds.has(site.id)"
        :key="`${site.id}-${reloadTokens[site.id] || 0}`"
        class="web-frame"
        :src="mountedIds.has(site.id) ? site.url : undefined"
        :title="site.name"
        referrerpolicy="no-referrer-when-downgrade"
        allow="autoplay; encrypted-media; fullscreen"
        @load="onFrameLoad(site.id)"
      />

      <div v-if="showLoading" class="web-empty">
        <p>正在打开 {{ activeSite.name }}…</p>
      </div>

      <div v-else-if="showFailed" class="web-empty">
        <p>页面未能嵌入显示</p>
        <p class="web-empty-hint">站点可能禁止了内嵌</p>
        <div class="web-empty-actions">
          <button type="button" class="web-chip" @click="reloadActive">重试</button>
          <a
            class="web-chip primary"
            :href="activeSite.url"
            target="_blank"
            rel="noopener noreferrer"
          >
            新窗口打开
          </a>
          <button type="button" class="web-chip" @click="emit('exit')">返回墨韵</button>
        </div>
      </div>
    </div>

    <!-- 右侧中部浮层：避开顶部导航与底部播放器 -->
    <div
      :class="['web-dock', panelOpen ? 'open' : '']"
      @mouseenter="openPanel"
      @mouseleave="scheduleClosePanel"
    >
      <button
        type="button"
        class="web-fab"
        :title="panelOpen ? '收起' : '站点菜单 (Esc 返回)'"
        aria-label="站点菜单"
        @click="togglePanel"
      >
        {{ panelOpen ? '×' : '☰' }}
      </button>

      <div v-show="panelOpen" class="web-panel">
        <button type="button" class="web-chip" title="返回墨韵 (Esc)" @click="emit('exit')">
          ← 返回墨韵
        </button>
        <button
          v-for="site in sites"
          :key="site.id"
          type="button"
          :class="['web-chip', activeId === site.id ? 'active' : '']"
          @click="selectSite(site.id)"
        >
          {{ site.name }}
        </button>
        <a
          class="web-chip"
          :href="activeSite.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          新窗口
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { WEB_SITES } from '../../constants/webSites';

defineProps<{
  immersive?: boolean;
}>();

const emit = defineEmits<{
  exit: [];
}>();

const sites = WEB_SITES;
const activeId = ref(sites[0]?.id || '');
const mountedIds = reactive(new Set<string>());
const readyIds = reactive(new Set<string>());
const failedIds = reactive(new Set<string>());
const reloadTokens = reactive<Record<string, number>>({});
const loadTimers = new Map<string, number>();

const panelOpen = ref(false);
let closeTimer: number | null = null;

const activeSite = computed(
  () => sites.find((s) => s.id === activeId.value) || sites[0],
);

const showLoading = computed(
  () => mountedIds.has(activeId.value) && !readyIds.has(activeId.value) && !failedIds.has(activeId.value),
);

const showFailed = computed(
  () => failedIds.has(activeId.value) && !readyIds.has(activeId.value),
);

function clearCloseTimer() {
  if (closeTimer != null) {
    window.clearTimeout(closeTimer);
    closeTimer = null;
  }
}

function openPanel() {
  clearCloseTimer();
  panelOpen.value = true;
}

function scheduleClosePanel() {
  clearCloseTimer();
  closeTimer = window.setTimeout(() => {
    panelOpen.value = false;
  }, 400);
}

function togglePanel() {
  clearCloseTimer();
  panelOpen.value = !panelOpen.value;
}

function clearTimer(id: string) {
  const timer = loadTimers.get(id);
  if (timer) {
    window.clearTimeout(timer);
    loadTimers.delete(id);
  }
}

function mountSite(id: string) {
  if (!id) return;
  mountedIds.add(id);
  failedIds.delete(id);
  clearTimer(id);

  if (readyIds.has(id)) return;

  const timer = window.setTimeout(() => {
    if (!readyIds.has(id)) failedIds.add(id);
  }, 15000);
  loadTimers.set(id, timer);
}

function selectSite(id: string) {
  activeId.value = id;
  mountSite(id);
}

function reloadActive() {
  const id = activeId.value;
  readyIds.delete(id);
  failedIds.delete(id);
  clearTimer(id);
  reloadTokens[id] = (reloadTokens[id] || 0) + 1;
  mountedIds.add(id);
  const timer = window.setTimeout(() => {
    if (!readyIds.has(id)) failedIds.add(id);
  }, 15000);
  loadTimers.set(id, timer);
}

function onFrameLoad(id: string) {
  clearTimer(id);
  readyIds.add(id);
  failedIds.delete(id);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault();
    if (panelOpen.value) {
      panelOpen.value = false;
      return;
    }
    emit('exit');
  }
}

watch(
  activeId,
  (id) => {
    if (id) mountSite(id);
  },
  { immediate: true },
);

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
  clearCloseTimer();
  for (const id of loadTimers.keys()) clearTimer(id);
});
</script>

<style scoped>
.web-immersive-root {
  position: relative;
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: #000;
  overflow: hidden;
}

.web-frame-wrap {
  position: absolute;
  inset: 0;
  background: #000;
}

.web-frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  background: #fff;
}

.web-dock {
  position: absolute;
  right: 12px;
  top: 50%;
  z-index: 8;
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  gap: 8px;
  transform: translateY(-50%);
  pointer-events: none;
}

.web-fab,
.web-panel {
  pointer-events: auto;
}

.web-fab {
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  background: rgba(20, 20, 20, 0.78);
  color: #fff;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(10px);
}

.web-fab:hover {
  background: rgba(30, 30, 30, 0.9);
}

.web-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border-radius: 14px;
  background: rgba(20, 20, 20, 0.82);
  color: #f5f5f5;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
  max-width: min(220px, calc(100vw - 72px));
  max-height: min(60vh, 360px);
  overflow-y: auto;
}

.web-chip {
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: inherit;
  padding: 8px 12px;
  font-size: 13px;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  cursor: pointer;
  text-decoration: none;
  text-align: left;
  white-space: nowrap;
}

.web-chip:hover {
  background: rgba(255, 255, 255, 0.12);
}

.web-chip.active,
.web-chip.primary {
  background: rgba(255, 255, 255, 0.2);
}

.web-empty {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: #eee;
  text-align: center;
  background: #111;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
}

.web-empty p {
  margin: 0;
  font-size: 16px;
}

.web-empty-hint {
  font-size: 13px !important;
  color: #999 !important;
}

.web-empty-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}

.web-empty .web-chip {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}
</style>
