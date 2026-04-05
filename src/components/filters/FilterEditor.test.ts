// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, type Component } from 'vue'
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
})
