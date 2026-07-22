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
  };
});
