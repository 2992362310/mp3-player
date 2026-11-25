import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import storage from '../core/storage';

/** 可选的定时时长（分钟） */
const PRESET_MINUTES = [15, 30, 60, 90] as const;

/** 结束前的渐弱时长（秒） */
const FADE_SECONDS = 30;

export const useSleepTimerStore = defineStore('sleepTimer', () => {
  const active = ref(false);
  const remainingSeconds = ref(0);
  const fadeOut = ref(storage.get<boolean>('sleepFadeOut', true));

  let endAt = 0;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let onFinish: (() => void) | null = null;
  let onFadeUpdate: ((volumeScale: number) => void) | null = null;

  const formattedRemaining = computed(() => {
    const s = Math.max(0, remainingSeconds.value);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  });

  const presetOptions = PRESET_MINUTES.map((minutes) => ({
    value: minutes,
    label: `${minutes} 分钟`,
  }));

  /** 由 useAudio 注入：到时暂停播放 */
  function setOnFinish(fn: () => void) {
    onFinish = fn;
  }

  /** 由 useAudio 注入：渐弱时按比例调整音量 */
  function setOnFadeUpdate(fn: (volumeScale: number) => void) {
    onFadeUpdate = fn;
  }

  function start(minutes: number) {
    stop();
    const ms = Math.max(1, minutes) * 60 * 1000;
    endAt = Date.now() + ms;
    remainingSeconds.value = Math.ceil(ms / 1000);
    active.value = true;

    intervalId = setInterval(() => {
      const remain = Math.ceil((endAt - Date.now()) / 1000);
      remainingSeconds.value = Math.max(0, remain);

      if (fadeOut.value && remain > 0 && remain <= FADE_SECONDS) {
        onFadeUpdate?.(remain / FADE_SECONDS);
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
    endAt = 0;
    remainingSeconds.value = 0;
  }

  function setFadeOut(value: boolean) {
    fadeOut.value = value;
    storage.set('sleepFadeOut', value);
  }

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
