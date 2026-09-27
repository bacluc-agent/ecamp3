import { describe, expect, test } from 'vitest'
import { setupVuetify } from '/tests/setupVuetify.js'
import { mount as mountComponent } from '@vue/test-utils'
import ECheckbox from '../ECheckbox.vue'
import { screen } from '@testing-library/vue'

setupVuetify()

describe('An ECheckbox', () => {
  const mount = (options) => {
    const App = {
      components: { ECheckbox },
      data: function () {
        return {
          data: null,
        }
      },
      template: `
        <div data-app>
          <span id="value">{{ data }}</span>
          <e-checkbox label="test" v-model="data" path="test">
            ${options?.children}
          </e-checkbox>
        </div>
      `,
    }
    return mountComponent(App, {
      attachTo: document.body,
      ...options,
    })
  }

  test('looks like a checkbox', async () => {
    const wrapper = mount()
    await wrapper.setData({ data: false })
    expect(wrapper.html()).toMatchSnapshot('unchecked')

    await wrapper.setData({ data: true })
    expect(wrapper.html()).toMatchSnapshot('checked')
  })

  test('is checked when initialized checked', () => {
    const wrapper = mount({
      data: function () {
        return {
          data: true,
        }
      },
    })
    expect(
      wrapper.find('input[type=checkbox]').element.hasAttribute('checked')
    ).toStrictEqual(true)
  })

  test('updates checkbox when vModel changes', async () => {
    const wrapper = mount()
    await wrapper.setData({ data: false })
    expect(
      wrapper.find('input[type=checkbox]').element.hasAttribute('checked')
    ).toStrictEqual(false)

    await wrapper.setData({ data: true })
    expect(
      wrapper.find('input[type=checkbox]').element.hasAttribute('checked')
    ).toStrictEqual(true)

    await wrapper.setData({ data: false })
    expect(
      wrapper.find('input[type=checkbox]').element.hasAttribute('checked')
    ).toStrictEqual(false)
  })

  test('updates vModel when user clicks on checkbox', async () => {
    const wrapper = mount()
    const input = wrapper.find('input')
    const valueElement = wrapper.find('#value')

    await input.trigger('click')
    expect(valueElement.text()).toStrictEqual('true')

    await input.trigger('click')
    expect(valueElement.text()).toStrictEqual('false')
  })

  test('allows to use the append slot', async () => {
    mount({
      children: `
        <template #append>
          <span>append</span>
        </template>
      `,
    })

    expect(await screen.findByText('append')).toBeVisible()
  })
})
