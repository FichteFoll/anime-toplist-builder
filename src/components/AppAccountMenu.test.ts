// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ConfigProvider, TooltipProvider } from 'reka-ui'
import { defineComponent, h, nextTick } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'

import AppAccountMenu from '@/components/AppAccountMenu.vue'

const stubMatchMedia = () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

const AccountMenuHost = defineComponent({
  render: () =>
    h(ConfigProvider, { scrollBody: false }, {
      default: () => h(TooltipProvider, null, { default: () => h(AppAccountMenu) }),
    }),
})

describe('AppAccountMenu', () => {
  beforeEach(() => {
    stubMatchMedia()
    setActivePinia(createPinia())
  })

  it('anchors the opened menu to its trigger', async () => {
    const wrapper = mount(AccountMenuHost, { attachTo: document.body })

    await wrapper.find('button').trigger('click')
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(document.body.textContent).toContain('Account and preferences')

    // Without a resolved popper anchor the content stays parked off-screen,
    // which is how a menu trigger nested in the wrong popper root fails.
    const content = document.querySelector<HTMLElement>('[data-reka-popper-content-wrapper]')

    expect(content?.style.transform).toBe('translate(0px, 0px)')

    wrapper.unmount()
  })

  it('emits show-changelog when the What\'s new item is selected', async () => {
    const wrapper = mount(AccountMenuHost, { attachTo: document.body })
    const menu = wrapper.findComponent(AppAccountMenu)

    await wrapper.find('button').trigger('click')
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 20))

    const items = Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]'))
    const whatsNewItem = items.find((item) => item.textContent?.includes('What\'s new'))

    expect(whatsNewItem).toBeDefined()

    whatsNewItem?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(menu.emitted('show-changelog')).toHaveLength(1)

    wrapper.unmount()
  })

  it('does not compensate the scrollbar on the body while open', async () => {
    const wrapper = mount(AccountMenuHost, { attachTo: document.body })

    await wrapper.find('button').trigger('click')
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(document.body.style.paddingRight).toBe('0px')
    expect(document.body.style.marginRight).toBe('0px')

    wrapper.unmount()
  })
})
