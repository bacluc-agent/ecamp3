import { describe, expect, it } from 'vitest'
import MaterialLists from '@/components/material/MaterialLists.vue'

const materialItem = (id) => ({ _meta: { self: `/material_items/${id}` } })

const createContext = () => {
  const materialLists = {
    _meta: { loading: false },
    items: [{ _meta: { self: '/material_lists/1' }, itemCount: 1 }],
  }

  return {
    camp: {
      periods: () => ({
        items: [{ materialItems: () => ({ items: [materialItem(1)] }) }],
      }),
      materialItems: () => ({ allItems: [materialItem(1), materialItem(2)] }),
      materialLists: () => materialLists,
    },
    materialLists,
  }
}

describe('MaterialLists', () => {
  it('counts unassigned items from the camp subresource, not from the period subresources', () => {
    const context = createContext()
    context.allMaterialItems = MaterialLists.computed.allMaterialItems.call(context)

    expect(context.allMaterialItems).toHaveLength(2)
    expect(MaterialLists.computed.unassignedCount.call(context)).toBe(1)
  })
})
