/** 主题预设与自定义配置 — Aurora 设计体系 */

export type AppTheme =
  | 'paper'
  | 'sand'
  | 'mint'
  | 'ink'
  | 'celadon'
  | 'cinnabar'
  | 'breeze'
  | 'gadgetcat'
  | 'maruko'
  | 'matrix'
  | 'cyberpunk';

export type UiStyle = 'glass' | 'solid' | 'minimal';
export type UiBorder = 'subtle' | 'visible';
export type UiPattern = 'gradient' | 'grid' | 'dots' | 'none';
export type UiFont = 'sans' | 'serif' | 'mono';
export type UiRadius = 'sharp' | 'soft' | 'round';

export interface ThemeCustomize {
  style: UiStyle;
  border: UiBorder;
  pattern: UiPattern;
  font: UiFont;
  radius: UiRadius;
  /** 空字符串表示跟随预设强调色 */
  accent: string;
}

export const THEME_IDS: AppTheme[] = [
  'paper',
  'sand',
  'mint',
  'ink',
  'celadon',
  'cinnabar',
  'breeze',
  'gadgetcat',
  'maruko',
  'matrix',
  'cyberpunk',
];

export const THEME_PRESETS: Array<{
  id: AppTheme;
  label: string;
  swatch: string;
  accent: string;
  dark?: boolean;
}> = [
  { id: 'paper', label: '云白', swatch: '#f1f5f9', accent: '#6366f1' },
  { id: 'breeze', label: '晴空', swatch: '#eff6ff', accent: '#3b82f6', dark: false },
  { id: 'ink', label: '夜幕', swatch: '#0f172a', accent: '#818cf8', dark: true },
  { id: 'sand', label: '暖阳', swatch: '#fffbeb', accent: '#f59e0b' },
  { id: 'mint', label: '薄荷', swatch: '#f0fdf4', accent: '#10b981' },
  { id: 'maruko', label: '晚樱', swatch: '#fdf2f8', accent: '#ec4899' },
  { id: 'matrix', label: '深空', swatch: '#030712', accent: '#22c55e', dark: true },
  { id: 'cyberpunk', label: '赛博', swatch: '#0a0a0f', accent: '#eab308', dark: true },
  { id: 'celadon', label: '青瓷', swatch: '#f0fdfa', accent: '#14b8a6' },
  { id: 'gadgetcat', label: '冰晶', swatch: '#f0f9ff', accent: '#6366f1' },
  { id: 'cinnabar', label: '丹霞', swatch: '#fef2f2', accent: '#ef4444' },
];

export const LISTENING_MOODS: Array<{
  id: 'dream' | 'night' | 'live' | 'focus';
  title: string;
  types: string;
  description: string;
  theme: AppTheme;
}> = [
  { id: 'dream', title: '梦游收藏家', types: 'INFP / ENFP', description: '把旋律收进自己的小宇宙', theme: 'maruko' },
  { id: 'night', title: '夜航感受派', types: 'INFJ / ISFP', description: '在夜色里慢慢听见情绪', theme: 'ink' },
  { id: 'live', title: '现场能量派', types: 'ESFP / ENTP', description: '让节拍把今天点亮', theme: 'cyberpunk' },
  { id: 'focus', title: '深度聆听者', types: 'INTJ / ISTJ', description: '沿着细节听完整张专辑', theme: 'celadon' },
];

export const ACCENT_PRESETS = [
  '#6366f1',
  '#3b82f6',
  '#10b981',
  '#ec4899',
  '#f59e0b',
  '#ef4444',
] as const;

export const DEFAULT_CUSTOMIZE: ThemeCustomize = {
  style: 'glass',
  border: 'subtle',
  pattern: 'gradient',
  font: 'sans',
  radius: 'soft',
  accent: '',
};

const STYLE_DEFAULTS: Record<AppTheme, Partial<ThemeCustomize>> = {
  paper:     { style: 'glass', border: 'subtle', pattern: 'gradient', font: 'sans', radius: 'soft' },
  sand:      { style: 'glass', border: 'subtle', pattern: 'gradient', font: 'sans', radius: 'soft' },
  mint:      { style: 'glass', border: 'subtle', pattern: 'gradient', font: 'sans', radius: 'soft' },
  ink:       { style: 'glass', border: 'subtle', pattern: 'gradient', font: 'sans', radius: 'soft' },
  celadon:   { style: 'glass', border: 'subtle', pattern: 'gradient', font: 'sans', radius: 'soft' },
  cinnabar:  { style: 'glass', border: 'subtle', pattern: 'gradient', font: 'sans', radius: 'soft' },
  breeze:    { style: 'glass', border: 'subtle', pattern: 'gradient', font: 'sans', radius: 'soft' },
  gadgetcat: { style: 'solid', border: 'subtle', pattern: 'grid',    font: 'sans', radius: 'round' },
  maruko:    { style: 'glass', border: 'subtle', pattern: 'gradient', font: 'sans', radius: 'round' },
  matrix:    { style: 'minimal', border: 'visible', pattern: 'grid',  font: 'mono', radius: 'sharp' },
  cyberpunk: { style: 'minimal', border: 'visible', pattern: 'grid',  font: 'mono', radius: 'sharp' },
};

export function normalizeTheme(value: string | null | undefined): AppTheme {
  return THEME_IDS.includes(value as AppTheme) ? (value as AppTheme) : 'paper';
}

export function normalizeCustomize(raw: Partial<ThemeCustomize> | null | undefined): ThemeCustomize {
  const base = { ...DEFAULT_CUSTOMIZE, ...(raw || {}) };
  const styles: UiStyle[] = ['glass', 'solid', 'minimal'];
  const borders: UiBorder[] = ['subtle', 'visible'];
  const patterns: UiPattern[] = ['gradient', 'grid', 'dots', 'none'];
  const fonts: UiFont[] = ['sans', 'serif', 'mono'];
  const radii: UiRadius[] = ['sharp', 'soft', 'round'];

  // 兼容旧值映射
  const legacyStyle: Record<string, UiStyle> = { sketch: 'glass', fresh: 'solid' };
  const legacyBorder: Record<string, UiBorder> = { dashed: 'subtle', solid: 'visible' };
  const legacyPattern: Record<string, UiPattern> = { wash: 'gradient' };
  const legacyFont: Record<string, UiFont> = { hand: 'sans', kai: 'serif' };

  const rawStyle = legacyStyle[base.style] || base.style;
  const rawBorder = legacyBorder[base.border] || base.border;
  const rawPattern = legacyPattern[base.pattern] || base.pattern;
  const rawFont = legacyFont[base.font] || base.font;

  return {
    style: styles.includes(rawStyle) ? rawStyle : DEFAULT_CUSTOMIZE.style,
    border: borders.includes(rawBorder) ? rawBorder : DEFAULT_CUSTOMIZE.border,
    pattern: patterns.includes(rawPattern) ? rawPattern : DEFAULT_CUSTOMIZE.pattern,
    font: fonts.includes(rawFont) ? rawFont : DEFAULT_CUSTOMIZE.font,
    radius: radii.includes(base.radius) ? base.radius : DEFAULT_CUSTOMIZE.radius,
    accent: typeof base.accent === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(base.accent)
      ? base.accent
      : '',
  };
}

export function defaultsForTheme(theme: AppTheme): ThemeCustomize {
  return normalizeCustomize({ ...DEFAULT_CUSTOMIZE, ...STYLE_DEFAULTS[theme], accent: '' });
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.replace('#', '');
  const full = raw.length === 3
    ? raw.split('').map((c) => c + c).join('')
    : raw;
  if (full.length !== 6) return null;
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function mixHex(hex: string, toward: 'white' | 'black', amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const t = toward === 'white' ? 255 : 0;
  const r = Math.round(rgb.r + (t - rgb.r) * amount);
  const g = Math.round(rgb.g + (t - rgb.g) * amount);
  const b = Math.round(rgb.b + (t - rgb.b) * amount);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function applyThemeToDocument(theme: AppTheme, customize: ThemeCustomize) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.setAttribute('data-ui-style', customize.style);
  root.setAttribute('data-ui-border', customize.border);
  root.setAttribute('data-ui-pattern', customize.pattern);
  root.setAttribute('data-ui-font', customize.font);
  root.setAttribute('data-ui-radius', customize.radius);

  if (customize.accent) {
    const accent = customize.accent;
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-soft', `${accent}20`);
    root.style.setProperty('--accent-hover', mixHex(accent, 'black', 0.12));
    root.style.setProperty('--accent-glow', `${accent}40`);
  } else {
    root.style.removeProperty('--accent');
    root.style.removeProperty('--accent-soft');
    root.style.removeProperty('--accent-hover');
    root.style.removeProperty('--accent-glow');
  }
}
