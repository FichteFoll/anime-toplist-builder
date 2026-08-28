// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ImageExportDialog from '@/components/export/ImageExportDialog.vue'
import { createEmptyFilterState } from '@/lib/filter-state'
import { createEmptySongFilterState } from '@/lib/song-selection'
import {
  CategoryEntityKind,
  TemplateOrigin,
  templateSchemaVersion,
  type Template,
} from '@/types'

vi.mock('@/lib/export-image', () => ({
  CATEGORIES_PER_ROW_LANDSCAPE: 5,
  CATEGORIES_PER_ROW_PORTRAIT: 3,
  renderTemplatePng: vi.fn(async () => ({
    blob: new Blob(['x'], { type: 'image/png' }),
  })),
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

const mountDialog = () =>
  mount(ImageExportDialog, {
    props: {
      open: true,
      template,
      selectionByCategory: {},
    },
  })

const findDialogContent = (wrapper: ReturnType<typeof mountDialog>) =>
  wrapper.find('.shadow-shell').element

const findDownloadButton = (wrapper: ReturnType<typeof mountDialog>) =>
  wrapper.find('.shell-button-active').element

const collectAncestorsUpTo = (element: Element, boundary: Element) => {
  const ancestors: Element[] = []

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
})
