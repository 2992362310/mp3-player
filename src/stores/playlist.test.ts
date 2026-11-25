import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import type { Song } from '../core/sources/types';

const { data } = vi.hoisted(() => ({ data: new Map<string, unknown>() }));

vi.mock('../core/storage', () => ({
  default: {
    get: (key: string, fallback: unknown) => (data.has(key) ? data.get(key) : fallback),
    set: (key: string, value: unknown) => { data.set(key, value); },
    remove: (key: string) => { data.delete(key); },
  },
}));

import { usePlaylistStore } from './playlist';

const song = (id: number, sourceId = 'netease'): Song => ({
  id,
  sourceId,
  title: `歌曲 ${id}`,
  artist: '测试歌手',
});

describe('playlist store', () => {
  beforeEach(() => {
    data.clear();
    setActivePinia(createPinia());
  });

  it('创建歌单时修剪名称并拒绝空名称', () => {
    const store = usePlaylistStore();
    expect(store.createPlaylist('   ')).toBeNull();
    expect(store.createPlaylist('  我的歌单  ')?.name).toBe('我的歌单');
    expect(store.playlistCount).toBe(1);
  });

  it('同一首歌只加入歌单一次', () => {
    const store = usePlaylistStore();
    const playlist = store.createPlaylist('列表')!;
    expect(store.addSongToPlaylist(playlist.id, song(1))).toBe(true);
    expect(store.addSongToPlaylist(playlist.id, song(1))).toBe(false);
    expect(playlist.songs).toHaveLength(1);
  });

  it('导入备份时同名歌单合并去重，并原样返回收藏', () => {
    const store = usePlaylistStore();
    const playlist = store.createPlaylist('列表')!;
    store.addSongToPlaylist(playlist.id, song(1));

    const backup = JSON.stringify({
      app: 'moyun',
      version: 1,
      playlists: [
        { name: '列表', songs: [song(1), song(2)] },
        { name: '新歌单', songs: [song(3)] },
      ],
      favorites: [song(9)],
    });

    const result = store.importData(backup);
    expect(result).toMatchObject({ playlistsAdded: 1, songsAdded: 2 });
    expect(result.favorites.map((s) => s.id)).toEqual([9]);
    expect(store.playlists.find((p) => p.id === playlist.id)?.songs.map((s) => s.id)).toEqual([1, 2]);
  });

  it('拒绝格式错误或非墨韵的备份', () => {
    const store = usePlaylistStore();
    expect(() => store.importData('{')).toThrow('文件格式不正确');
    expect(() => store.importData('{"app":"other"}')).toThrow('不是墨韵导出的数据文件');
  });
});
