import { watch } from 'vue';
import { usePlayerStore } from '../stores/player';
import audioEngine from '../core/audio/AudioEngine';
import type { Song } from '../core/sources/types';

let initialized = false;

export function useAudio() {
  const player = usePlayerStore();

  async function playSong(song: Song) {
    const url = await player.playSong(song);
    if (url) audioEngine.load(url);
  }

  function playNext() {
    const list = player.searchResults;
    if (list.length === 0) return;
    if (player.playMode === 'random') { playRandom(); return; }
    let idx: number;
    if (player.currentIndex < list.length - 1) idx = player.currentIndex + 1;
    else if (player.playMode === 'loop') idx = 0;
    else return;
    playSong(list[idx]);
  }

  function playPrevious() {
    const list = player.searchResults;
    if (list.length === 0) return;
    if (player.playMode === 'random') { playRandom(); return; }
    let idx: number;
    if (player.currentIndex > 0) idx = player.currentIndex - 1;
    else if (player.playMode === 'loop') idx = list.length - 1;
    else return;
    playSong(list[idx]);
  }

  function playRandom() {
    const list = player.searchResults;
    if (list.length === 0) return;
    let idx: number;
    do { idx = Math.floor(Math.random() * list.length); }
    while (idx === player.currentIndex && list.length > 1);
    playSong(list[idx]);
  }

  function playAtIndex(index: number) {
    const list = player.searchResults;
    if (index < 0 || index >= list.length) return;
    playSong(list[index]);
  }

  function playAll(songs: Song[]) {
    if (songs.length === 0) return;
    player.searchResults = songs;
    playSong(songs[0]);
  }

  if (!initialized) {
    initialized = true;

    // audioEngine 回调 → 更新 player store
    audioEngine.setCallbacks({
      onPlay: () => { player.isPlaying = true; },
      onPause: () => { player.isPlaying = false; },
      onEnd: () => {
        player.isPlaying = false;
        if (player.playMode === 'single') {
          audioEngine.seek(0);
          audioEngine.play();
        } else {
          playNext();
        }
      },
      onTimeUpdate: (ct, dur) => player.updateTime(ct, dur),
      onError: (msg) => { player.error = msg; player.isPlaying = false; },
    });

    // player store 变化 → 控制 audioEngine
    watch(() => player.isPlaying, (playing) => {
      if (playing) audioEngine.play();
      else audioEngine.pause();
    });

    watch(() => [player.volume, player.muted], ([vol, muted]) => {
      audioEngine.setVolume(muted ? 0 : (vol as number));
    });

    // 用户拖动进度条 → seek
    let seekLock = false;
    watch(() => player.currentTime, (time) => {
      if (seekLock) return;
      // 仅当差距大于 1s 时视为用户 seek
      // （正常播放时 time 变化是连续的，不会跳变）
    });
  }

  return { playSong, playNext, playPrevious, playRandom, playAtIndex, playAll };
}
