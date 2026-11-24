import { defineStore } from 'pinia';
import { ref, computed, onBeforeUnmount } from 'vue';
import storage from '../core/storage';

export type SleepPreset = 15 | 30 | 60 | 90;

const PRESET_LABELS: Record<number, string> = {
  15: '15 分钟',
  30: '30 分钟',
  60: '60 分钟',
  90: '90 分钟',
};

const FADE_SECONDS = 30;

export const useSleepTimerStore = defineStore('sleepTimer', () => {
  const active = ref(false);
  const endAt = ref(0);
  const remainingSeconds = ref(0);
  const fadeOut = ref(storage.get<boolean>('sleepFadeOut', true));

  let intervalId: ReturnType<typeof setInterval> | null = null;
  let onFinish: (() => void) | null = null;
  let onFadeUpdate: ((volumeScale: number) => void) | null = null;
  let originalVolume: number | null = null;

  const formattedRemaining = computed(() => {
    const s = Math.max(0, remainingSeconds.value);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  });

  const presetOptions = [
    { value: 15, label: PRESET_LABELS[15] },
    { value: 30, label: PRESET_LABELS[30] },
    { value: 60, label: PRESET_LABELS[60] },
    { value: 90, label: PRESET_LABELS[90] },
  ];

  function setOnFinish(fn: () => void) {
    onFinish = fn;
  }

  function setOnFadeUpdate(fn: (volumeScale: number) => void) {
    onFadeUpdate = fn;
  }

  function start(minutes: number) {
    stop();
    const ms = Math.max(1, minutes) * 60 * 1000;
    endAt.value = Date.now() + ms;
    remainingSeconds.value = Math.ceil(ms / 1000);
    active.value = true;
    originalVolume = null;

    intervalId = setInterval(() => {
      const remain = Math.ceil((endAt.value - Date.now()) / 1000);
      remainingSeconds.value = Math.max(0, remain);

      // 渐弱：最后 FADE_SECONDS 秒线性降低音量
      if (fadeOut.value && remain <= FADE_SECONDS && remain > 0) {
        const scale = remain / FADE_SECONDS;
        if (originalVolume === null) {
          // 在渐弱开始时记录当前音量比例（由外部传入实际值）
          onFadeUpdate?.(scale);
        } else {
          onFadeUpdate?.(scale);
        }
      }

      if (remain <= 0) {
        stop();
        onFinish?.();
      }
    }, 1000);
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    active.value = false;
    endAt.value = 0;
    remainingSeconds.value = 0;
    originalVolume = null;
  }

  function setFadeOut(v: boolean) {
    fadeOut.value = v;
    storage.set('sleepFadeOut', v);
  }

  onBeforeUnmount(() => stop());

  return {
    active,
    remainingSeconds,
    formattedRemaining,
    fadeOut,
    presetOptions,
    start,
    stop,
    setOnFinish,
    setOnFadeUpdate,
    setFadeOut,
  };
});
