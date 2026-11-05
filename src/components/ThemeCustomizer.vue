<template>
  <div class="theme-customizer">
    <p class="setting-lead">听歌人格氛围</p>
    <div class="mood-grid">
      <button
        v-for="mood in LISTENING_MOODS"
        :key="mood.id"
        type="button"
        :class="['mood-card', ui.theme === mood.theme ? 'active' : '']"
        @click="ui.setTheme(mood.theme)"
      >
        <span class="mood-types">{{ mood.types }}</span>
        <strong>{{ mood.title }}</strong>
        <span class="mood-description">{{ mood.description }}</span>
      </button>
    </div>
    <p class="setting-hint">MBTI 仅作氛围灵感，不代表人格测评。</p>

    <p class="setting-lead">底色预设</p>
    <div class="preset-grid">
      <button
        v-for="preset in THEME_PRESETS"
        :key="preset.id"
        type="button"
        :class="['preset-card', ui.theme === preset.id ? 'active' : '']"
        :title="preset.label"
        @click="ui.setTheme(preset.id)"
      >
        <span
          class="preset-swatch"
          :style="{ background: preset.swatch, boxShadow: `inset 0 0 0 2px ${preset.accent}55` }"
        >
          <span v-if="preset.id === 'gadgetcat'" class="preset-mascot preset-mascot--cat" aria-hidden="true">
            <svg viewBox="0 0 28 20" role="img" focusable="false">
              <path d="M6 7.5 L9 4.2 L11 8.1" class="line" />
              <path d="M22 7.5 L19 4.2 L17 8.1" class="line" />
              <rect x="5" y="7" width="18" height="10" rx="5" class="fill" />
              <circle cx="11" cy="12" r="1.2" class="dot" />
              <circle cx="17" cy="12" r="1.2" class="dot" />
              <path d="M13 14 Q14 15 15 14" class="line" />
            </svg>
          </span>
        </span>
        <span class="preset-label">{{ preset.label }}</span>
      </button>
    </div>

    <p class="setting-lead spaced">造型风格</p>
    <div class="chip-row">
      <button
        v-for="opt in styleOptions"
        :key="opt.id"
        type="button"
        :class="['chip', ui.customize.style === opt.id ? 'active' : '']"
        @click="ui.patchCustomize({ style: opt.id })"
      >
        {{ opt.label }}
      </button>
    </div>

    <p class="setting-lead spaced">字体</p>
    <div class="chip-row">
      <button
        v-for="opt in fontOptions"
        :key="opt.id"
        type="button"
        :class="['chip', ui.customize.font === opt.id ? 'active' : '']"
        @click="ui.patchCustomize({ font: opt.id })"
      >
        {{ opt.label }}
      </button>
    </div>

    <p class="setting-lead spaced">边框</p>
    <div class="chip-row">
      <button
        v-for="opt in borderOptions"
        :key="opt.id"
        type="button"
        :class="['chip', ui.customize.border === opt.id ? 'active' : '']"
        @click="ui.patchCustomize({ border: opt.id })"
      >
        {{ opt.label }}
      </button>
    </div>
    <p class="setting-hint">虚线偏手绘装饰，实线更利落。顶栏/底栏与播放状态始终用实线；粗=主结构，细=分割；深=近，浅=远。</p>

    <p class="setting-lead spaced">圆角</p>
    <div class="chip-row">
      <button
        v-for="opt in radiusOptions"
        :key="opt.id"
        type="button"
        :class="['chip', ui.customize.radius === opt.id ? 'active' : '']"
        @click="ui.patchCustomize({ radius: opt.id })"
      >
        {{ opt.label }}
      </button>
    </div>

    <p class="setting-lead spaced">背景纹理</p>
    <div class="chip-row">
      <button
        v-for="opt in patternOptions"
        :key="opt.id"
        type="button"
        :class="['chip', ui.customize.pattern === opt.id ? 'active' : '']"
        @click="ui.patchCustomize({ pattern: opt.id })"
      >
        {{ opt.label }}
      </button>
    </div>

    <p class="setting-lead spaced">强调色</p>
    <div class="accent-row">
      <button
        type="button"
        :class="['accent-dot', !ui.customize.accent ? 'active' : '']"
        title="跟随预设"
        @click="ui.patchCustomize({ accent: '' })"
      >
        默
      </button>
      <button
        v-for="color in ACCENT_PRESETS"
        :key="color"
        type="button"
        :class="['accent-dot', ui.customize.accent === color ? 'active' : '']"
        :style="{ background: color }"
        :title="color"
        @click="ui.patchCustomize({ accent: color })"
      />
      <label class="accent-custom" title="自定义颜色">
        <input
          type="color"
          :value="ui.customize.accent || currentPresetAccent"
          @input="onCustomAccent"
        />
        <span>自定义</span>
      </label>
    </div>

    <p class="setting-lead spaced">全局背景图</p>
    <div class="background-controls">
      <label class="background-upload">
        <input type="file" accept="image/*" @change="onBackgroundFile" />
        <span>{{ ui.backgroundUrl ? '更换图片' : '上传图片' }}</span>
      </label>
      <input
        v-model="backgroundUrlDraft"
        class="background-url"
        type="url"
        placeholder="或粘贴 https 图片地址"
        aria-label="背景图片地址"
      />
      <button type="button" class="background-apply" :disabled="!backgroundUrlDraft.trim()" @click="applyBackgroundUrl">
        应用
      </button>
      <button type="button" class="background-clear" :disabled="!ui.backgroundUrl" @click="clearBackground">
        清除
      </button>
    </div>
    <label class="background-opacity">
      <span>背景浓度</span>
      <input
        type="range"
        min="0.08"
        max="0.8"
        step="0.01"
        :value="ui.backgroundOpacity"
        :disabled="!ui.backgroundUrl"
        @input="onBackgroundOpacity"
      />
      <output>{{ Math.round(ui.backgroundOpacity * 100) }}%</output>
    </label>
    <p v-if="backgroundError" class="setting-hint background-error" role="alert">{{ backgroundError }}</p>

    <div class="theme-actions">
      <button type="button" class="btn-action" @click="ui.resetCustomize()">恢复当前预设默认</button>
    </div>
    <p class="setting-hint">可叠加调整风格、字体、边框、圆角与强调色，设置会自动保存。</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  ACCENT_PRESETS,
  LISTENING_MOODS,
  THEME_PRESETS,
  type UiBorder,
  type UiFont,
  type UiPattern,
  type UiRadius,
  type UiStyle,
} from '../core/theme';
import { useUIStore } from '../stores/ui';

const ui = useUIStore();
const backgroundUrlDraft = ref(ui.backgroundUrl);
const backgroundError = ref('');

async function onBackgroundFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  backgroundError.value = '';
  try {
    const imageUrl = await compressImage(file);
    ui.setBackgroundUrl(imageUrl);
    backgroundUrlDraft.value = imageUrl;
  } catch {
    backgroundError.value = '图片读取失败，请换一张图片再试。';
  } finally {
    input.value = '';
  }
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Canvas unavailable'));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.78));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Image decode failed'));
    };
    image.src = objectUrl;
  });
}

function applyBackgroundUrl() {
  const value = backgroundUrlDraft.value.trim();
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Unsupported protocol');
    backgroundError.value = '';
    ui.setBackgroundUrl(url.href);
  } catch {
    backgroundError.value = '请输入有效的图片网址。';
  }
}

function clearBackground() {
  ui.setBackgroundUrl('');
  backgroundUrlDraft.value = '';
  backgroundError.value = '';
}

function onBackgroundOpacity(e: Event) {
  ui.setBackgroundOpacity(Number((e.target as HTMLInputElement).value));
}

const styleOptions: Array<{ id: UiStyle; label: string }> = [
  { id: 'sketch', label: '手绘' },
  { id: 'fresh', label: '清新' },
  { id: 'minimal', label: '极简' },
];

const fontOptions: Array<{ id: UiFont; label: string }> = [
  { id: 'hand', label: '手写' },
  { id: 'kai', label: '楷体' },
  { id: 'sans', label: '无衬线' },
  { id: 'mono', label: '等宽' },
];

const borderOptions: Array<{ id: UiBorder; label: string }> = [
  { id: 'dashed', label: '手绘虚线' },
  { id: 'solid', label: '利落实线' },
];

const radiusOptions: Array<{ id: UiRadius; label: string }> = [
  { id: 'sharp', label: '偏方' },
  { id: 'soft', label: '适中' },
  { id: 'round', label: '偏圆' },
];

const patternOptions: Array<{ id: UiPattern; label: string }> = [
  { id: 'grid', label: '网格' },
  { id: 'dots', label: '点阵' },
  { id: 'wash', label: '柔光' },
  { id: 'none', label: '纯色' },
];

const currentPresetAccent = computed(
  () => THEME_PRESETS.find((p) => p.id === ui.theme)?.accent || '#b83228',
);

function onCustomAccent(e: Event) {
  const value = (e.target as HTMLInputElement).value;
  ui.patchCustomize({ accent: value });
}
</script>

<style scoped>
.theme-customizer {
  display: flex;
  flex-direction: column;
}

.mood-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.mood-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 10px;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: var(--surface);
  color: var(--ink-soft);
  text-align: left;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.mood-card:hover { transform: translateY(-2px); border-color: var(--accent); }
.mood-card.active { border-color: var(--accent); background: var(--accent-soft); color: var(--ink); }
.mood-card strong { font-size: 14px; }
.mood-types { color: var(--accent); font-size: 11px; }
.mood-description { color: var(--muted); font-size: 11px; line-height: 1.4; }

.setting-lead {
  margin: 0 0 8px;
  color: var(--ink-soft);
  font-size: 14px;
}

.setting-lead.spaced {
  margin-top: 16px;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 8px;
}

.preset-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 6px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  color: var(--ink-soft);
  font-family: inherit;
  font-size: 12px;
}

.preset-card.active {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--ink);
}

.preset-swatch {
  width: 100%;
  height: 28px;
  border-radius: 8px;
  border: 1px solid var(--border-soft);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preset-mascot {
  width: 28px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.preset-mascot svg {
  width: 100%;
  height: 100%;
}

.preset-mascot .fill {
  fill: rgba(255, 255, 255, 0.78);
  stroke: rgba(255, 255, 255, 0.65);
  stroke-width: 1;
}

.preset-mascot .line {
  fill: none;
  stroke: rgba(255, 255, 255, 0.92);
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.preset-mascot .dot {
  fill: rgba(255, 255, 255, 0.95);
  stroke: rgba(255, 255, 255, 0.95);
  stroke-width: 1.2;
  stroke-linecap: round;
}

.preset-mascot--cat svg {
  transform: translateY(0.4px);
}

.preset-label {
  line-height: 1;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: transparent;
  color: var(--ink-soft);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
}

.chip.active {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--ink);
}

.accent-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.accent-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: var(--control-fill);
  cursor: pointer;
  padding: 0;
  font-size: 11px;
  color: var(--ink-soft);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.accent-dot.active {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.accent-custom {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: 1px dashed var(--border);
  border-radius: 8px;
  color: var(--muted);
  font-size: 12px;
  cursor: pointer;
}

.accent-custom input {
  width: 28px;
  height: 22px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.theme-actions {
  margin-top: 14px;
}

.background-controls {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  gap: 6px;
  align-items: center;
}

.background-upload,
.background-apply,
.background-clear {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  color: var(--ink-soft);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.background-upload input { display: none; }
.background-apply:hover:not(:disabled),
.background-clear:hover:not(:disabled),
.background-upload:hover { border-color: var(--accent); color: var(--accent); }
.background-apply:disabled,
.background-clear:disabled { opacity: 0.45; cursor: not-allowed; }

.background-url {
  width: 100%;
  min-width: 0;
  height: 34px;
  padding: 0 9px;
  border: 1px solid var(--border-soft);
  border-radius: 6px;
  background: var(--surface-strong);
  color: var(--ink);
  font: inherit;
  font-size: 12px;
}

.background-opacity {
  display: grid;
  grid-template-columns: auto minmax(80px, 1fr) 42px;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  color: var(--ink-soft);
  font-size: 12px;
}

.background-opacity input { width: 100%; accent-color: var(--accent); }
.background-opacity output { color: var(--muted); text-align: right; }
.background-error { color: var(--accent); }

.setting-hint {
  margin-top: 10px;
  color: var(--muted);
  font-size: 13px;
}

@media (max-width: 520px) {
  .background-controls { grid-template-columns: auto minmax(0, 1fr) auto; }
  .background-clear { grid-column: 3; }
  .background-url { grid-column: 1 / 3; grid-row: 2; }
  .background-apply { grid-column: 3; grid-row: 2; }
}
</style>
