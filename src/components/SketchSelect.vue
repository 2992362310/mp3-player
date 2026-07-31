<template>
  <div
    ref="rootEl"
    class="sketch-select"
    :class="[containerClass, isOpen ? 'is-open' : '']"
  >
    <button
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

    <Transition name="sketch-select-pop">
      <div
        v-if="isOpen"
        :class="['sketch-select__menu', menuClass]"
        role="listbox"
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
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

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

const selectedLabel = computed(() => {
  const selected = props.options.find((opt) => opt.value === props.modelValue);
  return selected?.label ?? props.options[0]?.label ?? '';
});

function openMenu() {
  if (!props.disabled) isOpen.value = true;
}

function closeMenu() {
  isOpen.value = false;
}

function toggleOpen() {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
}

function selectOption(value: string) {
  emit('update:modelValue', value);
  closeMenu();
}

function handlePointerDownOutside(event: PointerEvent) {
  if (!isOpen.value) return;
  if (!rootEl.value) return;
  const target = event.target as Node | null;
  if (target && !rootEl.value.contains(target)) {
    closeMenu();
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handlePointerDownOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handlePointerDownOutside);
});
</script>
