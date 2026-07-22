<template>
  <div
    v-if="playlist.addSongTarget"
    class="modal-backdrop"
    @click.self="playlist.closeAddToPlaylist()"
  >
    <section class="modal-card modal-enter" role="dialog" aria-label="加入歌单">
      <header class="modal-header">
        <h3>加入歌单</h3>
        <button type="button" class="modal-close" @click="playlist.closeAddToPlaylist()">×</button>
      </header>

      <p class="modal-song">
        {{ playlist.addSongTarget.title }}
        <span>· {{ playlist.addSongTarget.artist }}</span>
      </p>

      <div class="modal-body">
        <button
          v-for="item in playlist.playlists"
          :key="item.id"
          type="button"
          class="playlist-pick"
          @click="addTo(item.id)"
        >
          <span>{{ item.name }}</span>
          <span class="muted">{{ item.songs.length }} 首</span>
        </button>

        <p v-if="playlist.playlists.length === 0" class="empty-hint">还没有歌单，先新建一个吧。</p>
      </div>

      <footer class="modal-footer">
        <input
          v-model="newName"
          type="text"
          maxlength="40"
          placeholder="新建歌单名称"
          @keyup.enter="createAndAdd"
        />
        <button type="button" class="btn-action btn-action-primary" @click="createAndAdd">
          新建并加入
        </button>
      </footer>

      <p v-if="toast" class="toast">{{ toast }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { usePlaylistStore } from '../stores/playlist';

const playlist = usePlaylistStore();
const newName = ref('');
const toast = ref('');

watch(
  () => playlist.addSongTarget,
  () => {
    newName.value = '';
    toast.value = '';
  },
);

function flash(msg: string) {
  toast.value = msg;
  setTimeout(() => {
    if (toast.value === msg) toast.value = '';
  }, 1600);
}

function addTo(id: string) {
  const song = playlist.addSongTarget;
  if (!song) return;
  const ok = playlist.addSongToPlaylist(id, song);
  flash(ok ? '已加入歌单' : '歌单里已有这首');
  if (ok) setTimeout(() => playlist.closeAddToPlaylist(), 500);
}

function createAndAdd() {
  const song = playlist.addSongTarget;
  if (!song) return;
  const created = playlist.createPlaylist(newName.value || '我的歌单');
  if (!created) return;
  playlist.addSongToPlaylist(created.id, song);
  flash('已新建并加入');
  setTimeout(() => playlist.closeAddToPlaylist(), 500);
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2100;
  background: rgba(25, 25, 25, 0.42);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-card {
  width: min(92vw, 420px);
  background: var(--paper-bg);
  border: 2px dashed var(--border);
  border-radius: 12px;
  padding: 16px;
  color: var(--ink);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.modal-header h3 {
  margin: 0;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 22px;
}

.modal-close {
  border: none;
  background: none;
  font-size: 22px;
  cursor: pointer;
  color: #666;
  line-height: 1;
}

.modal-song {
  margin: 0 0 12px;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 15px;
  color: #444;
}

.modal-song span {
  color: #888;
  font-size: 13px;
}

.modal-body {
  display: grid;
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
  margin-bottom: 12px;
}

.playlist-pick {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 10px 12px;
  border: 1px dashed var(--border);
  border-radius: 8px;
  background: var(--surface);
  cursor: pointer;
  font-family: 'Ma Shan Zheng', cursive;
  color: var(--ink);
  font-size: 16px;
}

.playlist-pick:hover {
  background: var(--hover);
}

.muted {
  color: var(--faint);
  font-size: 13px;
}

.empty-hint {
  margin: 8px 0;
  color: var(--muted);
  font-family: 'Ma Shan Zheng', cursive;
  text-align: center;
}

.modal-footer {
  display: flex;
  gap: 8px;
}

.modal-footer input {
  flex: 1;
  min-width: 0;
  padding: 8px 10px;
  border: 2px solid var(--border);
  border-radius: 8px;
  background: transparent;
  font-family: 'Ma Shan Zheng', cursive;
  color: var(--ink);
}

.toast {
  margin: 10px 0 0;
  color: var(--accent-green);
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 14px;
  text-align: center;
}
</style>
