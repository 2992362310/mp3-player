/** 主题预设与自定义配置 */

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

export type UiStyle = 'sketch' | 'fresh' | 'minimal';
export type UiBorder = 'dashed' | 'solid';
export type UiPattern = 'grid' | 'dots' | 'wash' | 'none';
export type UiFont = 'hand' | 'kai' | 'sans' | 'mono';
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
}> = [
  { id: 'paper', label: '素纸', swatch: '#faf7f0', accent: '#5b57d1' },
  { id: 'breeze', label: '晴空', swatch: '#f1f7fb', accent: '#2f7cc4' },
  { id: 'gadgetcat', label: '蓝喵', swatch: '#eef4f9', accent: '#1f7fb8' },
  { id: 'matrix', label: '矩阵', swatch: '#0a0f0c', accent: '#3fd070' },
  { id: 'maruko', label: '晚樱', swatch: '#fdf2f7', accent: '#d15e88' },
  { id: 'ink', label: '夜幕', swatch: '#1a1d22', accent: '#8e93e8' },
  { id: 'cyberpunk', label: '现场', swatch: '#0f1014', accent: '#f2d21a' },
  { id: 'celadon', label: '青瓷', swatch: '#e8f1ef', accent: '#2f7a6b' },
  { id: 'sand', label: '暖阳', swatch: '#faf3e3', accent: '#c0741c' },
  { id: 'mint', label: '薄荷', swatch: '#eef6ee', accent: '#1f8a5c' },
  { id: 'cinnabar', label: '丹霞', swatch: '#fbefeb', accent: '#bf4530' },
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
  '#5b57d1',
  '#2f7cc4',
  '#1f8a5c',
  '#bf4530',
  '#c0741c',
  '#d15e88',
] as const;

export const DEFAULT_CUSTOMIZE: ThemeCustomize = {
  style: 'sketch',
  border: 'dashed',
  pattern: 'grid',
  font: 'hand',
  radius: 'soft',
  accent: '',
};

const STYLE_DEFAULTS: Record<AppTheme, Partial<ThemeCustomize>> = {
  paper: { style: 'sketch', border: 'dashed', pattern: 'grid', font: 'hand', radius: 'soft' },
  sand: { style: 'sketch', border: 'dashed', pattern: 'grid', font: 'hand', radius: 'soft' },
  mint: { style: 'sketch', border: 'dashed', pattern: 'grid', font: 'hand', radius: 'soft' },
  ink: { style: 'sketch', border: 'dashed', pattern: 'grid', font: 'hand', radius: 'soft' },
  celadon: { style: 'sketch', border: 'dashed', pattern: 'grid', font: 'kai', radius: 'soft' },
  cinnabar: { style: 'sketch', border: 'dashed', pattern: 'grid', font: 'hand', radius: 'soft' },
  breeze: { style: 'fresh', border: 'solid', pattern: 'wash', font: 'sans', radius: 'round' },
  gadgetcat: { style: 'fresh', border: 'solid', pattern: 'dots', font: 'sans', radius: 'round' },
  maruko: { style: 'fresh', border: 'solid', pattern: 'wash', font: 'sans', radius: 'round' },
  matrix: { style: 'minimal', border: 'solid', pattern: 'none', font: 'mono', radius: 'sharp' },
  cyberpunk: { style: 'minimal', border: 'solid', pattern: 'none', font: 'sans', radius: 'sharp' },
};

export function normalizeTheme(value: string | null | undefined): AppTheme {
  return THEME_IDS.includes(value as AppTheme) ? (value as AppTheme) : 'paper';
}

export function normalizeCustomize(raw: Partial<ThemeCustomize> | null | undefined): ThemeCustomize {
  const base = { ...DEFAULT_CUSTOMIZE, ...(raw || {}) };
  const styles: UiStyle[] = ['sketch', 'fresh', 'minimal'];
  const borders: UiBorder[] = ['dashed', 'solid'];
  const patterns: UiPattern[] = ['grid', 'dots', 'wash', 'none'];
  const fonts: UiFont[] = ['hand', 'kai', 'sans', 'mono'];
  const radii: UiRadius[] = ['sharp', 'soft', 'round'];

  return {
    style: styles.includes(base.style) ? base.style : DEFAULT_CUSTOMIZE.style,
    border: borders.includes(base.border) ? base.border : DEFAULT_CUSTOMIZE.border,
    pattern: patterns.includes(base.pattern) ? base.pattern : DEFAULT_CUSTOMIZE.pattern,
    font: fonts.includes(base.font) ? base.font : DEFAULT_CUSTOMIZE.font,
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
    root.style.setProperty('--accent-soft', `${accent}24`);
    root.style.setProperty('--accent-green', mixHex(accent, 'white', 0.15));
    root.style.setProperty('--accent-green-strong', mixHex(accent, 'black', 0.12));
  } else {
    root.style.removeProperty('--accent');
    root.style.removeProperty('--accent-soft');
    root.style.removeProperty('--accent-green');
    root.style.removeProperty('--accent-green-strong');
  }
}
