<template>
  <div
    class="sticker-layer"
    :class="{ placing: Boolean(pet.placingStickerId) }"
    @click="onLayerClick"
  >
    <div
      v-if="pet.placingStickerId"
      class="sticker-placing-hint"
      role="status"
    >
      <span>点击空白处放置「{{ placingLabel }}」</span>
      <button type="button" class="sticker-placing-cancel" @click.stop="pet.cancelPlacing()">
        取消
      </button>
    </div>

    <div
      v-for="item in pet.stickers"
      :key="item.id"
      class="placed-sticker"
      :class="{ dragging: dragId === item.id }"
      :style="{ left: `${item.x}%`, top: `${item.y}%` }"
      @pointerdown.stop="onStickerPointerDown($event, item.id)"
      @contextmenu.prevent="pet.removeSticker(item.id)"
    >
      <PetSprites kind="sticker" :sticker-id="item.stickerId" :size="36" />
      <button
        type="button"
        class="sticker-remove"
        title="移除贴图"
        aria-label="移除贴图"
        @pointerdown.stop
        @click.stop="pet.removeSticker(item.id)"
      >
        ×
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import PetSprites from './icons/PetSprites.vue';
import { STICKER_OPTIONS, usePetStore } from '../stores/pet';

const pet = usePetStore();
const dragId = ref<string | null>(null);
let dragMoved = false;
let pointerId: number | null = null;

const placingLabel = computed(
  () => STICKER_OPTIONS.find((s) => s.id === pet.placingStickerId)?.label || '贴图',
);

function clientToPercent(clientX: number, clientY: number) {
  const w = window.innerWidth || 1;
  const h = window.innerHeight || 1;
  return {
    x: (clientX / w) * 100,
    y: (clientY / h) * 100,
  };
}

function onLayerClick(e: MouseEvent) {
  if (!pet.placingStickerId) return;
  if ((e.target as HTMLElement).closest('.placed-sticker')) return;
  const pos = clientToPercent(e.clientX, e.clientY);
  pet.placeSticker(pos.x, pos.y);
}

function onStickerPointerDown(e: PointerEvent, id: string) {
  if (e.button !== 0) return;
  if (pet.placingStickerId) return;

  const el = e.currentTarget as HTMLElement;
  el.setPointerCapture(e.pointerId);
  pointerId = e.pointerId;
  dragId.value = id;
  dragMoved = false;

  const onMove = (ev: PointerEvent) => {
    if (pointerId !== ev.pointerId) return;
    dragMoved = true;
    const pos = clientToPercent(ev.clientX, ev.clientY);
    pet.moveSticker(id, pos.x, pos.y);
  };

  const onUp = (ev: PointerEvent) => {
    if (pointerId !== ev.pointerId) return;
    el.releasePointerCapture(ev.pointerId);
    el.removeEventListener('pointermove', onMove);
    el.removeEventListener('pointerup', onUp);
    el.removeEventListener('pointercancel', onUp);
    dragId.value = null;
    pointerId = null;
    // 未拖动时单击不删，避免误触；删除用 × 或右键
    void dragMoved;
  };

  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && pet.placingStickerId) {
    pet.cancelPlacing();
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
.sticker-layer {
  position: fixed;
  inset: 0;
  z-index: 850;
  pointer-events: none;
}

.sticker-layer.placing {
  pointer-events: auto;
  cursor: crosshair;
}

.sticker-placing-hint {
  position: fixed;
  top: calc(56px + env(safe-area-inset-top, 0px));
  left: 50%;
  transform: translateX(-50%);
  z-index: 960;
  padding: 6px 8px 6px 12px;
  border: var(--stroke-soft);
  border-radius: 999px;
  background: color-mix(in srgb, var(--paper-bg) 90%, transparent);
  color: var(--ink-soft);
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 13px;
  white-space: nowrap;
  pointer-events: auto;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.sticker-placing-cancel {
  border: 1px var(--stroke-style-decor, dashed) var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--ink-soft);
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 12px;
  padding: 2px 10px;
  cursor: pointer;
}

.sticker-placing-cancel:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.placed-sticker {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: auto;
  cursor: grab;
  touch-action: none;
  user-select: none;
  padding: 4px;
}

.placed-sticker.dragging {
  cursor: grabbing;
  z-index: 2;
}

.sticker-remove {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  border: 1px var(--stroke-style-decor, dashed) var(--border);
  border-radius: 50%;
  background: color-mix(in srgb, var(--paper-bg) 88%, transparent);
  color: var(--muted);
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.placed-sticker:hover .sticker-remove,
.placed-sticker.dragging .sticker-remove {
  display: inline-flex;
}

.sticker-remove:hover {
  color: var(--accent);
  border-color: var(--accent);
}
</style>
