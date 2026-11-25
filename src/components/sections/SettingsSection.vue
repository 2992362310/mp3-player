<template>
  <div class="content-section">
    <div class="settings-body">
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
          <h2>桌宠与贴图</h2>
          <div class="sketch-card">
            <label class="source-item">
              <span>显示桌宠</span>
              <input
                class="source-toggle"
                type="checkbox"
                :checked="pet.enabled"
                @change="pet.setEnabled(($event.target as HTMLInputElement).checked)"
              />
            </label>

            <p class="setting-lead spaced">选择桌宠</p>
            <div class="pet-pick-row">
              <button
                v-for="opt in PET_OPTIONS"
                :key="opt.id"
                type="button"
                :class="['pet-pick', pet.petId === opt.id ? 'active' : '']"
                :disabled="!pet.enabled"
                @click="pet.setPetId(opt.id)"
              >
                <PetSprites kind="pet" :pet-id="opt.id" :size="44" />
                <span>{{ opt.label }}</span>
              </button>
            </div>

            <p class="setting-lead spaced">摆放贴图</p>
            <div class="sticker-pick-row">
              <button
                v-for="opt in STICKER_OPTIONS"
                :key="opt.id"
                type="button"
                :class="['sticker-pick', pet.placingStickerId === opt.id ? 'active' : '']"
                :title="`放置${opt.label}`"
                @click="togglePlace(opt.id)"
              >
                <PetSprites kind="sticker" :sticker-id="opt.id" :size="28" />
                <span>{{ opt.label }}</span>
              </button>
            </div>

            <div class="action-row pet-actions">
              <button
                type="button"
                class="btn-action"
                :disabled="!pet.placingStickerId"
                @click="pet.cancelPlacing()"
              >
                取消放置
              </button>
              <button
                type="button"
                class="btn-action"
                :disabled="pet.stickers.length === 0"
                @click="pet.clearStickers()"
              >
                清空贴图（{{ pet.stickers.length }}）
              </button>
            </div>
            <p class="setting-hint">
              点选贴纸后到页面空白处点击放置；拖动可移动，点 × 或右键可删除。不影响播放与搜索。
            </p>
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
              <li><kbd>Esc</kbd> 关闭歌词</li>
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
          <h2>听歌统计</h2>
          <div class="sketch-card">
            <div class="stats-overview">
              <div class="stat-box">
                <span class="stat-value">{{ stats.totalPlays }}</span>
                <span class="stat-label">累计播放</span>
              </div>
              <div class="stat-box">
                <span class="stat-value">{{ stats.totalHours }}<small>h</small></span>
                <span class="stat-label">听歌时长</span>
              </div>
              <div class="stat-box">
                <span class="stat-value">{{ stats.uniqueSongs }}</span>
                <span class="stat-label">听过歌曲</span>
              </div>
              <div class="stat-box">
                <span class="stat-value">{{ stats.uniqueArtists }}</span>
                <span class="stat-label">涉及歌手</span>
              </div>
            </div>

            <div v-if="stats.weeklyChart.some(d => d.minutes > 0)" class="stats-chart">
              <p class="setting-lead spaced">近 7 天听歌（分钟）</p>
              <div class="weekly-bars">
                <div v-for="d in stats.weeklyChart" :key="d.day" class="weekly-bar-col">
                  <div class="weekly-bar-track">
                    <div
                      class="weekly-bar-fill"
                      :style="{ height: `${Math.min(100, (d.minutes / maxWeeklyMinutes) * 100)}%` }"
                    />
                  </div>
                  <span class="weekly-bar-label">{{ d.label }}</span>
                  <span class="weekly-bar-value">{{ d.minutes }}</span>
                </div>
              </div>
            </div>

            <div v-if="stats.topSongs.length > 0" class="stats-top">
              <p class="setting-lead spaced">最常听歌曲</p>
              <ol class="stats-list">
                <li v-for="s in stats.topSongs.slice(0, 5)" :key="s.key">
                  <span class="stats-list-title">{{ s.title }}</span>
                  <span class="stats-list-count">{{ s.count }} 次</span>
                </li>
              </ol>
            </div>

            <div v-if="stats.topArtists.length > 0" class="stats-top">
              <p class="setting-lead spaced">最常听歌手</p>
              <ol class="stats-list">
                <li v-for="a in stats.topArtists.slice(0, 5)" :key="a.name">
                  <span class="stats-list-title">{{ a.name }}</span>
                  <span class="stats-list-count">{{ a.count }} 次</span>
                </li>
              </ol>
            </div>

            <p v-if="stats.totalPlays === 0" class="setting-hint">还没有播放记录，听几首歌后这里就会有数据啦。</p>
          </div>
        </section>

        <section class="settings-section">
          <h2>关于</h2>
          <div class="sketch-card">
            <div class="about-brand">
              <SketchIcon name="music" :size="24" />
              <span>墨韵 MoYun</span>
            </div>
            <p class="about-desc">一个手绘风格的多音源在线音乐播放器</p>
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
import PetSprites from '../icons/PetSprites.vue';
import ThemeCustomizer from '../ThemeCustomizer.vue';
import { useSearchStore } from '../../stores/search';
import { usePlayerStore, type AudioQuality } from '../../stores/player';
import { useUIStore } from '../../stores/ui';
import { useStatsStore } from '../../stores/stats';
import { PET_OPTIONS, STICKER_OPTIONS, usePetStore, type StickerId } from '../../stores/pet';
import storage from '../../core/storage';
import { APP_BUILD_TIME, APP_VERSION, UPDATE_NOTES } from '../../version';
import { computed } from 'vue';

const search = useSearchStore();
const player = usePlayerStore();
const ui = useUIStore();
const pet = usePetStore();
const stats = useStatsStore();

const maxWeeklyMinutes = computed(() =>
  Math.max(1, ...stats.weeklyChart.map((d) => d.minutes)),
);

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

function togglePlace(stickerId: StickerId) {
  if (pet.placingStickerId === stickerId) pet.cancelPlacing();
  else pet.startPlacing(stickerId);
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

.settings-scroll {
  padding-top: 10px;
}

.source-list {
  display: grid;
  gap: 10px;
}

.source-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border: 1px dashed var(--border);
  border-radius: var(--ui-radius-sm, 8px);
  font-family: var(--ui-font, inherit);
  color: var(--text-secondary, var(--ink-soft));
  background: var(--surface, transparent);
  transition: border-color 0.2s ease;
}

.source-item:hover {
  border-color: var(--border-strong);
}

.source-toggle {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-strong, var(--border));
  border-radius: 6px;
  background: var(--surface-strong, var(--bg, white));
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.source-toggle:checked {
  background: var(--accent);
  border-color: var(--accent);
}

.source-toggle:checked::after {
  content: '✓';
  position: absolute;
  left: 3px;
  top: -2px;
  font-size: 13px;
  color: #fff;
  font-weight: 700;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 6px 0 12px;
}

.pet-pick-row,
.sticker-pick-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 6px 0 10px;
}

.pet-pick,
.sticker-pick {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 6px;
  border: 1px dashed var(--border);
  border-radius: var(--ui-radius-sm, 8px);
  background: var(--surface, transparent);
  color: var(--text-secondary, var(--ink-soft));
  font-family: var(--ui-font, inherit);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pet-pick:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pet-pick:hover:not(:disabled),
.sticker-pick:hover {
  border-color: var(--accent);
  color: var(--ink);
}

.pet-pick.active,
.sticker-pick.active {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
}

.pet-actions {
  margin-top: 4px;
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
  font-family: var(--ui-font, inherit);
  color: var(--text-secondary, var(--ink-soft));
  font-size: 14px;
}

.shortcut-list kbd {
  display: inline-block;
  min-width: 1.6em;
  padding: 2px 8px;
  margin-right: 2px;
  border: 2px dashed var(--border-strong, var(--border));
  border-radius: 6px;
  background: var(--surface-strong, var(--surface));
  font-family: var(--ui-font, inherit);
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.setting-hint {
  margin-top: 10px;
  color: var(--text-muted, var(--muted));
  font-size: 13px;
  font-family: var(--ui-font, inherit);
}

/* ===== 听歌统计 ===== */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px 6px;
  border: 1px dashed var(--border);
  border-radius: 9px 13px 7px 11px;
  background: var(--surface, transparent);
  box-shadow: 2px 2px 0 var(--shadow-ink);
}

.stat-value {
  font-family: var(--ui-font, inherit);
  font-size: 22px;
  font-weight: 600;
  color: var(--accent);
  line-height: 1.1;
}

.stat-value small {
  font-size: 13px;
  font-weight: 400;
  color: var(--muted);
}

.stat-label {
  font-family: var(--ui-font, inherit);
  font-size: 11px;
  color: var(--muted);
}

.stats-chart {
  margin-top: 6px;
}

.weekly-bars {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 100px;
  padding: 8px 4px 0;
}

.weekly-bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  height: 100%;
}

.weekly-bar-track {
  flex: 1;
  width: 100%;
  max-width: 32px;
  display: flex;
  align-items: flex-end;
  border-radius: 4px 4px 0 0;
  background: var(--bg-subtle, rgba(0, 0, 0, 0.04));
  overflow: hidden;
}

.weekly-bar-fill {
  width: 100%;
  border-radius: 4px 4px 0 0;
  background: var(--accent);
  transition: height 0.3s ease;
  min-height: 2px;
}

.weekly-bar-label {
  font-family: var(--ui-font, inherit);
  font-size: 11px;
  color: var(--muted);
}

.weekly-bar-value {
  font-family: var(--ui-font, inherit);
  font-size: 10px;
  color: var(--faint);
}

.stats-top {
  margin-top: 4px;
}

.stats-list {
  margin: 4px 0 0;
  padding-left: 0;
  list-style: none;
  display: grid;
  gap: 4px;
}

.stats-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 8px;
  border-radius: 6px;
  font-family: var(--ui-font, inherit);
  font-size: 13px;
  color: var(--ink-soft);
}

.stats-list li:nth-child(odd) {
  background: var(--bg-subtle, rgba(0, 0, 0, 0.02));
}

.stats-list-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
}

.stats-list-count {
  color: var(--muted);
  font-size: 12px;
  flex-shrink: 0;
  margin-left: 8px;
}

@media (max-width: 768px) {
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }
}

.about-version {
  margin: 10px 0 0;
  font-family: var(--ui-font, inherit);
  color: var(--text-faint, var(--faint));
  font-size: 13px;
}

.update-notes {
  margin: 12px 0 0;
  padding-left: 18px;
  color: var(--text-secondary, var(--ink-soft));
  font-family: var(--ui-font, inherit);
  font-size: 13px;
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
