<script setup lang="ts">
import { DialogClose } from 'reka-ui'

withDefaults(defineProps<{
  ariaLabel?: string
  buttonClass?: string
  label?: string
}>(), {
  ariaLabel: 'Close dialog',
  buttonClass: '',
  label: '×',
})
</script>

<template>
  <DialogClose as-child>
    <button
      type="button"
      :aria-label="ariaLabel"
      :class="['absolute right-5 top-5 z-10', !buttonClass && 'shell-button', buttonClass]"
    >
      {{ label }}
    </button>
  </DialogClose>
</template>
