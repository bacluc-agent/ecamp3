import { describe, expect, test } from 'vitest'
import { mount as mountComponent } from '@vue/test-utils'
import ESelect from '../ESelect.vue'
import { screen } from '@testing-library/vue'
import { setupVuetify } from '/tests/setupVuetify.js'

setupVuetify()

describe('An ESelect', () => {
  const FIRST_OPTION = {
    value: 1,
    text: 'firstOption',
  }
  const SECOND_OPTION = {
    value: '2',
    text: 'secondOption',
  }
  const THIRD_OPTION = {
    value: { key: 'value', array: [1, 2, 3], nestedObject: { key: 'value' } },
    text: 'thirdOption',
  }
  const selectValues = [FIRST_OPTION, SECOND_OPTION, THIRD_OPTION]

  const mount = (options) => {
    const app = {
      components: { ESelect },
      data: function () {
        return {
          selectValues: selectValues,
          data: null,
        }
      },
      template: `
        <div data-app>
          <e-select label="test" :items="selectValues" v-model="data">
            ${options?.children}
          </e-select>
        </div>
      `,
    }
    return mountComponent(app, { attachTo: document.body, ...options })
  }

  test.skip('looks like a dropdown', async () => {
    const wrapper = mount()
    expect(wrapper.html()).toMatchSnapshot('no item selected')

    await wrapper.find('.v-input__slot').trigger('click')
    expect(wrapper.html()).toMatchSnapshot('dropdown open')

    await wrapper.findAll('[role="option"]').at(0).trigger('click')
    expect(wrapper.html()).toMatchSnapshot('dropdown closed with selected value')

    await wrapper.find('.v-input__slot').trigger('click')
    expect(wrapper.html()).toMatchSnapshot('dropdown open with selected value')
  })

  test.skip('update viewmodel with selected value', async () => {
    const wrapper = mount()
    expect(wrapper.vm.data).toBeNull()

    await wrapper.find('.v-input__slot').trigger('click')
    await wrapper.findAll('[role="option"]').at(0).trigger('click')
    expect(wrapper.vm.data).toBe(FIRST_OPTION.value)

    await wrapper.find('.v-input__slot').trigger('click')
    await wrapper.findAll('[role="option"]').at(2).trigger('click')
    expect(wrapper.vm.data).toBe(THIRD_OPTION.value)
  })

  test('update selected value with viewmodel', async () => {
    const wrapper = mount()

    await wrapper.setData({ data: SECOND_OPTION.value })
    expect(wrapper.html()).toContain(SECOND_OPTION.text)
    expect(wrapper.html()).not.toContain(FIRST_OPTION.text)

    await wrapper.setData({ data: FIRST_OPTION.value })
    expect(wrapper.html()).toContain(FIRST_OPTION.text)
    expect(wrapper.html()).not.toContain(SECOND_OPTION.text)
  })

  test.skip('update selected value after it was open', async () => {
    const wrapper = mount()

    await wrapper.find('.v-input__slot').trigger('click')
    await wrapper.findAll('[role="option"]').at(0).trigger('click')
    expect(wrapper.vm.data).toBe(FIRST_OPTION.value)

    await wrapper.setData({ data: SECOND_OPTION.value })
    expect(
      wrapper.findAll('[role="option"]').at(1).element.getAttribute('aria-selected')
    ).toBe('true')
    expect(
      wrapper.findAll('[role="option"]').at(0).element.getAttribute('aria-selected')
    ).not.toBe('true')
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

  test.skip('allows to use the append slot with scope', async () => {
    const textText = 'myTestText'
    const wrapper = mount({
      children: `
        <template #item="{ item, on, attrs }">
          <v-list-item :key="item.text" v-bind="attrs" v-on="on">
            <v-list-item-title>
              {{ item }}
            </v-list-item-title>

            <v-list-item-subtitle>
              ${textText}
            </v-list-item-subtitle>
          </v-list-item>
      </template>
      `,
    })

    await wrapper.find('.v-input__slot').trigger('click')

    expect(await screen.findAllByText(textText)).toHaveLength(3)
  })
})
