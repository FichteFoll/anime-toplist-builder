// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import NameWithTooltip from '@/components/categories/NameWithTooltip.vue'

vi.mock('reka-ui', () => ({
  TooltipArrow: { template: '<span />' },
  TooltipContent: { template: '<span class="tooltip-content"><slot /></span>' },
  TooltipPortal: { template: '<span><slot /></span>' },
  TooltipRoot: { template: '<span><slot /></span>' },
  TooltipTrigger: { template: '<span class="tooltip-trigger"><slot /></span>' },
}))

describe('NameWithTooltip', () => {
  it('renders the name alone when there is no alternate name', () => {
    const wrapper = mount(NameWithTooltip, {
      props: { primary: 'Maomao', tooltip: null },
    })

    expect(wrapper.text()).toBe('Maomao')
    expect(wrapper.find('.tooltip-content').exists()).toBe(false)
  })

  it('shows the alternate name in a tooltip', () => {
    const wrapper = mount(NameWithTooltip, {
      props: { primary: 'Maomao', tooltip: '猫猫' },
    })

    expect(wrapper.find('.tooltip-content').text()).toBe('猫猫')
  })

  it('keeps the trigger shrink-wrapped around its text', () => {
    const wrapper = mount(NameWithTooltip, {
      props: { primary: 'Maomao', tooltip: '猫猫', textClass: 'font-medium' },
    })

    const trigger = wrapper.find('.tooltip-trigger span')

    // A block-level trigger spans its whole row, and the tooltip then centres
    // itself over the row instead of over the name it belongs to.
    expect(trigger.classes()).toContain('inline-block')
    expect(trigger.classes()).not.toContain('block')
    expect(trigger.classes()).toContain('font-medium')
  })
})
