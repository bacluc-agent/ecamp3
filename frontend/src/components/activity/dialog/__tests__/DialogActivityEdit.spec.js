import { describe, expect, it, vi } from 'vitest'
import DialogActivityEdit from '@/components/activity/dialog/DialogActivityEdit.vue'

const makeContext = () => {
  const $post = vi.fn().mockResolvedValue({ _meta: { self: '/schedule-entries/1' } })
  return {
    $post,
    context: {
      api: {
        get: vi.fn(() => ({ scheduleEntries: () => ({ $post }) })),
        patch: vi.fn().mockResolvedValue({}),
        del: vi.fn().mockResolvedValue({}),
      },
      activity: { _meta: { self: '/activities/1' } },
      entityUri: '/activities/1',
      entityData: {
        title: 'Cooking',
        location: null,
        category: null,
        scheduleEntries: [
          {
            period: () => ({ _meta: { self: '/periods/1' } }),
            start: '2026-07-01T10:00:00+00:00',
            end: '2026-07-01T11:00:00+00:00',
          },
        ],
      },
      hideHeaderFields: false,
      updatedSuccessful: vi.fn(),
      onError: vi.fn(),
      $emit: vi.fn(),
      _events: {},
    },
  }
}

describe('DialogActivityEdit', () => {
  describe('updateActivity()', () => {
    it('creates new schedule entries on the writable root collection', async () => {
      const { $post, context } = makeContext()

      await DialogActivityEdit.methods.updateActivity.call(context)

      expect(context.api.get).toHaveBeenCalledWith()
      expect($post).toHaveBeenCalledWith({
        period: '/periods/1',
        start: '2026-07-01T10:00:00+00:00',
        end: '2026-07-01T11:00:00+00:00',
        activity: '/activities/1',
      })
    })
  })
})
