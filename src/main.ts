import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './assets/styles/main.css';

import { sourceManager } from './core/sources/SourceManager';
import { createGDMusicSources } from './core/sources/GDMusicSource';

const app = createApp(App);

app.use(createPinia());

// 注册 GD Music 音源
const gdMusicSources = createGDMusicSources();
gdMusicSources.forEach((source) => sourceManager.register(source));

sourceManager.init().then(() => {
  console.log('[Main] 音源管理器初始化完成');
});

app.mount('#app');
