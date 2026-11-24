import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Song } from '../core/sources/types';
import { serializeSong, songKey } from '../core/song';
import storage from '../core/storage';

export interface UserPlaylist {
  id: string;
  name: string;
  songs: Song[];
  createdAt: number;
  updatedAt: number;
}

function createId(): string {
  return `pl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function safeGetPlaylists(): UserPlaylist[] {
  const val = storage.get<UserPlaylist[]>('userPlaylists', []);
  if (!Array.isArray(val)) return [];
  return val
    .filter((p) => p && typeof p.id === 'string' && typeof p.name === 'string')
    .map((p) => ({
      id: p.id,
      name: p.name,
      songs: Array.isArray(p.songs) ? p.songs : [],
      createdAt: p.createdAt || Date.now(),
      updatedAt: p.updatedAt || Date.now(),
    }));
}

export const usePlaylistStore = defineStore('playlist', () => {
  const playlists = ref<UserPlaylist[]>(safeGetPlaylists());
  const activePlaylistId = ref<string | null>(null);
  const addSongTarget = ref<Song | null>(null);

  const activePlaylist = computed(
    () => playlists.value.find((p) => p.id === activePlaylistId.value) || null,
  );

  const playlistCount = computed(() => playlists.value.length);

  function persist() {
    storage.set('userPlaylists', playlists.value);
  }

  function createPlaylist(name: string): UserPlaylist | null {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const now = Date.now();
    const playlist: UserPlaylist = {
      id: createId(),
      name: trimmed.slice(0, 40),
      songs: [],
      createdAt: now,
      updatedAt: now,
    };
    playlists.value.unshift(playlist);
    persist();
    return playlist;
  }

  function renamePlaylist(id: string, name: string) {
    const trimmed = name.trim().slice(0, 40);
    if (!trimmed) return;
    const target = playlists.value.find((p) => p.id === id);
    if (!target) return;
    target.name = trimmed;
    target.updatedAt = Date.now();
    persist();
  }

  function deletePlaylist(id: string) {
    playlists.value = playlists.value.filter((p) => p.id !== id);
    if (activePlaylistId.value === id) activePlaylistId.value = null;
    persist();
  }

  function openPlaylist(id: string | null) {
    activePlaylistId.value = id;
  }

  function addSongToPlaylist(playlistId: string, song: Song): boolean {
    const target = playlists.value.find((p) => p.id === playlistId);
    if (!target) return false;
    const key = songKey(song);
    if (target.songs.some((s) => songKey(s) === key)) return false;
    target.songs.push(serializeSong(song));
    target.updatedAt = Date.now();
    persist();
    return true;
  }

  function removeSongFromPlaylist(playlistId: string, song: Song) {
    const target = playlists.value.find((p) => p.id === playlistId);
    if (!target) return;
    const key = songKey(song);
    target.songs = target.songs.filter((s) => songKey(s) !== key);
    target.updatedAt = Date.now();
    persist();
  }

  function openAddToPlaylist(song: Song) {
    addSongTarget.value = serializeSong(song);
  }

  function closeAddToPlaylist() {
    addSongTarget.value = null;
  }

  /** 导出所有歌单 + 收藏为 JSON */
  function exportData(favorites: Song[]): string {
    return JSON.stringify({
      app: 'moyun',
      version: 1,
      exportedAt: new Date().toISOString(),
      playlists: playlists.value,
      favorites,
    }, null, 2);
  }

  /** 导入 JSON 备份（合并模式，不覆盖已有） */
  function importData(json: string): { playlistsAdded: number; songsAdded: number; favoritesAdded: number } {
    let parsed: any;
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error('文件格式不正确，请选择墨韵导出的 JSON 文件');
    }

    if (parsed?.app !== 'moyun') {
      throw new Error('不是墨韵导出的数据文件');
    }

    let playlistsAdded = 0;
    let songsAdded = 0;

    if (Array.isArray(parsed.playlists)) {
      for (const imported of parsed.playlists) {
        if (!imported?.name || !Array.isArray(imported.songs)) continue;
        const existing = playlists.value.find((p) => p.name === imported.name);
        if (existing) {
          // 合并歌曲（去重）
          for (const song of imported.songs) {
            const key = songKey(song);
            if (!existing.songs.some((s) => songKey(s) === key)) {
              existing.songs.push(serializeSong(song));
              songsAdded++;
            }
          }
          existing.updatedAt = Date.now();
        } else {
          playlists.value.push({
            id: createId(),
            name: String(imported.name).slice(0, 40),
            songs: imported.songs.map((s: Song) => serializeSong(s)),
            createdAt: imported.createdAt || Date.now(),
            updatedAt: Date.now(),
          });
          playlistsAdded++;
          songsAdded += imported.songs.length;
        }
      }
    }

    persist();
    return { playlistsAdded, songsAdded, favoritesAdded: 0 };
  }

  return {
    playlists,
    activePlaylistId,
    activePlaylist,
    playlistCount,
    addSongTarget,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    openPlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    openAddToPlaylist,
    closeAddToPlaylist,
    exportData,
    importData,
  };
});
