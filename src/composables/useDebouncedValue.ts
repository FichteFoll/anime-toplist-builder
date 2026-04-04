import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

export const useDebouncedValue = <T>(source: Ref<T>, delay = 250) => {
  const debouncedValue = ref(source.value) as Ref<T>
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  watch(source, (value) => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      debouncedValue.value = value
    }, delay)
  })

  onBeforeUnmount(() => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }
  })

  return debouncedValue
}
