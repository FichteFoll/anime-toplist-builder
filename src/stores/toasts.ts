import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { ToastTone, type ToastInput, type ToastItem } from '@/types'

const defaultToastDuration = 3500

const createToastId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const createToast = (input: ToastInput): ToastItem => ({
  id: createToastId(),
  title: input.title,
  description: input.description,
  tone: input.tone ?? ToastTone.Info,
  duration: input.duration ?? defaultToastDuration,
  open: true,
})

export const useToastStore = defineStore('toasts', () => {
  const items = ref<ToastItem[]>([])

  const visibleItems = computed(() => items.value.filter((item) => item.open))

  const push = (input: ToastInput) => {
    const toast = createToast(input)

    items.value = [...items.value, toast]

    return toast.id
  }

  const dismiss = (id: string) => {
    items.value = items.value.map((item) =>
      item.id === id
        ? {
            ...item,
            open: false,
          }
        : item,
    )
  }

  const remove = (id: string) => {
    items.value = items.value.filter((item) => item.id !== id)
  }

  const notify = (tone: ToastTone, title: string, description?: string) => {
    push({
      tone,
      title,
      description,
    })
  }

  const success = (title: string, description?: string) => {
    notify(ToastTone.Success, title, description)
  }

  const error = (title: string, description?: string) => {
    notify(ToastTone.Error, title, description)
  }

  const info = (title: string, description?: string) => {
    notify(ToastTone.Info, title, description)
  }

  return {
    items,
    visibleItems,
    push,
    dismiss,
    remove,
    notify,
    success,
    error,
    info,
  }
})
