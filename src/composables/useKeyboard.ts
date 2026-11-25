/**
 * 全局快捷键 Composable
 */

import { onMounted, onUnmounted } from 'vue';
import { usePlayerStore } from '../stores/player';
import { useUIStore } from '../stores/ui';
import { useAudio } from './useAudio';

/**
 * 判断一个键盘事件是否应交由全局快捷键处理。
 * - 输入框内的按键交给输入框自己
 * - 已被组件 preventDefault 的按键（如下拉菜单的方向键）不再触发全局行为，
 *   否则切换音源/筛选时会连带改变音量或关闭歌词面板
 */
export function shouldHandleGlobalKey(
  e: Pick<KeyboardEvent, 'defaultPrevented' | 'target'>,
): boolean {
  if (e.defaultPrevented) return false;
  const tag = (e.target as HTMLElement | null)?.tagName;
  return tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT';
}

export function useKeyboard() {
  const player = usePlayerStore();
  const ui = useUIStore();
  const { playNext, playPrevious, seekTo } = useAudio();

  function handleKeydown(e: KeyboardEvent) {
    if (!shouldHandleGlobalKey(e)) return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        player.togglePlay();
        break;
      case 'ArrowRight':
        if (e.shiftKey) playNext();
        else seekTo(player.currentTime + 5);
        break;
      case 'ArrowLeft':
        if (e.shiftKey) playPrevious();
        else seekTo(player.currentTime - 5);
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
        ui.toggleLyricPanel();
        break;
      case 'Escape':
        if (ui.showLyricPanel) {
          ui.closeLyricPanel();
        }
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
