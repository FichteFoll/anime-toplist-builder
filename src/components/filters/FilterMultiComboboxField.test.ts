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
    emits: ['select'],
    template: '<button v-bind="$attrs" type="button" @click="$emit(\'select\', $event)"><slot /></button>',
  } satisfies Component,
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

  it('works without excluded values', async () => {
    const Parent = {
      components: { FilterMultiComboboxField },
      setup() {
        const model = ref<string[]>([])

        return { model }
      },
      template: `
        <FilterMultiComboboxField
          v-model="model"
          label="Genres"
          :options="[
            { value: 'Action', label: 'Action' },
          ]"
          clear-label="Clear genres"
        />
      `,
    } satisfies Component

    const wrapper = mount(Parent)
    const clickActionOption = async () => {
      const optionButton = wrapper.get('[data-filter-popup-item="Action"]')

      await optionButton.trigger('click')
    }

    await clickActionOption()
    await nextTick()

    expect(wrapper.vm.model).toEqual(['Action'])
  })

  it('cycles selected values into excluded values and back', async () => {
    const Parent = {
      components: { FilterMultiComboboxField },
      setup() {
        const model = ref<string[]>([])
        const excludedValues = ref<string[]>([])

        return { excludedValues, model }
      },
      template: `
        <FilterMultiComboboxField
          v-model="model"
          v-model:excluded-values="excludedValues"
          enable-exclusion
          label="Genres"
          :options="[
            { value: 'Action', label: 'Action' },
          ]"
          clear-label="Clear genres"
        />
      `,
    } satisfies Component

    const wrapper = mount(Parent)
    const clickActionOption = async () => {
      const optionButton = wrapper.get('[data-filter-popup-item="Action"]')

      await optionButton.trigger('click')
    }

    await clickActionOption()
    await nextTick()
    expect(wrapper.vm.model).toEqual(['Action'])
    expect(wrapper.vm.excludedValues).toEqual([])

    await clickActionOption()
    await nextTick()
    expect(wrapper.vm.model).toEqual([])
    expect(wrapper.vm.excludedValues).toEqual(['Action'])

    await clickActionOption()
    await nextTick()
    expect(wrapper.vm.model).toEqual([])
    expect(wrapper.vm.excludedValues).toEqual([])
  })

  it('toggles an included chip into excluded values when exclusion is enabled', async () => {
    const Parent = {
      components: { FilterMultiComboboxField },
      setup() {
        const model = ref<string[]>(['Action'])
        const excludedValues = ref<string[]>([])

        return { excludedValues, model }
      },
      template: `
        <FilterMultiComboboxField
          v-model="model"
          v-model:excluded-values="excludedValues"
          enable-exclusion
          label="Genres"
          :options="[
            { value: 'Action', label: 'Action' },
          ]"
          clear-label="Clear genres"
        />
      `,
    } satisfies Component

    const wrapper = mount(Parent)

    const chipButton = wrapper
      .findAll('button')
      .find((button) => button.text().trim() === 'Action')

    expect(chipButton).toBeDefined()

    await chipButton!.trigger('pointerdown')
    await chipButton!.trigger('click')
    await nextTick()

    expect(wrapper.vm.model).toEqual([])
    expect(wrapper.vm.excludedValues).toEqual(['Action'])
  })

  it('cycles an excluded chip back into included values when exclusion is enabled', async () => {
    const Parent = {
      components: { FilterMultiComboboxField },
      setup() {
        const model = ref<string[]>([])
        const excludedValues = ref<string[]>(['Action'])

        return { excludedValues, model }
      },
      template: `
        <FilterMultiComboboxField
          v-model="model"
          v-model:excluded-values="excludedValues"
          enable-exclusion
          label="Genres"
          :options="[
            { value: 'Action', label: 'Action' },
          ]"
          clear-label="Clear genres"
        />
      `,
    } satisfies Component

    const wrapper = mount(Parent)

    const chipButton = wrapper.get('[data-filter-chip="excluded"]')

    await chipButton.trigger('click')
    await nextTick()

    expect(wrapper.vm.model).toEqual(['Action'])
    expect(wrapper.vm.excludedValues).toEqual([])
  })

  it('removes an excluded chip from excluded values with the remove button', async () => {
    const Parent = {
      components: { FilterMultiComboboxField },
      setup() {
        const model = ref<string[]>([])
        const excludedValues = ref<string[]>(['Action'])

        return { excludedValues, model }
      },
      template: `
        <FilterMultiComboboxField
          v-model="model"
          v-model:excluded-values="excludedValues"
          enable-exclusion
          label="Genres"
          :options="[
            { value: 'Action', label: 'Action' },
          ]"
          clear-label="Clear genres"
        />
      `,
    } satisfies Component

    const wrapper = mount(Parent)

    await wrapper.get('button[aria-label="Remove Action"]').trigger('click')
    await nextTick()

    expect(wrapper.vm.model).toEqual([])
    expect(wrapper.vm.excludedValues).toEqual([])
  })

  it('removes excluded values from the included model and renders them as excluded', async () => {
    const Parent = {
      components: { FilterMultiComboboxField },
      setup() {
        const model = ref<string[]>(['Action', 'Drama'])
        const excludedValues = ref<string[]>(['Action'])

        return { excludedValues, model }
      },
      template: `
        <FilterMultiComboboxField
          v-model="model"
          v-model:excluded-values="excludedValues"
          enable-exclusion
          label="Genres"
          :options="[
            { value: 'Action', label: 'Action' },
            { value: 'Drama', label: 'Drama' },
          ]"
          clear-label="Clear genres"
        />
      `,
    } satisfies Component

    const wrapper = mount(Parent)

    expect(wrapper.vm.model).toEqual(['Action', 'Drama'])
    expect(wrapper.vm.excludedValues).toEqual(['Action'])

    await nextTick()

    const excludedChip = wrapper.get('[data-filter-chip="excluded"]')

    expect(excludedChip.attributes('class')).toContain('bg-red-500/10')

    const excludedPopupItem = wrapper.get('[data-filter-popup-item="Action"]')

    expect(excludedPopupItem.attributes('class')).toContain('bg-red-500/10')
  })
})
