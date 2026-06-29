<template>
  <div class="content-section" style="display: flex; flex-direction: row; gap: 0; flex: 1; min-width: 0;">
    <div style="display: flex; flex-direction: column; flex: 1; min-width: 0; min-height: 0;">
      <div class="content-header">
        <h1 style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 28px; height: 28px;" v-html="SketchSettingsIcon"></div>
          <span>设置</span>
        </h1>
      </div>
      <div class="content-area main-scroll settings-scroll">
        <section>
          <h2>🎨 音源设置</h2>
          <div class="sketch-card">
            <p style="font-family: 'Ma Shan Zheng', cursive; color: #666; margin-bottom: 15px; font-size: 17px;">选择默认音乐来源：</p>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
              <button
                v-for="s in search.enabledSources"
                :key="s.id"
                @click="search.switchSource(s.id)"
                :class="['btn-action', search.currentSource === s.id ? 'btn-action-primary' : '']"
              >
                {{ s.name }}
              </button>
            </div>

            <p style="font-family: 'Ma Shan Zheng', cursive; color: #666; margin: 20px 0 12px; font-size: 17px;">启用音源：</p>
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

        <section style="margin-top: 20px;">
          <h2>🌓 主题切换</h2>
          <div class="sketch-card">
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
              <button
                v-for="themeOption in themes"
                :key="themeOption.id"
                @click="ui.setTheme(themeOption.id)"
                :class="['btn-action', ui.theme === themeOption.id ? 'btn-action-primary' : '']"
              >
                {{ themeOption.label }}
              </button>
            </div>
            <p class="setting-hint">主题会自动保存，下次打开仍生效。</p>
          </div>
        </section>

        <section style="margin-top: 20px;">
          <h2>🧰 数据维护</h2>
          <div class="sketch-card">
            <div class="action-row">
              <button class="btn-action" @click="clearSearchHistory">清空搜索历史</button>
              <button class="btn-action" @click="ui.openOnboarding">重新查看新手引导</button>
              <button class="btn-action" @click="resetPwaPrompt">重新显示安装提示</button>
            </div>
            <p class="setting-hint">不会删除收藏与播放设置。</p>
          </div>
        </section>

        <section style="margin-top: 20px;">
          <h2 style="display: flex; align-items: center; gap: 8px;">
            <span>📖 关于</span>
          </h2>
          <div class="sketch-card">
            <div style="font-family: 'Ma Shan Zheng', cursive; color: #2d2d2d; font-size: 20px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
              <div style="width: 24px; height: 24px;" v-html="SketchMusicIcon"></div>
              <span>手绘播放器</span>
            </div>
            <p style="font-family: 'Ma Shan Zheng', cursive; color: #888; font-size: 16px;">一个手绘风格的在线音乐播放器</p>
          </div>
        </section>
      </div>
    </div>

    <LyricPanel />
  </div>
</template>

<script setup lang="ts">
import LyricPanel from '../LyricPanel.vue';
import { SketchMusicIcon, SketchSettingsIcon } from '../icons/SketchIcons';
import { useSearchStore } from '../../stores/search';
import { useUIStore, type AppTheme } from '../../stores/ui';
import storage from '../../core/storage';

const search = useSearchStore();
const ui = useUIStore();

const themes: Array<{ id: AppTheme; label: string }> = [
  { id: 'paper', label: '宣纸' },
  { id: 'sand', label: '暖沙' },
  { id: 'mint', label: '薄荷' },
];

function toggleSource(sourceId: string, enabled: boolean) {
  const enabledCount = search.enabledSources.length;
  if (!enabled && enabledCount <= 1) return;
  search.setSourceEnabled(sourceId, enabled);
}

function clearSearchHistory() {
  storage.remove('searchHistory');
}

function resetPwaPrompt() {
  storage.remove('pwaInstallPromptDismissedAt');
  storage.remove('pwaVisitCount');
  storage.remove('pwaInstalled');
}
</script>

<style scoped>
.source-list {
  display: grid;
  gap: 10px;
}

.source-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border: 1px dashed #c4b5a0;
  border-radius: 8px;
  font-family: 'Ma Shan Zheng', cursive;
  color: #444;
  background: rgba(255, 255, 255, 0.45);
}

.source-toggle {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid #b7a98c;
  border-radius: 5px;
  background: #fff;
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
}

.source-toggle:checked {
  background: #2f7d46;
  border-color: #2f7d46;
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

.setting-hint {
  margin-top: 10px;
  color: #888;
  font-size: 14px;
  font-family: 'Ma Shan Zheng', cursive;
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
