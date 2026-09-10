import { describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setupVuetify } from '/tests/setupVuetify.js'
import ChecklistDetail from '@/components/checklist/ChecklistDetail.vue'

setupVuetify()

vi.mock('@/router.js', () => ({
  checklistRoute: vi.fn(() => ({ name: 'camp/admin/checklists' })),
}))

const currentUser = { _meta: { self: '/users/me' } }

function collaboration(role) {
  return {
    _meta: { loading: false },
    role,
    user: () => currentUser,
  }
}

function camp(role) {
  return {
    _meta: { self: '/camps/1' },
    campCollaborations: () => ({ items: [collaboration(role)] }),
  }
}

const checklist = {
  _meta: { self: '/checklists/1' },
  name: 'Test Checkliste',
  checklistItems: () => ({ items: [] }),
}

function mountDetail(role) {
  return mount(ChecklistDetail, {
    props: {
      camp: camp(role),
      checklist,
    },
    global: {
      mocks: {
        $t: (key) => key,
        $store: { getters: { getLoggedInUser: currentUser } },
        api: {
          get: () => ({
            contentNodes: () => ({ $loadItems: vi.fn().mockResolvedValue() }),
          }),
        },
      },
      stubs: {
        ContentCard: {
          template:
            '<div><slot name="title" /><slot name="title-actions" /><slot /></div>',
        },
        ChecklistItemCreate: true,
        SortableChecklist: {
          name: 'SortableChecklist',
          template: '<div />',
          props: ['disabled'],
        },
        ApiForm: true,
        DialogEntityDelete: true,
      },
    },
  })
}

describe('ChecklistDetail', () => {
  it('is read-only for a guest', async () => {
    const wrapper = mountDetail('guest')
    await flushPromises()

    expect(wrapper.vm.debouncedDisabled).toBe(true)
    expect(wrapper.find('.visible-on-hover').exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'SortableChecklist' }).props('disabled')).toBe(
      true
    )
  })

  it('is editable for a member', async () => {
    const wrapper = mountDetail('member')
    await flushPromises()

    expect(wrapper.vm.debouncedDisabled).toBe(false)
    expect(wrapper.find('.visible-on-hover').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'SortableChecklist' }).props('disabled')).toBe(
      false
    )
  })
})
