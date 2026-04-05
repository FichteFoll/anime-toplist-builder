import { ref, watch } from 'vue'

export type ConfirmationDialogState = {
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
}

export const useConfirmationDialog = () => {
  const isOpen = ref(false)
  const state = ref<ConfirmationDialogState | null>(null)

  const requestConfirmation = (nextState: ConfirmationDialogState) => {
    state.value = nextState
    isOpen.value = true
  }

  const closeConfirmation = () => {
    isOpen.value = false
  }

  const confirmAction = () => {
    const action = state.value?.onConfirm

    closeConfirmation()
    state.value = null
    action?.()
  }

  watch(isOpen, (open) => {
    if (!open) {
      state.value = null
    }
  })

  return {
    isOpen,
    state,
    requestConfirmation,
    closeConfirmation,
    confirmAction,
  }
}
