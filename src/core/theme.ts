/** 主题预设与自定义配置 */

export type AppTheme =
  | 'paper'
  | 'sand'
  | 'mint'
  | 'ink'
  | 'celadon'
  | 'cinnabar'
  | 'breeze';

export type UiStyle = 'sketch' | 'fresh' | 'minimal';
export type UiBorder = 'dashed' | 'solid';
export type UiPattern = 'grid' | 'dots' | 'wash' | 'none';
export type UiFont = 'hand' | 'kai' | 'sans';
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
];

export const THEME_PRESETS: Array<{
  id: AppTheme;
  label: string;
  swatch: string;
  accent: string;
}> = [
  { id: 'paper', label: '宣纸', swatch: '#fdf6e3', accent: '#c0392b' },
  { id: 'sand', label: '暖沙', swatch: '#f8ecd2', accent: '#b45309' },
  { id: 'mint', label: '薄荷', swatch: '#eaf4ec', accent: '#0f766e' },
  { id: 'ink', label: '墨夜', swatch: '#1c2228', accent: '#d4a574' },
  { id: 'celadon', label: '青瓷', swatch: '#e4ece8', accent: '#3d6b5e' },
  { id: 'cinnabar', label: '朱砂', swatch: '#f0ebe6', accent: '#b33a2b' },
  { id: 'breeze', label: '清风', swatch: '#eef8f5', accent: '#2aa89a' },
];

export const ACCENT_PRESETS = [
  '#c0392b',
  '#b45309',
  '#0f766e',
  '#2aa89a',
  '#3d6b5e',
  '#2563eb',
  '#b33a2b',
  '#d4a574',
  '#ca8a04',
  '#64748b',
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
};

export function normalizeTheme(value: string | null | undefined): AppTheme {
  return THEME_IDS.includes(value as AppTheme) ? (value as AppTheme) : 'paper';
}

export function normalizeCustomize(raw: Partial<ThemeCustomize> | null | undefined): ThemeCustomize {
  const base = { ...DEFAULT_CUSTOMIZE, ...(raw || {}) };
  const styles: UiStyle[] = ['sketch', 'fresh', 'minimal'];
  const borders: UiBorder[] = ['dashed', 'solid'];
  const patterns: UiPattern[] = ['grid', 'dots', 'wash', 'none'];
  const fonts: UiFont[] = ['hand', 'kai', 'sans'];
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
