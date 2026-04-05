import { nextTick, onBeforeUnmount, ref, watch, type ComponentPublicInstance } from 'vue'

export interface VisibleScrollbarState {
  visible: boolean
  thumbHeight: number
  thumbTop: number
}

const resolveViewportElement = (target: HTMLElement | ComponentPublicInstance | null) => {
  if (target instanceof HTMLElement) {
    return target
  }

  if (target && typeof target === 'object' && '$el' in target) {
    const element = target.$el

    if (element instanceof HTMLElement) {
      return element
    }
  }

  return null
}

export const useVisibleScrollbar = (watchSource: () => unknown) => {
  const viewportRef = ref<HTMLElement | ComponentPublicInstance | null>(null)
  const scrollbarState = ref<VisibleScrollbarState>({
    visible: false,
    thumbHeight: 0,
    thumbTop: 0,
  })

  let detachScrollListener: (() => void) | undefined

  const attachViewport = (viewport: HTMLElement | ComponentPublicInstance | null) => {
    detachScrollListener?.()
    detachScrollListener = undefined

    const viewportElement = resolveViewportElement(viewport)

    if (!viewportElement) {
      syncScrollbar()
      return
    }

    const handleScroll = () => {
      syncScrollbar()
    }

    viewportElement.addEventListener('scroll', handleScroll, { passive: true })

    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(handleScroll)
    observer?.observe(viewportElement)

    detachScrollListener = () => {
      viewportElement.removeEventListener('scroll', handleScroll)
      observer?.disconnect()
    }

    syncScrollbar()
  }

  const syncScrollbar = () => {
    const viewportElement = resolveViewportElement(viewportRef.value)

    if (!viewportElement) {
      scrollbarState.value.visible = false
      scrollbarState.value.thumbHeight = 0
      scrollbarState.value.thumbTop = 0
      return
    }

    const { scrollTop, scrollHeight, clientHeight } = viewportElement

    if (scrollHeight <= clientHeight + 1) {
      scrollbarState.value.visible = false
      scrollbarState.value.thumbHeight = 0
      scrollbarState.value.thumbTop = 0
      return
    }

    const thumbHeight = Math.max(24, (clientHeight / scrollHeight) * clientHeight)
    const maxThumbTop = clientHeight - thumbHeight
    const scrollRange = scrollHeight - clientHeight

    scrollbarState.value.visible = true
    scrollbarState.value.thumbHeight = thumbHeight
    scrollbarState.value.thumbTop = scrollRange <= 0 ? 0 : (scrollTop / scrollRange) * maxThumbTop
  }

  watch(
    viewportRef,
    (viewport) => {
      attachViewport(viewport)
    },
    { immediate: true, flush: 'post' },
  )

  onBeforeUnmount(() => {
    detachScrollListener?.()
  })

  watch(watchSource, async () => {
    await nextTick()
    syncScrollbar()
  }, { immediate: true })

  return {
    scrollbarState,
    syncScrollbar,
    viewportRef,
  }
}
