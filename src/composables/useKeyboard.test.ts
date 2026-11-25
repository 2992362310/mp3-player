import { describe, expect, it } from 'vitest';
import { shouldHandleGlobalKey } from './useKeyboard';

function event(
  init: { defaultPrevented?: boolean; tagName?: string } = {},
): Pick<KeyboardEvent, 'defaultPrevented' | 'target'> {
  return {
    defaultPrevented: init.defaultPrevented ?? false,
    target: init.tagName
      ? ({ tagName: init.tagName } as unknown as EventTarget)
      : null,
  };
}

describe('shouldHandleGlobalKey', () => {
  it('普通区域按键交给全局快捷键', () => {
    expect(shouldHandleGlobalKey(event())).toBe(true);
  });

  it('输入框内的按键不触发全局快捷键', () => {
    for (const tagName of ['INPUT', 'TEXTAREA', 'SELECT']) {
      expect(shouldHandleGlobalKey(event({ tagName }))).toBe(false);
    }
  });

  it('组件已 preventDefault 的按键不再触发全局行为', () => {
    // 复现 SketchSelect 方向键冒泡：菜单已处理，全局不应再调音量
    expect(shouldHandleGlobalKey(event({ defaultPrevented: true }))).toBe(false);
    expect(
      shouldHandleGlobalKey(
        event({ defaultPrevented: true, tagName: 'BUTTON' }),
      ),
    ).toBe(false);
  });

  it('按钮上未被处理的按键仍可触发全局播放/暂停', () => {
    expect(shouldHandleGlobalKey(event({ tagName: 'BUTTON' }))).toBe(true);
  });
});
