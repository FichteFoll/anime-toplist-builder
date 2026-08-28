// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import ImageExportDialog from '@/components/export/ImageExportDialog.vue'
import SpinnerIcon from '@/components/icons/SpinnerIcon.vue'
import { createEmptyFilterState } from '@/lib/filter-state'
import { createEmptySongFilterState } from '@/lib/song-selection'
import {
  CategoryEntityKind,
  TemplateOrigin,
  templateSchemaVersion,
  type Template,
} from '@/types'

// The render is deferred so that the in-flight state stays observable.
const exportImage = vi.hoisted(() => {
  type PendingRender = {
    resolve: (value: { blob: Blob }) => void
    reject: (reason: Error) => void
  }

  const pendingRenders: Array<PendingRender> = []

  return {
    pendingRenders,
    renderTemplatePng: vi.fn(
      () =>
        new Promise<{ blob: Blob }>((resolve, reject) => {
          pendingRenders.push({ resolve, reject })
        }),
    ),
  }
})

vi.mock('@/lib/export-image', () => ({
  CATEGORIES_PER_ROW_LANDSCAPE: 5,
  CATEGORIES_PER_ROW_PORTRAIT: 3,
  renderTemplatePng: exportImage.renderTemplatePng,
}))

vi.mock('reka-ui', () => ({
  DialogClose: {
    template: '<div><slot /></div>',
  },
  DialogContent: {
    template: '<div><slot /></div>',
  },
  DialogDescription: {
    template: '<div><slot /></div>',
  },
  DialogOverlay: {
    template: '<div><slot /></div>',
  },
  DialogPortal: {
    template: '<div><slot /></div>',
  },
  DialogRoot: {
    template: '<div><slot /></div>',
  },
  DialogTitle: {
    template: '<div><slot /></div>',
  },
  DialogTrigger: {
    template: '<div><slot /></div>',
  },
}))

const template: Template = {
  id: 'template-1',
  name: 'Season toplist',
  description: '',
  categories: [
    {
      id: 'category-1',
      name: 'Best Opening',
      description: '',
      filter: createEmptyFilterState(),
      entityKind: CategoryEntityKind.Anime,
      songFilter: createEmptySongFilterState(),
    },
  ],
  globalFilter: createEmptyFilterState(),
  origin: TemplateOrigin.User,
  version: templateSchemaVersion,
}

const mountDialog = (open = true) =>
  mount(ImageExportDialog, {
    props: {
      open,
      template,
      selectionByCategory: {},
    },
  })

const settlePendingRenders = async () => {
  for (const pendingRender of exportImage.pendingRenders.splice(0)) {
    pendingRender.resolve({ blob: new Blob(['x'], { type: 'image/png' }) })
  }

  await flushPromises()
}

const failPendingRenders = async () => {
  for (const pendingRender of exportImage.pendingRenders.splice(0)) {
    pendingRender.reject(new Error('Image export failed.'))
  }

  await flushPromises()
}

const hasSpinner = (wrapper: ReturnType<typeof mountDialog>) =>
  wrapper.findComponent(SpinnerIcon).exists()

const findDialogContent = (wrapper: ReturnType<typeof mountDialog>) =>
  wrapper.find('.shadow-shell').element

const findDownloadButton = (wrapper: ReturnType<typeof mountDialog>) =>
  wrapper.find('.shell-button-active').element

const collectAncestorsUpTo = (element: Element, boundary: Element) => {
  const ancestors: Array<Element> = []

  for (let current = element.parentElement; current; current = current.parentElement) {
    ancestors.push(current)

    if (current === boundary) {
      break
    }
  }

  return ancestors
}

describe('ImageExportDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // jsdom implements none of these.
    window.matchMedia = vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
    exportImage.pendingRenders.length = 0
    exportImage.renderTemplatePng.mockClear()
  })

  it('keeps the download footer outside the scrolling region', () => {
    const wrapper = mountDialog()
    const dialogContent = findDialogContent(wrapper)
    const downloadButton = findDownloadButton(wrapper)

    const scrollingAncestors = collectAncestorsUpTo(downloadButton, dialogContent)
      .filter((element) => element.classList.contains('overflow-y-auto'))

    expect(scrollingAncestors).toHaveLength(0)
  })

  it('renders the footer as an opaque last child of the dialog content', () => {
    const wrapper = mountDialog()
    const dialogContent = findDialogContent(wrapper)
    const downloadButton = findDownloadButton(wrapper)

    const footer = collectAncestorsUpTo(downloadButton, dialogContent).at(-2)

    expect(footer).toBe(dialogContent.lastElementChild)
    expect(footer?.classList.contains('bg-app-surface')).toBe(true)
    expect(footer?.classList.contains('bg-app-surface/95')).toBe(false)
  })

  it('has exactly one scrolling region in the dialog', () => {
    const wrapper = mountDialog()

    expect(wrapper.findAll('.overflow-y-auto')).toHaveLength(1)
  })

  it('shows the spinner on open until the first render settles', async () => {
    const wrapper = mountDialog(false)

    await wrapper.setProps({ open: true })
    await nextTick()

    expect(hasSpinner(wrapper)).toBe(true)

    await settlePendingRenders()

    expect(hasSpinner(wrapper)).toBe(false)
  })

  it('does not show the spinner while an option change re-renders', async () => {
    const wrapper = mountDialog(false)

    await wrapper.setProps({ open: true })
    await settlePendingRenders()

    await wrapper.find('input[type="checkbox"]').setValue(true)
    await nextTick()

    expect(exportImage.pendingRenders).toHaveLength(1)
    expect(hasSpinner(wrapper)).toBe(false)
  })

  // A failed first render leaves the placeholder on screen with no preview,
  // which is the only path where an option-driven re-render can be told apart
  // from the initial one by the spinner alone.
  it('does not show the spinner for an option change with the placeholder visible', async () => {
    const wrapper = mountDialog(false)

    await wrapper.setProps({ open: true })
    await failPendingRenders()

    expect(wrapper.find('img').exists()).toBe(false)
    expect(hasSpinner(wrapper)).toBe(false)

    await wrapper.find('input[type="checkbox"]').setValue(true)
    await nextTick()

    expect(exportImage.pendingRenders).toHaveLength(1)
    expect(wrapper.text()).toContain('Rendering the image preview...')
    expect(hasSpinner(wrapper)).toBe(false)
  })

  it('shows the spinner again after reopening the dialog', async () => {
    const wrapper = mountDialog(false)

    await wrapper.setProps({ open: true })
    await settlePendingRenders()

    await wrapper.setProps({ open: false })
    await wrapper.setProps({ open: true })
    await nextTick()

    expect(hasSpinner(wrapper)).toBe(true)
  })
})
