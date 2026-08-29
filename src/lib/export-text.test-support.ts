import { clearCache } from '@chenglou/pretext'

/**
 * Installs a deterministic `OffscreenCanvas` stub for pretext's lazily
 * acquired measurement context, so that text layout tests run in the node
 * environment without a native canvas dependency.
 */
export const installStubTextMeasurement = (widthPerCharacter = 10) => {
  class StubOffscreenCanvas {
    getContext() {
      return {
        font: '',
        measureText: (text: string) => ({ width: text.length * widthPerCharacter }),
      }
    }
  }

  globalThis.OffscreenCanvas = StubOffscreenCanvas as unknown as typeof OffscreenCanvas
  clearCache()
}

/** Drops pretext's per-font measurement cache, which lives as long as the module. */
export const resetStubTextMeasurement = () => {
  clearCache()
}
