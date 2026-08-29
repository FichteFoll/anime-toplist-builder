// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ConfigProvider, TooltipProvider } from 'reka-ui'
import { defineComponent, h, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import AppAccountMenu from '@/components/AppAccountMenu.vue'
import AppHeader from '@/components/AppHeader.vue'
import { latestChangelogVersion } from '@/config/changelog'
import { getBrowserStorage } from '@/lib/persistence'
import { useSettingsStore } from '@/stores/settings'

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

const AppHeaderHost = defineComponent({
  render: () =>
    h(ConfigProvider, { scrollBody: false }, {
      default: () => h(TooltipProvider, null, { default: () => h(AppHeader) }),
    }),
})

const mountHeader = async () => {
  const wrapper = mount(AppHeaderHost, { attachTo: document.body })

  await nextTick()
  await nextTick()

  return wrapper
}

const isChangelogOpen = () =>
  document.body.textContent?.includes('Recent user-facing changes to the app.') ?? false

describe('AppHeader changelog popup', () => {
  beforeEach(() => {
    stubMatchMedia()
    // The store persists through this record,
    // so a leftover write would decide the next case's startup path.
    getBrowserStorage()?.removeItem('anime-toplist-builder.settings.v1')
    setActivePinia(createPinia())
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('records the current version without opening anything on a first visit', async () => {
    const settingsStore = useSettingsStore()
    settingsStore.initialize()
    const record = vi.spyOn(settingsStore, 'setLastShownChangelogVersion')

    expect(settingsStore.lastShownChangelogVersion).toBeNull()

    const wrapper = await mountHeader()

    expect(isChangelogOpen()).toBe(false)
    expect(record).toHaveBeenCalledExactlyOnceWith(latestChangelogVersion)
    expect(settingsStore.lastShownChangelogVersion).toBe(latestChangelogVersion)

    wrapper.unmount()
  })

  it('records the version exactly once when it opens automatically', async () => {
    const settingsStore = useSettingsStore()
    settingsStore.initialize()
    settingsStore.setLastShownChangelogVersion('1970-01-01')
    const record = vi.spyOn(settingsStore, 'setLastShownChangelogVersion')

    const wrapper = await mountHeader()

    expect(isChangelogOpen()).toBe(true)
    // Pins the startup path itself: the automatic open must not record again,
    // and dropping the startup recording must not be masked by the open.
    expect(record).toHaveBeenCalledExactlyOnceWith(latestChangelogVersion)
    expect(settingsStore.lastShownChangelogVersion).toBe(latestChangelogVersion)

    wrapper.unmount()
  })

  it('stays closed and records nothing when the recorded version is up to date', async () => {
    const settingsStore = useSettingsStore()
    settingsStore.initialize()
    settingsStore.setLastShownChangelogVersion(latestChangelogVersion)
    const record = vi.spyOn(settingsStore, 'setLastShownChangelogVersion')

    const wrapper = await mountHeader()

    expect(isChangelogOpen()).toBe(false)
    expect(record).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('opens on demand from the settings menu and records the version', async () => {
    const settingsStore = useSettingsStore()
    settingsStore.initialize()
    settingsStore.setLastShownChangelogVersion(latestChangelogVersion)

    const wrapper = await mountHeader()

    expect(isChangelogOpen()).toBe(false)

    settingsStore.setLastShownChangelogVersion('1970-01-01')
    const record = vi.spyOn(settingsStore, 'setLastShownChangelogVersion')

    wrapper.findComponent(AppAccountMenu).vm.$emit('show-changelog')
    await nextTick()
    await nextTick()

    expect(isChangelogOpen()).toBe(true)
    expect(record).toHaveBeenCalledExactlyOnceWith(latestChangelogVersion)
    expect(settingsStore.lastShownChangelogVersion).toBe(latestChangelogVersion)

    wrapper.unmount()
  })
})
