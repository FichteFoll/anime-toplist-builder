declare module 'sortablejs' {
  export interface SortableEvent {
    oldIndex?: number
    newIndex?: number
  }

  export interface SortableOptions {
    animation?: number
    chosenClass?: string
    delay?: number
    delayOnTouchOnly?: boolean
    dragClass?: string
    draggable?: string
    ghostClass?: string
    handle?: string
    touchStartThreshold?: number
    onEnd?: (event: SortableEvent) => void
  }

  export default class Sortable {
    static create(element: HTMLElement, options?: SortableOptions): Sortable

    destroy(): void
  }
}
