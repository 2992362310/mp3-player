<template>
  <div
    v-if="pet.enabled"
    class="desk-pet-layer"
    aria-hidden="false"
  >
    <div
      class="desk-pet"
      :class="{ listening: isPlaying, dragging: isDragging, bubbled: Boolean(bubble) }"
      :style="petStyle"
      @pointerdown="onPointerDown"
    >
      <div v-if="bubble" class="desk-pet-bubble" role="status">{{ bubble }}</div>
      <PetSprites
        kind="pet"
        :pet-id="pet.petId"
        :size="petSize"
        :listening="isPlaying && !reduceMotion"
      />
      <span class="desk-pet-name">{{ petLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { storeToRefs } from 'pinia';
import PetSprites from './icons/PetSprites.vue';
import { PET_OPTIONS, usePetStore } from '../stores/pet';
import { usePlayerStore } from '../stores/player';

const PET_LINES = [
  '今日宜听歌。',
  '摸摸头，继续播。',
  '这句歌词不错。',
  '我在听呢。',
  '休息一下也好。',
  '换一首试试？',
  '墨韵伴你。',
];

const pet = usePetStore();
const player = usePlayerStore();
const { isPlaying } = storeToRefs(player);

const isDragging = ref(false);
const bubble = ref('');
let bubbleTimer: ReturnType<typeof setTimeout> | null = null;
let dragMoved = false;
let pointerId: number | null = null;

const reduceMotion = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const petSize = computed(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 52 : 64));

const petLabel = computed(
  () => PET_OPTIONS.find((p) => p.id === pet.petId)?.label || '桌宠',
);

const petStyle = computed(() => ({
  left: `${pet.petPos.x}%`,
  top: `${pet.petPos.y}%`,
}));

function clearBubbleTimer() {
  if (bubbleTimer) {
    clearTimeout(bubbleTimer);
    bubbleTimer = null;
  }
}

function showBubble(text: string) {
  clearBubbleTimer();
  bubble.value = text;
  bubbleTimer = setTimeout(() => {
    bubble.value = '';
    bubbleTimer = null;
  }, 2200);
}

function clientToPercent(clientX: number, clientY: number) {
  const w = window.innerWidth || 1;
  const h = window.innerHeight || 1;
  return {
    x: (clientX / w) * 100,
    y: (clientY / h) * 100,
  };
}

function onPointerDown(e: PointerEvent) {
  if (e.button !== 0) return;
  const el = e.currentTarget as HTMLElement;
  el.setPointerCapture(e.pointerId);
  pointerId = e.pointerId;
  isDragging.value = true;
  dragMoved = false;

  const onMove = (ev: PointerEvent) => {
    if (pointerId !== ev.pointerId) return;
    dragMoved = true;
    const pos = clientToPercent(ev.clientX, ev.clientY);
    pet.setPetPos(pos);
  };

  const onUp = (ev: PointerEvent) => {
    if (pointerId !== ev.pointerId) return;
    el.releasePointerCapture(ev.pointerId);
    el.removeEventListener('pointermove', onMove);
    el.removeEventListener('pointerup', onUp);
    el.removeEventListener('pointercancel', onUp);
    isDragging.value = false;
    pointerId = null;

    if (!dragMoved) {
      const line = PET_LINES[Math.floor(Math.random() * PET_LINES.length)];
      showBubble(line);
    }
  };

  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);
}

onBeforeUnmount(() => {
  clearBubbleTimer();
});
</script>

<style scoped>
.desk-pet-layer {
  position: fixed;
  inset: 0;
  z-index: 900;
  pointer-events: none;
}

.desk-pet {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: auto;
  cursor: grab;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  user-select: none;
  touch-action: none;
  animation: petIdle 3.2s ease-in-out infinite;
}

.desk-pet.dragging {
  cursor: grabbing;
  animation: none;
  z-index: 2;
}

.desk-pet.listening {
  animation: petBob 1.1s ease-in-out infinite;
}

.desk-pet-name {
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 11px;
  color: var(--faint);
  letter-spacing: 0.08em;
  line-height: 1;
}

.desk-pet-bubble {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 50%;
  transform: translateX(-50%);
  max-width: 140px;
  padding: 6px 10px;
  border: var(--stroke-soft);
  border-radius: var(--ui-radius-sm, 8px);
  background: color-mix(in srgb, var(--paper-bg) 88%, transparent);
  color: var(--ink-soft);
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 13px;
  white-space: nowrap;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  animation: bubbleIn 0.18s ease-out;
}

@keyframes petIdle {
  0%, 100% { transform: translate(-50%, -50%) translateY(0); }
  50% { transform: translate(-50%, -50%) translateY(-3px); }
}

@keyframes petBob {
  0%, 100% { transform: translate(-50%, -50%) translateY(0) rotate(-1deg); }
  50% { transform: translate(-50%, -50%) translateY(-5px) rotate(2deg); }
}

@keyframes bubbleIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .desk-pet,
  .desk-pet.listening {
    animation: none;
  }
}
</style>
