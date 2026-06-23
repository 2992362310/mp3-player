/**
 * 全局快捷键 Composable
 */

import { onMounted, onUnmounted } from 'vue';
import { usePlayerStore } from '../stores/player';
import { useAudio } from './useAudio';

export function useKeyboard() {
  const player = usePlayerStore();
  const { playNext, playPrevious } = useAudio();

  function handleKeydown(e: KeyboardEvent) {
    // 忽略输入框中的按键
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        player.togglePlay();
        break;
      case 'ArrowRight':
        if (e.shiftKey) playNext();
        else player.seekTo(player.currentTime + 5);
        break;
      case 'ArrowLeft':
        if (e.shiftKey) playPrevious();
        else player.seekTo(player.currentTime - 5);
        break;
      case 'ArrowUp':
        e.preventDefault();
        player.setVolume(player.volume + 0.05);
        break;
      case 'ArrowDown':
        e.preventDefault();
        player.setVolume(player.volume - 0.05);
        break;
      case 'KeyM':
        player.toggleMute();
        break;
      case 'KeyL':
        // 由外部组件监听切换歌词面板
        break;
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
  });
}
