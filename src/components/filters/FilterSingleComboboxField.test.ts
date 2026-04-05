// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import FilterSingleComboboxField from '@/components/filters/FilterSingleComboboxField.vue'

vi.mock('reka-ui', () => ({
  ComboboxAnchor: {
    template: '<div><slot /></div>',
  },
  ComboboxContent: {
    template: '<div><slot /></div>',
  },
  ComboboxInput: defineComponent({
    name: 'ComboboxInput',
    props: {
      displayValue: {
        type: Function,
        default: undefined,
      },
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
  }),
  ComboboxItem: {
    template: '<div><slot /></div>',
  },
  ComboboxPortal: {
    template: '<div><slot /></div>',
  },
  ComboboxRoot: {
    props: {
      modelValue: {
        type: String,
        default: undefined,
      },
      disabled: {
        type: Boolean,
        default: false,
      },
      openOnFocus: {
        type: Boolean,
        default: false,
      },
    },
    emits: ['update:modelValue'],
    template: '<div><slot /></div>',
  },
  ComboboxViewport: {
    template: '<div><slot /></div>',
  },
}))

describe('FilterSingleComboboxField', () => {
  it('clears the displayed text when the selection is cleared', async () => {
    const Parent = defineComponent({
      components: { FilterSingleComboboxField },
      setup() {
        const model = ref<string | undefined>('JP')

        return { model }
      },
      template: `
        <FilterSingleComboboxField
          v-model="model"
          label="Country of origin"
          :options="[
            { value: 'JP', label: 'Japan' },
            { value: 'KR', label: 'South Korea' },
          ]"
          clear-label="Clear country of origin"
        />
      `,
    })

    const wrapper = mount(Parent)
    const input = wrapper.get('input')

    await input.setValue('Japan-ish')
    await wrapper.get('button[aria-label="Clear country of origin"]').trigger('click')
    await nextTick()

    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('')
  })
})
