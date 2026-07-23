<template>
  <div class="content-section">
    <div class="settings-body">
      <div class="content-header">
        <h1>
          <SketchIcon name="settings" :size="28" />
          <span>设置</span>
        </h1>
      </div>
      <div class="content-area main-scroll settings-scroll">
        <section>
          <h2>音源设置</h2>
          <div class="sketch-card">
            <p class="setting-lead">选择默认音乐来源：</p>
            <div class="action-row">
              <button
                v-for="s in search.enabledSources"
                :key="s.id"
                @click="search.switchSource(s.id)"
                :class="['btn-action', search.currentSource === s.id ? 'btn-action-primary' : '']"
              >
                {{ s.name }}
              </button>
            </div>

            <p class="setting-lead spaced">启用音源：</p>
            <div class="source-list">
              <label
                v-for="s in search.sources"
                :key="`toggle-${s.id}`"
                class="source-item"
              >
                <span>{{ s.name }}</span>
                <input
                  class="source-toggle"
                  type="checkbox"
                  :checked="s.enabled"
                  @change="toggleSource(s.id, ($event.target as HTMLInputElement).checked)"
                />
              </label>
            </div>
            <p v-if="search.enabledSources.length === 0" class="setting-hint">请至少启用一个音源。</p>
          </div>
        </section>

        <section class="settings-section">
          <h2>音质偏好</h2>
          <div class="sketch-card">
            <div class="action-row">
              <button
                v-for="q in qualities"
                :key="q.id"
                @click="player.setPreferredQuality(q.id)"
                :class="['btn-action', player.preferredQuality === q.id ? 'btn-action-primary' : '']"
              >
                {{ q.label }}
              </button>
            </div>
            <p class="setting-hint">默认高品质（320k），失败时会自动降级。</p>
          </div>
        </section>

        <section class="settings-section">
          <h2>主题设置器</h2>
          <div class="sketch-card">
            <ThemeCustomizer />
          </div>
        </section>

        <section class="settings-section">
          <h2>显示与省电</h2>
          <div class="sketch-card">
            <label class="source-item">
              <span>播放时不自动息屏</span>
              <input
                class="source-toggle"
                type="checkbox"
                :checked="ui.keepScreenOn"
                :disabled="!wakeLockSupported"
                @change="ui.setKeepScreenOn(($event.target as HTMLInputElement).checked)"
              />
            </label>
            <p class="setting-hint">
              {{
                wakeLockSupported
                  ? '开启后，页面在前台时会尽量保持屏幕常亮（适合手机听歌）。'
                  : '当前浏览器不支持屏幕常亮，请用系统设置关闭自动锁屏。'
              }}
            </p>
          </div>
        </section>

        <section class="settings-section">
          <h2>快捷键</h2>
          <div class="sketch-card">
            <ul class="shortcut-list">
              <li><kbd>Space</kbd> 播放 / 暂停</li>
              <li><kbd>←</kbd> / <kbd>→</kbd> 快退 / 快进 5 秒</li>
              <li><kbd>Shift</kbd> + <kbd>←</kbd> / <kbd>→</kbd> 上一首 / 下一首</li>
              <li><kbd>↑</kbd> / <kbd>↓</kbd> 音量加减</li>
              <li><kbd>M</kbd> 静音切换</li>
              <li><kbd>L</kbd> 打开 / 关闭歌词</li>
            </ul>
            <p class="setting-hint">在输入框内时快捷键不会触发。</p>
          </div>
        </section>

        <section class="settings-section">
          <h2>数据维护</h2>
          <div class="sketch-card">
            <div class="action-row">
              <button class="btn-action" @click="clearSearchHistory">清空搜索历史</button>
              <button class="btn-action" @click="player.clearRecentPlays()">清空最近播放</button>
              <button class="btn-action" @click="ui.openOnboarding">重新查看新手引导</button>
              <button class="btn-action" @click="resetPwaPrompt">重新显示安装提示</button>
            </div>
            <p class="setting-hint">不会删除收藏与播放设置。</p>
          </div>
        </section>

        <section class="settings-section">
          <h2>关于</h2>
          <div class="sketch-card">
            <div class="about-brand">
              <SketchIcon name="music" :size="24" />
              <span>墨韵 · 手绘播放器</span>
            </div>
            <p class="about-desc">一个手绘风格的在线音乐播放器</p>
            <p class="about-version">版本 {{ APP_VERSION }} · 构建 {{ APP_BUILD_TIME }}</p>
            <ul class="update-notes">
              <li v-for="note in UPDATE_NOTES" :key="note">{{ note }}</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SketchIcon from '../icons/SketchIcon.vue';
import ThemeCustomizer from '../ThemeCustomizer.vue';
import { useSearchStore } from '../../stores/search';
import { usePlayerStore, type AudioQuality } from '../../stores/player';
import { useUIStore } from '../../stores/ui';
import storage from '../../core/storage';
import { APP_BUILD_TIME, APP_VERSION, UPDATE_NOTES } from '../../version';

const search = useSearchStore();
const player = usePlayerStore();
const ui = useUIStore();

const wakeLockSupported =
  typeof navigator !== 'undefined' && 'wakeLock' in navigator;

const qualities: Array<{ id: AudioQuality; label: string }> = [
  { id: 'high', label: '高品质 320k' },
  { id: 'medium', label: '标准 192k' },
  { id: 'low', label: '流畅 128k' },
  { id: 'lossless', label: '无损优先' },
];

function toggleSource(sourceId: string, enabled: boolean) {
  const enabledCount = search.enabledSources.length;
  if (!enabled && enabledCount <= 1) return;
  search.setSourceEnabled(sourceId, enabled);
}

function clearSearchHistory() {
  search.clearSearchHistory();
}

function resetPwaPrompt() {
  storage.remove('pwaInstallPromptDismissedAt');
  storage.remove('pwaVisitCount');
  storage.remove('pwaInstalled');
}
</script>

<style scoped>
.settings-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.source-list {
  display: grid;
  gap: 10px;
}

.source-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border: 1px dashed var(--border);
  border-radius: 8px;
  font-family: 'Ma Shan Zheng', cursive;
  color: var(--ink-soft);
  background: var(--surface);
}

.source-toggle {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-radius: 5px;
  background: var(--paper-bg);
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
}

.source-toggle:checked {
  background: var(--accent-green);
  border-color: var(--accent-green-strong);
}

.source-toggle:checked::after {
  content: '✓';
  position: absolute;
  left: 3px;
  top: -2px;
  font-size: 14px;
  color: #fff;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 6px 0 12px;
}

.settings-scroll {
  -webkit-overflow-scrolling: touch;
}

.shortcut-list {
  margin: 0;
  padding-left: 0;
  list-style: none;
  display: grid;
  gap: 8px;
  font-family: 'Ma Shan Zheng', cursive;
  color: var(--ink-soft);
  font-size: 16px;
}

.shortcut-list kbd {
  display: inline-block;
  min-width: 1.6em;
  padding: 1px 6px;
  margin-right: 2px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface-strong);
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  font-size: 12px;
  text-align: center;
}

.setting-hint {
  margin-top: 10px;
  color: var(--muted);
  font-size: 14px;
  font-family: 'Ma Shan Zheng', cursive;
}

.about-version {
  margin: 10px 0 0;
  font-family: 'Ma Shan Zheng', cursive;
  color: var(--faint);
  font-size: 14px;
}

.update-notes {
  margin: 12px 0 0;
  padding-left: 18px;
  color: var(--ink-soft);
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 14px;
  line-height: 1.7;
}

@media (max-width: 768px) {
  .source-item {
    font-size: 18px;
  }

  .action-row .btn-action {
    width: 100%;
  }
}
</style>
