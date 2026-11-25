import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { usePlayerStore } from './player';
import { useAudio } from '../composables/useAudio';
import {
  canUseDocumentPip,
  closeDesktopLyrics,
  createLyricsChannel,
  getDesktopLyricsMode,
  onDesktopLyricsClose,
  openDesktopLyrics,
  type DesktopLyricsAction,
  type DesktopLyricsState,
  type DesktopLyricsWindowMode,
} from '../core/desktopLyrics';

type LyricsChannel = ReturnType<typeof createLyricsChannel>;

export const useDesktopLyricsStore = defineStore('desktopLyrics', () => {
  const player = usePlayerStore();
  const { playNext, playPrevious, seekTo } = useAudio();

  const mode = ref<DesktopLyricsWindowMode>(getDesktopLyricsMode());
  const isOpen = computed(() => mode.value !== null);
  const canUsePip = computed(() => canUseDocumentPip());

  let channel: LyricsChannel | null = null;
  let themeObserver: MutationObserver | null = null;

  function themeSnapshot() {
    const style = getComputedStyle(document.documentElement);
    const read = (name: string, fallback: string) =>
      style.getPropertyValue(name).trim() || fallback;
    return {
      accent: read('--accent', '#5b57d1'),
      paper: read('--paper-bg', '#faf7f0'),
      ink: read('--ink', '#2d2d2d'),
      displayFont: read('--ui-display', 'Georgia, "Noto Serif SC", serif'),
    };
  }

  function snapshot(): DesktopLyricsState {
    return {
      title: player.currentSong?.title ?? '',
      artist: player.currentSong?.artist ?? '',
      lines: (player.lyric?.lines ?? []).map((line) => ({
        time: line.time,
        text: line.text,
        translation: line.translation,
      })),
      currentIndex: player.currentLyricIndex,
      playing: player.isPlaying,
      ...themeSnapshot(),
    };
  }

  function push() {
    if (channel) channel.post(snapshot());
  }

  function handleAction(action: DesktopLyricsAction) {
    switch (action.type) {
      case 'playpause':
        player.togglePlay();
        break;
      case 'prev':
        playPrevious();
        break;
      case 'next':
        playNext();
        break;
      case 'close':
        close();
        break;
      case 'seek': {
        const line = player.lyric?.lines?.[action.index];
        if (line) seekTo(line.time);
        break;
      }
    }
  }

  function teardown() {
    channel?.close();
    channel = null;
    themeObserver?.disconnect();
    themeObserver = null;
  }

  function close() {
    closeDesktopLyrics();
    teardown();
    mode.value = null;
  }

  async function toggle() {
    if (isOpen.value) {
      close();
      return;
    }

    const opened = await openDesktopLyrics();
    if (!opened) return; // 弹窗被浏览器拦截，保持按钮未激活

    mode.value = opened;
    channel = createLyricsChannel(handleAction, () => push());
    push();

    // 主题切换后同步窗口配色
    themeObserver = new MutationObserver(() => push());
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-ui-style'],
    });
  }

  onDesktopLyricsClose(() => {
    teardown();
    mode.value = null;
  });

  watch(
    () => [
      player.currentSong?.title,
      player.currentSong?.artist,
      player.lyric?.lines,
      player.currentLyricIndex,
      player.isPlaying,
    ],
    () => push(),
  );

  return { mode, isOpen, canUsePip, toggle, close };
});
