import { describe, expect, it } from 'vitest';
import { parseLrc } from './parseLrc';

describe('parseLrc', () => {
  it('解析标准 LRC 并按时间排序', () => {
    const lines = parseLrc(
      '[00:02.50]第二句\n[00:01.00]第一句\n[01:05.25]第三句',
    );
    expect(lines).toEqual([
      { time: 1, text: '第一句' },
      { time: 2.5, text: '第二句' },
      { time: 65.25, text: '第三句' },
    ]);
  });

  it('同一行多个时间戳会展开成多条歌词', () => {
    const lines = parseLrc('[00:01.00][00:03.00]重复副歌');
    expect(lines).toEqual([
      { time: 1, text: '重复副歌' },
      { time: 3, text: '重复副歌' },
    ]);
  });

  it('跳过空歌词、元信息行和非法输入', () => {
    expect(parseLrc('[ar:周杰伦]\n[ti:晴天]\n[00:01.00]   \n无时间戳')).toEqual([]);
    expect(parseLrc('')).toEqual([]);
  });

  it('时间戳保留两位小数', () => {
    expect(parseLrc('[00:01.999]测试')).toEqual([{ time: 1.99, text: '测试' }]);
  });
});
