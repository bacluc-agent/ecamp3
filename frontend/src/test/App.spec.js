import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setupVuetify } from '/tests/setupVuetify.js'
import { head } from '@/plugins/head.js'
import App from '@/App.vue'

setupVuetify()

vi.mock('@/plugins/index.js', () => ({ headEnvironment: null }))

// Model the real layout feedback: --footer-height decides the footer's height, so a
// footer that reacts to it flips between 0px and 40px forever. Freeze the measurement
// after MEASUREMENT_CAP so an unbounded loop unwinds and can be asserted on.
const MEASUREMENT_CAP = 50

function drain() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe('App footer height observer', () => {
  it('settles instead of re-measuring forever', async () => {
    let measurements = 0
    let appStyle = null

    const footer = document.createElement('footer')
    footer.className = 'v-footer ec-footer offline'
    document.body.appendChild(footer)
    Object.defineProperty(footer, 'offsetHeight', {
      get() {
        measurements++
        if (measurements > MEASUREMENT_CAP) return 0
        return appStyle?.getPropertyValue('--footer-height') === '0px' ? 40 : 0
      },
    })

    const wrapper = mount(App, {
      attachTo: document.body,
      global: {
        plugins: [head],
        mocks: {
          $t: (key) => key,
          $auth: { isLoggedIn: () => false, initRefresh: vi.fn() },
          $store: { commit: vi.fn(), state: { lang: { language: 'de' } } },
        },
        stubs: {
          RouterView: true,
          FooterSharedCamp: true,
          CommentsPanel: true,
          NewVersionAvailableDialog: true,
          ToastHost: true,
        },
      },
    })
    appStyle = wrapper.element.style

    for (let i = 0; i < 5; i++) await drain()

    const measured = measurements
    wrapper.unmount()

    expect(measured).toBeLessThanOrEqual(MEASUREMENT_CAP)
  })
})
