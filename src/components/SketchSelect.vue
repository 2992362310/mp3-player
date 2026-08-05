<template>
  <div
    ref="rootEl"
    class="sketch-select"
    :class="[containerClass, isOpen ? 'is-open' : '']"
  >
    <button
      ref="triggerEl"
      type="button"
      :class="['sketch-select__trigger', triggerClass]"
      :disabled="disabled"
      @click="toggleOpen"
      @keydown.down.prevent="openMenu"
      @keydown.up.prevent="openMenu"
      @keydown.enter.prevent="toggleOpen"
      @keydown.esc.prevent="closeMenu"
    >
      <span class="sketch-select__value">{{ selectedLabel }}</span>
      <span class="sketch-select__arrow" aria-hidden="true">
        <svg viewBox="0 0 16 16" focusable="false" aria-hidden="true">
          <path d="M3.5 6.25L8 10.75L12.5 6.25" />
        </svg>
      </span>
    </button>

    <Teleport to="body">
      <Transition name="sketch-select-pop">
        <div
          v-if="isOpen"
          ref="menuEl"
          :class="['sketch-select__menu', menuClass]"
          role="listbox"
          :style="menuStyle"
          @pointerdown.prevent
        >
          <button
            v-for="opt in options"
            :key="opt.value"
            type="button"
            :class="['sketch-select__option', opt.value === modelValue ? 'active' : '']"
            role="option"
            :aria-selected="opt.value === modelValue"
            @click="selectOption(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

export interface SketchSelectOption {
  label: string;
  value: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: string;
    options: SketchSelectOption[];
    disabled?: boolean;
    triggerClass?: string;
    menuClass?: string;
    containerClass?: string;
  }>(),
  {
    disabled: false,
    triggerClass: '',
    menuClass: '',
    containerClass: '',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const isOpen = ref(false);
const rootEl = ref<HTMLElement | null>(null);
const triggerEl = ref<HTMLElement | null>(null);
const menuEl = ref<HTMLElement | null>(null);
const menuStyle = ref<Record<string, string>>({});

const selectedLabel = computed(() => {
  const selected = props.options.find((opt) => opt.value === props.modelValue);
  return selected?.label ?? props.options[0]?.label ?? '';
});

function updateMenuPosition() {
  const trigger = triggerEl.value;
  if (!trigger) return;

  const rect = trigger.getBoundingClientRect();
  const viewportH = window.innerHeight || document.documentElement.clientHeight;
  const viewportW = window.innerWidth || document.documentElement.clientWidth;
  const gap = 6;
  const isMobile = viewportW <= 768;
  const minMenuWidth = isMobile ? Math.max(rect.width, 148) : rect.width;
  const maxMenuHeight = isMobile
    ? Math.min(280, Math.max(160, viewportH - 24))
    : 260;

  let left = rect.left;
  if (left + minMenuWidth > viewportW - 8) {
    left = Math.max(8, viewportW - minMenuWidth - 8);
  }

  const spaceBelow = viewportH - rect.bottom - gap;
  const spaceAbove = rect.top - gap;
  const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;

  if (openUp) {
    const height = Math.min(maxMenuHeight, Math.max(120, spaceAbove - 8));
    menuStyle.value = {
      position: 'fixed',
      top: 'auto',
      bottom: `${viewportH - rect.top + gap}px`,
      left: `${left}px`,
      right: 'auto',
      width: `${minMenuWidth}px`,
      maxHeight: `${height}px`,
      zIndex: '2400',
    };
  } else {
    const height = Math.min(maxMenuHeight, Math.max(120, spaceBelow - 8));
    menuStyle.value = {
      position: 'fixed',
      top: `${rect.bottom + gap}px`,
      bottom: 'auto',
      left: `${left}px`,
      right: 'auto',
      width: `${minMenuWidth}px`,
      maxHeight: `${height}px`,
      zIndex: '2400',
    };
  }
}

async function openMenu() {
  if (props.disabled) return;
  isOpen.value = true;
  await nextTick();
  updateMenuPosition();
}

function closeMenu() {
  isOpen.value = false;
}

function toggleOpen() {
  if (props.disabled) return;
  if (isOpen.value) closeMenu();
  else void openMenu();
}

function selectOption(value: string) {
  emit('update:modelValue', value);
  closeMenu();
}

function handlePointerDownOutside(event: PointerEvent) {
  if (!isOpen.value) return;
  const target = event.target as Node | null;
  if (!target) return;
  if (rootEl.value?.contains(target)) return;
  if (menuEl.value?.contains(target)) return;
  closeMenu();
}

function handleReposition() {
  if (!isOpen.value) return;
  updateMenuPosition();
}

watch(isOpen, (open) => {
  if (open) void nextTick(updateMenuPosition);
});

onMounted(() => {
  document.addEventListener('pointerdown', handlePointerDownOutside);
  window.addEventListener('resize', handleReposition);
  window.addEventListener('scroll', handleReposition, true);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handlePointerDownOutside);
  window.removeEventListener('resize', handleReposition);
  window.removeEventListener('scroll', handleReposition, true);
});
</script>
