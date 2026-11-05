import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './assets/styles/main.css';

import { sourceManager } from './core/sources/SourceManager';
import { createGDMusicSources } from './core/sources/GDMusicSource';
import { LocalSource } from './core/sources/LocalSource';
import { registerSW } from 'virtual:pwa-register';

const app = createApp(App);

app.use(createPinia());

// 注册 GD Music 音源 + 本地音乐
const gdMusicSources = createGDMusicSources();
gdMusicSources.forEach((source) => sourceManager.register(source));
sourceManager.register(new LocalSource());

sourceManager.init().then(() => {
  console.log('[Main] 音源管理器初始化完成');
});

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    window.dispatchEvent(new Event('pwa-update-available'));
  },
  onRegistered() {
    console.log('[PWA] Service worker registered');
  },
});

window.addEventListener('pwa-apply-update', () => {
  void updateSW(true);
});

window.addEventListener('load', () => {
  window.setInterval(() => {
    if (!navigator.onLine) return;
    void navigator.serviceWorker?.getRegistration().then((registration) => registration?.update());
  }, 60 * 60 * 1000);
});

app.mount('#app');
