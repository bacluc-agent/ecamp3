import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setupVuetify } from '/tests/setupVuetify.js'
import { head } from '@/plugins/head.js'
import App from '@/App.vue'

setupVuetify()

vi.mock('@/plugins/index.js', () => ({ headEnvironment: null }))

// Model the layout feedback that would exist if a footer sized itself from
// --footer-height: it would then flip between 0px and 40px forever. Nothing in
// this repo's CSS does that today, so the loop this guards against is latent,
// not observed. Freeze the measurement after MEASUREMENT_CAP so an unbounded
// loop unwinds into a countable number instead of hanging on the vitest
// timeout.
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

  it('re-measures when a descendant footer gets its inline style re-patched', async () => {
    const spy = vi.spyOn(App.methods, 'updateFooterHeight')
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

    // Vuetify re-patches <v-footer app>'s inline layout styles on every viewport
    // resize (VFooter.js layoutItemStyles -> layout.js), so a resize that re-wraps
    // the footer text arrives as a descendant `style` mutation.
    const footer = document.createElement('footer')
    footer.className = 'v-footer ec-footer'
    wrapper.element.appendChild(footer)
    for (let i = 0; i < 8; i++) await drain()
    const before = spy.mock.calls.length

    footer.setAttribute(
      'style',
      'bottom: 0px; z-index: 1004; position: fixed; width: 320px;'
    )
    for (let i = 0; i < 5; i++) await drain()

    const after = spy.mock.calls.length
    wrapper.unmount()
    expect(after).toBeGreaterThan(before)
  })
})
