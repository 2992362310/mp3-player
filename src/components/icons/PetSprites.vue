<template>
  <svg
    v-if="kind === 'pet'"
    class="pet-sprite"
    :class="[`pet-${petId}`, { listening }]"
    :width="size"
    :height="size"
    viewBox="0 0 64 64"
    fill="none"
    aria-hidden="true"
  >
    <!-- 墨鸦 -->
    <g v-if="petId === 'crow'">
      <ellipse class="body" cx="32" cy="38" rx="16" ry="13" />
      <path class="wing" d="M18 36 Q10 30 14 24 Q22 28 24 34 Z" />
      <circle class="head" cx="44" cy="26" r="10" />
      <path class="beak" d="M52 26 L60 28 L52 30 Z" />
      <circle class="eye" cx="47" cy="24" r="1.6" />
      <path class="tail" d="M18 42 Q8 48 10 54 Q18 50 22 46" />
      <path class="leg" d="M28 50 L26 58 M36 50 L38 58" />
    </g>

    <!-- 蓝喵 -->
    <g v-else-if="petId === 'cat'">
      <path class="ear" d="M18 22 L22 10 L28 22 Z" />
      <path class="ear" d="M36 22 L42 10 L46 22 Z" />
      <ellipse class="body" cx="32" cy="40" rx="15" ry="12" />
      <circle class="head" cx="32" cy="24" r="12" />
      <circle class="eye" cx="27" cy="23" r="1.8" />
      <circle class="eye" cx="37" cy="23" r="1.8" />
      <path class="nose" d="M30 28 Q32 30 34 28" />
      <path class="whisker" d="M18 26 H12 M18 30 H11 M46 26 H52 M46 30 H53" />
      <path class="tail" d="M46 42 Q58 36 56 50 Q50 46 46 46" />
      <path class="leg" d="M24 50 L22 58 M40 50 L42 58" />
    </g>

    <!-- 墨点 -->
    <g v-else>
      <path
        class="blob"
        d="M20 34 Q16 20 28 16 Q40 12 48 24 Q56 36 44 48 Q30 56 20 46 Q14 40 20 34 Z"
      />
      <circle class="eye" cx="28" cy="30" r="2" />
      <circle class="eye" cx="40" cy="30" r="2" />
      <path class="mouth" d="M30 38 Q34 42 38 38" />
      <circle class="spark" cx="48" cy="18" r="2.5" />
    </g>
  </svg>

  <svg
    v-else
    class="sticker-sprite"
    :class="`sticker-${stickerId}`"
    :width="size"
    :height="size"
    viewBox="0 0 48 48"
    fill="none"
    aria-hidden="true"
  >
    <g v-if="stickerId === 'note'">
      <path class="s-line" d="M18 34 V14 L34 10 V30" />
      <ellipse class="s-fill" cx="14" cy="34" rx="6" ry="4.5" transform="rotate(-18 14 34)" />
      <ellipse class="s-fill" cx="30" cy="30" rx="6" ry="4.5" transform="rotate(-18 30 30)" />
    </g>
    <g v-else-if="stickerId === 'ink'">
      <path
        class="s-fill"
        d="M24 8 Q34 18 32 28 Q30 38 24 40 Q18 38 16 28 Q14 18 24 8 Z"
      />
      <circle class="s-dot" cx="34" cy="14" r="2.5" />
      <circle class="s-dot" cx="12" cy="22" r="1.8" />
    </g>
    <g v-else-if="stickerId === 'star'">
      <path
        class="s-fill"
        d="M24 6 L28 18 L40 18 L30 26 L34 38 L24 30 L14 38 L18 26 L8 18 L20 18 Z"
      />
    </g>
    <g v-else-if="stickerId === 'leaf'">
      <path class="s-fill" d="M12 36 Q24 8 40 12 Q36 28 20 40 Z" />
      <path class="s-line" d="M16 34 Q26 22 36 14" />
    </g>
    <g v-else-if="stickerId === 'wave'">
      <path class="s-line" d="M6 20 Q14 12 22 20 T38 20" />
      <path class="s-line" d="M6 28 Q14 20 22 28 T38 28" />
      <path class="s-line" d="M6 36 Q14 28 22 36 T38 36" />
    </g>
    <g v-else>
      <path
        class="s-fill"
        d="M24 40 S8 28 10 18 Q12 10 20 12 Q24 6 28 12 Q36 10 38 18 Q40 28 24 40 Z"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import type { PetId, StickerId } from '../../stores/pet';

withDefaults(
  defineProps<{
    kind: 'pet' | 'sticker';
    petId?: PetId;
    stickerId?: StickerId;
    size?: number;
    listening?: boolean;
  }>(),
  {
    petId: 'crow',
    stickerId: 'note',
    size: 56,
    listening: false,
  },
);
</script>

<style scoped>
.pet-sprite,
.sticker-sprite {
  display: block;
  overflow: visible;
}

.pet-sprite .body,
.pet-sprite .head,
.pet-sprite .wing,
.pet-sprite .tail,
.pet-sprite .blob {
  fill: color-mix(in srgb, var(--ink) 78%, var(--accent) 22%);
  stroke: var(--ink);
  stroke-width: 1.6;
  stroke-linejoin: round;
}

.pet-crow .body,
.pet-crow .head,
.pet-crow .wing,
.pet-crow .tail {
  fill: color-mix(in srgb, var(--ink) 88%, var(--accent) 12%);
}

.pet-cat .body,
.pet-cat .head,
.pet-cat .ear,
.pet-cat .tail {
  fill: color-mix(in srgb, var(--accent) 55%, white 45%);
  stroke: var(--ink-soft);
}

.pet-blob .blob {
  fill: color-mix(in srgb, var(--accent) 35%, var(--ink) 65%);
}

.pet-sprite .beak,
.pet-sprite .nose {
  fill: var(--accent);
  stroke: var(--ink);
  stroke-width: 1.2;
}

.pet-sprite .eye {
  fill: var(--paper-bg);
  stroke: var(--ink);
  stroke-width: 1.2;
}

.pet-sprite .leg,
.pet-sprite .whisker,
.pet-sprite .mouth {
  stroke: var(--ink);
  stroke-width: 1.5;
  stroke-linecap: round;
  fill: none;
}

.pet-sprite .spark {
  fill: var(--accent);
  stroke: none;
}

.pet-sprite.listening .wing,
.pet-sprite.listening .tail,
.pet-sprite.listening .ear {
  transform-origin: center;
  animation: petListen 0.7s ease-in-out infinite;
}

.sticker-sprite .s-fill {
  fill: color-mix(in srgb, var(--accent) 42%, var(--ink) 58%);
  stroke: var(--ink);
  stroke-width: 1.4;
  stroke-linejoin: round;
}

.sticker-sprite .s-line {
  stroke: var(--ink-soft);
  stroke-width: 1.8;
  stroke-linecap: round;
  fill: none;
}

.sticker-sprite .s-dot {
  fill: var(--accent);
}

.sticker-note .s-fill {
  fill: var(--accent);
}

.sticker-heart .s-fill {
  fill: color-mix(in srgb, var(--accent) 70%, white 30%);
}

.sticker-star .s-fill {
  fill: color-mix(in srgb, var(--accent) 55%, #f5e6a0 45%);
}

@keyframes petListen {
  0%, 100% { transform: rotate(-4deg); }
  50% { transform: rotate(5deg); }
}

@media (prefers-reduced-motion: reduce) {
  .pet-sprite.listening .wing,
  .pet-sprite.listening .tail,
  .pet-sprite.listening .ear {
    animation: none;
  }
}
</style>
