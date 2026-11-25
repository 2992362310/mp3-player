import { describe, expect, it } from 'vitest';
import { isSameSong, serializeSong, songKey } from './song';
import type { Song } from './sources/types';

const makeSong = (overrides: Partial<Song> = {}): Song => ({
  id: 42,
  sourceId: 'netease',
  title: '晴天',
  artist: '周杰伦',
  ...overrides,
});

describe('song helpers', () => {
  it('songKey 由音源与 ID 组成，不同音源的同 ID 不冲突', () => {
    expect(songKey(makeSong())).toBe('netease-42');
    expect(songKey(makeSong({ sourceId: 'kuwo' }))).toBe('kuwo-42');
  });

  it('isSameSong 只比较音源与 ID，忽略标题等变化字段', () => {
    expect(isSameSong(makeSong(), makeSong({ title: '晴天 (Live)' }))).toBe(true);
    expect(isSameSong(makeSong(), makeSong({ sourceId: 'kuwo' }))).toBe(false);
    expect(isSameSong(null, makeSong())).toBe(false);
    expect(isSameSong(makeSong(), undefined)).toBe(false);
  });

  it('serializeSong 保留播放所需字段且不丢 raw', () => {
    const song = makeSong({ raw: { mimeType: 'audio/mpeg' }, album: '叶惠美' });
    const serialized = serializeSong(song);
    expect(serialized).toMatchObject({
      id: 42,
      sourceId: 'netease',
      album: '叶惠美',
      raw: { mimeType: 'audio/mpeg' },
    });
  });
});
