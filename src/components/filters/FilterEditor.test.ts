// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { describe, expect, it } from 'vitest'

import FilterEditor from '@/components/filters/FilterEditor.vue'
import { createEmptyFilterState } from '@/lib/filter-state'

const FilterMultiComboboxFieldStub = defineComponent({
  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
    excludedValues: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['update:modelValue', 'update:excludedValues'],
  template: '<div />',
})

const FilterMultiSelectFieldStub = defineComponent({
  props: {
    label: {
      type: String,
      default: '',
    },
    modelValue: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['update:modelValue'],
  template: '<div />',
})

const FilterFieldStub = defineComponent({
  props: {
    label: {
      type: String,
      default: '',
    },
    active: {
      type: Boolean,
      default: false,
    },
  },
  template: '<div><slot /></div>',
})

describe('FilterEditor', () => {
  it('preserves same-tick genre and excluded genre updates', async () => {
    const wrapper = mount(FilterEditor, {
      props: {
        mode: 'category',
        metadata: {
          genres: ['Action'],
          tags: [],
        },
        metadataStatus: 'ready',
        modelValue: createEmptyFilterState(),
      },
      global: {
        stubs: {
          FilterField: true,
          FilterMultiSelectField: true,
          FilterSingleComboboxField: true,
          FilterSortEditor: true,
          FilterTagEditor: true,
          CaretIcon: true,
          FilterMultiComboboxField: FilterMultiComboboxFieldStub,
        },
      },
    })

    const genreField = wrapper.findAllComponents(FilterMultiComboboxFieldStub)[0]

    genreField.vm.$emit('update:modelValue', ['Action'])
    genreField.vm.$emit('update:excludedValues', [])
    await nextTick()

    const updates = wrapper.emitted('update:modelValue')

    expect(updates).toBeTruthy()
    expect(updates!.at(-1)?.[0]).toMatchObject({
      genres: ['Action'],
      excludedGenres: [],
    })
  })

  it('keeps every selected country of origin', async () => {
    const wrapper = mount(FilterEditor, {
      props: {
        mode: 'global',
        metadata: {
          genres: [],
          tags: [],
        },
        metadataStatus: 'ready',
        modelValue: createEmptyFilterState(),
      },
      global: {
        stubs: {
          FilterField: true,
          FilterMultiComboboxField: true,
          FilterSingleComboboxField: true,
          FilterSortEditor: true,
          FilterTagEditor: true,
          CaretIcon: true,
          FilterMultiSelectField: FilterMultiSelectFieldStub,
        },
      },
    })

    const countryField = wrapper
      .findAllComponents(FilterMultiSelectFieldStub)
      .find((field) => field.props('label') === 'Country of origin')

    expect(countryField).toBeDefined()

    countryField!.vm.$emit('update:modelValue', ['JP'])
    countryField!.vm.$emit('update:modelValue', ['CN', 'JP'])
    await nextTick()

    const updates = wrapper.emitted('update:modelValue')

    expect(updates).toBeTruthy()
    expect(updates!.at(-1)?.[0]).toMatchObject({
      countriesOfOrigin: ['CN', 'JP'],
    })
  })
  it('marks fields that carry a value as active', () => {
    const wrapper = mount(FilterEditor, {
      props: {
        mode: 'global',
        metadata: {
          genres: [],
          tags: [],
        },
        metadataStatus: 'ready',
        modelValue: {
          ...createEmptyFilterState(),
          yearRange: { minimum: 2000 },
        },
      },
      global: {
        stubs: {
          FilterMultiSelectField: true,
          FilterMultiComboboxField: true,
          FilterSingleComboboxField: true,
          FilterSortEditor: true,
          FilterTagEditor: true,
          CaretIcon: true,
          FilterField: FilterFieldStub,
        },
      },
    })

    const fields = wrapper.findAllComponents(FilterFieldStub)
    const activeLabels = fields.filter((field) => field.props('active')).map((field) => field.props('label'))

    expect(activeLabels).toEqual(['Release year'])
  })

  it('opens the advanced section when it holds a configured field', () => {
    const wrapper = mount(FilterEditor, {
      props: {
        mode: 'global',
        metadata: {
          genres: [],
          tags: [],
        },
        metadataStatus: 'ready',
        modelValue: {
          ...createEmptyFilterState(),
          episodes: { maximum: 13 },
        },
      },
      global: {
        stubs: {
          FilterField: true,
          FilterMultiSelectField: true,
          FilterMultiComboboxField: true,
          FilterSingleComboboxField: true,
          FilterSortEditor: true,
          FilterTagEditor: true,
          CaretIcon: true,
        },
      },
    })

    expect(wrapper.find('details').attributes('open')).toBeDefined()
  })
})
