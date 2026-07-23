/**
 * 屏幕常亮（Screen Wake Lock）
 * 主要用于移动端听歌时防止自动息屏
 */

import { onMounted, onUnmounted, watch, type Ref } from 'vue';

type WakeLockSentinelLike = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: 'release', listener: () => void) => void;
};

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockSentinelLike>;
  };
};

function canWakeLock(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

export function useWakeLock(enabled: Ref<boolean>) {
  let sentinel: WakeLockSentinelLike | null = null;
  let requesting = false;

  async function requestLock() {
    if (!enabled.value || !canWakeLock() || requesting) return;
    if (sentinel && !sentinel.released) return;
    if (document.visibilityState !== 'visible') return;

    const nav = navigator as WakeLockNavigator;
    if (!nav.wakeLock) return;

    requesting = true;
    try {
      sentinel = await nav.wakeLock.request('screen');
      sentinel.addEventListener('release', () => {
        sentinel = null;
      });
    } catch (e) {
      console.warn('[WakeLock] 无法保持屏幕常亮:', e);
      sentinel = null;
    } finally {
      requesting = false;
    }
  }

  async function releaseLock() {
    if (!sentinel) return;
    try {
      await sentinel.release();
    } catch {
      // ignore
    } finally {
      sentinel = null;
    }
  }

  async function sync() {
    if (enabled.value) await requestLock();
    else await releaseLock();
  }

  function onVisibility() {
    if (document.visibilityState === 'visible' && enabled.value) {
      void requestLock();
    }
  }

  onMounted(() => {
    void sync();
    document.addEventListener('visibilitychange', onVisibility);
  });

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', onVisibility);
    void releaseLock();
  });

  watch(enabled, () => {
    void sync();
  });

  return {
    supported: canWakeLock(),
    requestLock,
    releaseLock,
  };
}
