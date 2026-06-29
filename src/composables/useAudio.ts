import { watch } from 'vue';
import { usePlayerStore } from '../stores/player';
import audioEngine from '../core/audio/AudioEngine';
import type { Song } from '../core/sources/types';

let initialized = false;

export function useAudio() {
  const player = usePlayerStore();

  function normalizeText(value?: string): string {
    return (value || '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[()（）\[\]【】\-_.]/g, '');
  }

  function getFallbackCandidates(song: Song): Song[] {
    const title = normalizeText(song.title);
    const artist = normalizeText(song.artist);

    return player.searchResults.filter((item) => {
      if (item.id === song.id && item.sourceId === song.sourceId) return false;
      if (normalizeText(item.title) !== title) return false;
      // 艺术家字段为空时放宽匹配，否则优先同艺人
      return !artist || normalizeText(item.artist).includes(artist) || artist.includes(normalizeText(item.artist));
    });
  }

  async function playSong(song: Song) {
    const url = await player.playSong(song);
    if (url) {
      audioEngine.load(url);
      return;
    }

    const fallbacks = getFallbackCandidates(song);
    for (const candidate of fallbacks) {
      const fallbackUrl = await player.playSong(candidate);
      if (fallbackUrl) {
        audioEngine.load(fallbackUrl);
        return;
      }
    }
  }

  function playFromList(songs: Song[], song: Song) {
    player.searchResults = songs;
    playSong(song);
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

  function seekTo(time: number) {
    const t = Math.max(0, Math.min(time, player.duration || 0));
    audioEngine.seek(t);
  }

  if (!initialized) {
    initialized = true;

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

    watch(() => player.isPlaying, (playing) => {
      if (playing) audioEngine.play();
      else audioEngine.pause();
    });

    watch(
      () => [player.volume, player.muted] as const,
      ([vol, muted]) => {
        audioEngine.setVolume(muted ? 0 : vol);
      },
      { immediate: true },
    );
  }

  return {
    playSong, playFromList, playNext, playPrevious, playRandom, playAtIndex, playAll, seekTo,
  };
}
