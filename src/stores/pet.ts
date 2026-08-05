/**
 * 桌宠与贴图状态
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import storage from '../core/storage';

export type PetId = 'crow' | 'cat' | 'blob';

export type StickerId =
  | 'note'
  | 'ink'
  | 'star'
  | 'leaf'
  | 'wave'
  | 'heart';

export interface PetPos {
  x: number;
  y: number;
}

export interface PlacedSticker {
  id: string;
  stickerId: StickerId;
  x: number;
  y: number;
}

export const PET_OPTIONS: Array<{ id: PetId; label: string }> = [
  { id: 'crow', label: '墨鸦' },
  { id: 'cat', label: '蓝喵' },
  { id: 'blob', label: '墨点' },
];

export const STICKER_OPTIONS: Array<{ id: StickerId; label: string }> = [
  { id: 'note', label: '音符' },
  { id: 'ink', label: '墨点' },
  { id: 'star', label: '星星' },
  { id: 'leaf', label: '叶片' },
  { id: 'wave', label: '波纹' },
  { id: 'heart', label: '小心' },
];

const PET_IDS: PetId[] = ['crow', 'cat', 'blob'];
const STICKER_IDS: StickerId[] = ['note', 'ink', 'star', 'leaf', 'wave', 'heart'];
const STICKER_LIMIT = 24;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalizePetId(value: unknown): PetId {
  return PET_IDS.includes(value as PetId) ? (value as PetId) : 'crow';
}

function normalizePos(raw: Partial<PetPos> | null | undefined, fallback: PetPos): PetPos {
  const x = typeof raw?.x === 'number' ? raw.x : fallback.x;
  const y = typeof raw?.y === 'number' ? raw.y : fallback.y;
  return {
    x: clamp(x, 4, 96),
    y: clamp(y, 8, 88),
  };
}

function normalizeStickers(raw: unknown): PlacedSticker[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is PlacedSticker => {
      if (!item || typeof item !== 'object') return false;
      const s = item as PlacedSticker;
      return (
        typeof s.id === 'string'
        && STICKER_IDS.includes(s.stickerId)
        && typeof s.x === 'number'
        && typeof s.y === 'number'
      );
    })
    .slice(0, STICKER_LIMIT)
    .map((s) => ({
      id: s.id,
      stickerId: s.stickerId,
      x: clamp(s.x, 2, 98),
      y: clamp(s.y, 4, 92),
    }));
}

function uid() {
  return `st_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export const usePetStore = defineStore('pet', () => {
  const enabled = ref(storage.get<boolean>('petEnabled', true));
  const petId = ref<PetId>(normalizePetId(storage.get<string>('petId', 'crow')));
  const petPos = ref<PetPos>(
    normalizePos(storage.get<PetPos | null>('petPos', null), { x: 88, y: 78 }),
  );
  const stickers = ref<PlacedSticker[]>(
    normalizeStickers(storage.get<PlacedSticker[]>('petStickers', [])),
  );
  const placingStickerId = ref<StickerId | null>(null);

  function persist() {
    storage.set('petEnabled', enabled.value);
    storage.set('petId', petId.value);
    storage.set('petPos', petPos.value);
    storage.set('petStickers', stickers.value);
  }

  function setEnabled(next: boolean) {
    enabled.value = next;
    persist();
  }

  function setPetId(id: PetId) {
    petId.value = normalizePetId(id);
    persist();
  }

  function setPetPos(pos: PetPos) {
    petPos.value = normalizePos(pos, petPos.value);
    persist();
  }

  function startPlacing(stickerId: StickerId) {
    placingStickerId.value = STICKER_IDS.includes(stickerId) ? stickerId : null;
  }

  function cancelPlacing() {
    placingStickerId.value = null;
  }

  function placeSticker(x: number, y: number) {
    if (!placingStickerId.value) return;
    if (stickers.value.length >= STICKER_LIMIT) {
      placingStickerId.value = null;
      return;
    }
    stickers.value = [
      ...stickers.value,
      {
        id: uid(),
        stickerId: placingStickerId.value,
        x: clamp(x, 2, 98),
        y: clamp(y, 4, 92),
      },
    ];
    placingStickerId.value = null;
    persist();
  }

  function moveSticker(id: string, x: number, y: number) {
    const idx = stickers.value.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const next = stickers.value.slice();
    next[idx] = {
      ...next[idx],
      x: clamp(x, 2, 98),
      y: clamp(y, 4, 92),
    };
    stickers.value = next;
    persist();
  }

  function removeSticker(id: string) {
    stickers.value = stickers.value.filter((s) => s.id !== id);
    persist();
  }

  function clearStickers() {
    stickers.value = [];
    placingStickerId.value = null;
    persist();
  }

  return {
    enabled,
    petId,
    petPos,
    stickers,
    placingStickerId,
    setEnabled,
    setPetId,
    setPetPos,
    startPlacing,
    cancelPlacing,
    placeSticker,
    moveSticker,
    removeSticker,
    clearStickers,
  };
});
