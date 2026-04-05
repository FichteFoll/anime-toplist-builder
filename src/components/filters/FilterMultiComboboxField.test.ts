// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { nextTick, ref, type Component } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import FilterMultiComboboxField from '@/components/filters/FilterMultiComboboxField.vue'

vi.mock('reka-ui', () => ({
  ComboboxAnchor: {
    template: '<div><slot /></div>',
  },
  ComboboxContent: {
    template: '<div><slot /></div>',
  },
  ComboboxInput: {
    name: 'ComboboxInput',
    props: {
      modelValue: {
        type: String,
        default: '',
      },
      placeholder: {
        type: String,
        default: '',
      },
    },
    emits: ['update:modelValue'],
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)">',
  } satisfies Component,
  ComboboxItem: {
    template: '<div><slot /></div>',
  },
  ComboboxPortal: {
    template: '<div><slot /></div>',
  },
  ComboboxRoot: {
    props: {
      modelValue: {
        type: Array,
        default: () => [],
      },
      multiple: {
        type: Boolean,
        default: false,
      },
      disabled: {
        type: Boolean,
        default: false,
      },
      openOnFocus: {
        type: Boolean,
        default: false,
      },
      ignoreFilter: {
        type: Boolean,
        default: false,
      },
    },
    emits: ['update:modelValue'],
    template: '<div><slot /></div>',
  } satisfies Component,
  ComboboxViewport: {
    template: '<div><slot /></div>',
  },
  ComboboxVirtualizer: {
    props: {
      options: {
        type: Array,
        default: () => [],
      },
    },
    template: '<div />',
  } satisfies Component,
}))

describe('FilterMultiComboboxField', () => {
  it('clears all selections from the clear button', async () => {
    const Parent = {
      components: { FilterMultiComboboxField },
      setup() {
        const model = ref<string[]>(['JP', 'KR'])

        return { model }
      },
      template: `
        <FilterMultiComboboxField
          v-model="model"
          label="Countries"
          :options="[
            { value: 'JP', label: 'Japan' },
            { value: 'KR', label: 'South Korea' },
          ]"
          clear-label="Clear countries"
        />
      `,
    } satisfies Component

    const wrapper = mount(Parent)

    await wrapper.get('button[aria-label="Clear countries"]').trigger('click')
    await nextTick()

    expect(wrapper.vm.model).toEqual([])
  })
})
