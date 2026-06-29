<template>
  <div v-if="visible && activeSection === 'discover'" class="pwa-banner" role="status" aria-live="polite">
    <div class="pwa-banner-content">
      <strong>{{ title }}</strong>
      <p>{{ message }}</p>
    </div>

    <div class="pwa-banner-actions">
      <button
        v-if="canInstall"
        type="button"
        class="btn-action btn-action-primary"
        @click="installNow"
      >
        立即安装
      </button>
      <button type="button" class="btn-action" @click="dismiss">稍后再说</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import storage from '../core/storage';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const DISMISS_KEY = 'pwaInstallPromptDismissedAt';
const INSTALL_KEY = 'pwaInstalled';
const VISIT_COUNT_KEY = 'pwaVisitCount';
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

const props = defineProps<{
  activeSection: 'discover' | 'favorites' | 'settings';
}>();

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
const visible = ref(false);
const isIos = ref(false);
const isStandalone = ref(false);
const isMobile = ref(false);

const canInstall = computed(() => !isIos.value && !!deferredPrompt.value);

const title = computed(() => {
  if (isIos.value) return '安装到主屏幕';
  return '安装 MoYun 应用';
});

const message = computed(() => {
  if (isIos.value) {
    return '在 Safari 点分享按钮，再点“添加到主屏幕”，下次可像 App 一样打开。';
  }
  return '安装后可全屏打开、保留会话，并获得更接近原生应用的体验。';
});

function detectEnv() {
  const ua = navigator.userAgent.toLowerCase();
  isIos.value = /iphone|ipad|ipod/.test(ua);
  isMobile.value =
    /iphone|ipad|ipod|android|mobile/.test(ua) ||
    window.matchMedia('(max-width: 1024px)').matches;

  const nav = navigator as Navigator & {
    standalone?: boolean;
  };

  isStandalone.value =
    window.matchMedia('(display-mode: standalone)').matches ||
    nav.standalone === true;
}

function evaluateVisibility() {
  const dismissedAt = storage.get<number>(DISMISS_KEY, 0);
  const installed = storage.get<boolean>(INSTALL_KEY, false);
  const visitCount = storage.get<number>(VISIT_COUNT_KEY, 0);
  const withinCooldown = dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;

  if (!isMobile.value || withinCooldown || installed || isStandalone.value || visitCount < 2) {
    visible.value = false;
    return;
  }

  if (isIos.value) {
    visible.value = true;
    return;
  }

  visible.value = !!deferredPrompt.value;
}

function dismiss() {
  visible.value = false;
  storage.set(DISMISS_KEY, Date.now());
}

async function installNow() {
  if (!deferredPrompt.value) return;
  await deferredPrompt.value.prompt();
  const choice = await deferredPrompt.value.userChoice;

  if (choice.outcome === 'accepted') {
    storage.set(INSTALL_KEY, true);
    visible.value = false;
  }

  deferredPrompt.value = null;
}

onMounted(() => {
  detectEnv();

  const currentVisitCount = storage.get<number>(VISIT_COUNT_KEY, 0) + 1;
  storage.set(VISIT_COUNT_KEY, currentVisitCount);

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt.value = event as BeforeInstallPromptEvent;
    evaluateVisibility();
  });

  window.addEventListener('appinstalled', () => {
    storage.set(INSTALL_KEY, true);
    visible.value = false;
    deferredPrompt.value = null;
  });

  evaluateVisibility();
});
</script>

<style scoped>
.pwa-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px dashed #c4b5a0;
  background: rgba(255, 255, 255, 0.68);
}

.pwa-banner-content {
  min-width: 0;
}

.pwa-banner-content strong {
  display: block;
  color: #2d2d2d;
  font-family: 'KaiTi', 'STKaiti', serif;
  font-size: 16px;
}

.pwa-banner-content p {
  margin: 2px 0 0;
  color: #666;
  font-size: 13px;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
}

.pwa-banner-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .pwa-banner {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .pwa-banner-actions {
    justify-content: flex-end;
  }
}
</style>
