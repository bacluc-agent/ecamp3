import { describe, expect, it, vi } from 'vitest'
import MaterialTable from '@/components/material/MaterialTable.vue'

const makeContext = (overrides) => {
  const $post = vi.fn().mockResolvedValue({})
  return {
    $post,
    context: {
      api: {
        get: vi.fn(() => ({ materialItems: () => ({ $post }) })),
        reload: vi.fn(),
      },
      materialItemCollection: { _meta: { self: '/material-items' } },
      period: null,
      materialNode: null,
      newMaterialItems: { key: { materialList: {} } },
      toast: { error: vi.fn() },
      ...overrides,
    },
  }
}

describe('MaterialTable', () => {
  describe('postToApi()', () => {
    it('posts to the writable root collection with the period as parent', async () => {
      const { $post, context } = makeContext({
        period: { _meta: { self: '/periods/1' } },
      })

      await MaterialTable.methods.postToApi.call(context, 'key', {
        quantity: '2',
        unit: 'kg',
        article: 'rope',
      })

      expect(context.api.get).toHaveBeenCalledWith()
      expect($post).toHaveBeenCalledWith({
        quantity: '2',
        unit: 'kg',
        article: 'rope',
        period: '/periods/1',
      })
    })

    it('posts to the writable root collection with the material node as parent', async () => {
      const { $post, context } = makeContext({
        materialNode: { _meta: { self: '/content-nodes/2' } },
      })

      await MaterialTable.methods.postToApi.call(context, 'key', {
        quantity: '1',
        unit: 'l',
        article: 'water',
      })

      expect(context.api.get).toHaveBeenCalledWith()
      expect($post).toHaveBeenCalledWith({
        quantity: '1',
        unit: 'l',
        article: 'water',
        materialNode: '/content-nodes/2',
      })
    })
  })
})
