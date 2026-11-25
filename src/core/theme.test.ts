import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CUSTOMIZE,
  THEME_IDS,
  THEME_PRESETS,
  defaultsForTheme,
  normalizeCustomize,
  normalizeTheme,
} from './theme';

describe('theme helpers', () => {
  it('每套预设都能被 normalizeTheme 识别，且 ID 与预设一一对应', () => {
    for (const id of THEME_IDS) expect(normalizeTheme(id)).toBe(id);
    expect(new Set(THEME_PRESETS.map((p) => p.id))).toEqual(new Set(THEME_IDS));
    expect(normalizeTheme('不存在')).toBe('paper');
    expect(normalizeTheme(null)).toBe('paper');
  });

  it('normalizeCustomize 对非法枚举值回落到默认值', () => {
    expect(normalizeCustomize({ style: 'bad' as never, font: 'bad' as never })).toMatchObject({
      style: DEFAULT_CUSTOMIZE.style,
      font: DEFAULT_CUSTOMIZE.font,
    });
  });

  it('normalizeCustomize 只接受合法十六进制强调色', () => {
    expect(normalizeCustomize({ accent: '#5b57d1' }).accent).toBe('#5b57d1');
    expect(normalizeCustomize({ accent: '#abc' }).accent).toBe('#abc');
    expect(normalizeCustomize({ accent: 'red' }).accent).toBe('');
    expect(normalizeCustomize({ accent: 123 as never }).accent).toBe('');
  });

  it('defaultsForTheme 对每套主题都返回合法配置', () => {
    for (const id of THEME_IDS) {
      const result = defaultsForTheme(id);
      expect(result.accent).toBe('');
      expect(normalizeCustomize(result)).toEqual(result);
    }
  });
});
