import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { setupVuetify } from '/tests/setupVuetify.js'
import CampPeriodsListItem from '../CampPeriodsListItem.vue'

setupVuetify()

let wrapper

afterEach(() => {
  wrapper?.unmount()
  document.body.innerHTML = ''
})

const DialogEntityDeleteStub = {
  name: 'DialogEntityDelete',
  props: {
    entity: { type: Object, required: true },
    submitEnabled: { type: Boolean, required: true },
  },
  emits: ['closed'],
  template: '<div class="delete-dialog"><slot /></div>',
}

function createPeriod({
  periodCount = 2,
  scheduleEntryCount = 0,
  materialItemCount = 0,
} = {}) {
  return {
    _meta: { self: '/periods/1', loading: false },
    description: 'Sommerlager',
    start: '2022-07-01T00:00:00+00:00',
    end: '2022-07-10T00:00:00+00:00',
    camp: () => ({ periods: () => ({ items: Array.from({ length: periodCount }) }) }),
    scheduleEntries: () => ({ items: Array.from({ length: scheduleEntryCount }) }),
    materialItems: () => ({ items: Array.from({ length: materialItemCount }) }),
  }
}

function mountItem(period) {
  const $t = vi.fn((key, named) =>
    named?.count === undefined ? key : `${key}:${named.count}`
  )
  wrapper = mount(CampPeriodsListItem, {
    props: { period },
    global: {
      mocks: { $t },
      stubs: {
        VMenu: { template: '<div><slot /></div>' },
        DialogPeriodDescriptionEdit: true,
        DialogPeriodDateEdit: true,
        DialogEntityDelete: DialogEntityDeleteStub,
      },
    },
  })
  return { $t }
}

function deleteDialog() {
  return wrapper.findComponent('.delete-dialog')
}

describe('CampPeriodsListItem deletion prompt', () => {
  it('shows the description, explanation and current counts', async () => {
    const { $t } = mountItem(
      createPeriod({ scheduleEntryCount: 2, materialItemCount: 3 })
    )
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('components.campAdmin.campPeriodsListItem.deleteWarning')
    expect(text).toContain('Sommerlager')
    expect(text).toContain(
      'components.campAdmin.campPeriodsListItem.deletePeriod.explanation'
    )
    expect(text).toContain(
      'components.campAdmin.campPeriodsListItem.scheduleEntriesWarning:2'
    )
    expect(text).toContain(
      'components.campAdmin.campPeriodsListItem.materialItemsWarning:3'
    )
    expect($t).toHaveBeenCalledWith(
      'components.campAdmin.campPeriodsListItem.scheduleEntriesWarning',
      { count: 2 },
      2
    )
    expect($t).toHaveBeenCalledWith(
      'components.campAdmin.campPeriodsListItem.materialItemsWarning',
      { count: 3 },
      3
    )
  })

  it('enables submission only for the exact period description', async () => {
    mountItem(createPeriod())
    await flushPromises()

    expect(deleteDialog().props('submitEnabled')).toBe(false)

    for (const promptText of ['Sommerlager ', 'sommerlager']) {
      await wrapper.setData({ promptText })
      expect(deleteDialog().props('submitEnabled')).toBe(false)
    }

    await wrapper.setData({ promptText: 'Sommerlager' })
    expect(deleteDialog().props('submitEnabled')).toBe(true)
  })

  it('never enables submission for the last period', async () => {
    mountItem(createPeriod({ periodCount: 1 }))
    await flushPromises()

    expect(wrapper.text()).toContain(
      'components.campAdmin.campPeriodsListItem.lastPeriodNotDeletable'
    )
    expect(wrapper.find('input').exists()).toBe(false)

    await wrapper.setData({ promptText: 'Sommerlager' })
    expect(deleteDialog().props('submitEnabled')).toBe(false)
  })

  it('resets the prompt when the delete dialog closes', async () => {
    mountItem(createPeriod())
    await flushPromises()

    await wrapper.find('input').setValue('Sommerlager')
    expect(deleteDialog().props('submitEnabled')).toBe(true)

    deleteDialog().vm.$emit('closed')
    await nextTick()

    expect(wrapper.vm.promptText).toBe('')
    expect(wrapper.find('input').element.value).toBe('')
    expect(deleteDialog().props('submitEnabled')).toBe(false)
  })
})
