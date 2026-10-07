import { test, expect } from '@playwright/test'
import { bipiUser, bruceWayneUser, grgrCampId, grgrPeriodId } from '@/utils/constants'
import {
  expectCacheHit,
  expectCacheMiss,
  waitForCacheMiss,
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  getAuthContext,
} from '@/utils/helpers'

const grgrMaterialListId = '6e57f36875d4'
const grgrLeuchtstabMaterialItemId = '01fa888341f6'

test.describe('cache test: material_items subresources', { tag: '@risky' }, () => {
  test.describe.configure({ mode: 'serial' })

  test('caches /camps/{campId}/material_items separately for each login', async () => {
    const uri = `/api/camps/${grgrCampId}/material_items`

    const bipiApi = await getAuthContext(bipiUser)

    // first request is a cache miss, the collection URI is part of the tags
    // (for detecting newly added material items)
    const res1 = await apiGet(bipiApi, uri)
    expect(res1.headers()['x-cache']).toBe('MISS')
    expect(res1.headers()['xkey']).toContain(`/api/camps/${grgrCampId}/material_items`)

    // second request is a cache hit
    await expectCacheHit(bipiApi, uri)

    // request with a new user is a cache miss
    const bruceApi = await getAuthContext(bruceWayneUser)
    await expectCacheMiss(bruceApi, uri)
  })

  test('invalidates the material item collections when adding and removing a material item', async () => {
    const campUri = `/api/camps/${grgrCampId}/material_items`
    const periodUri = `/api/periods/${grgrPeriodId}/material_items`

    const bipiApi = await getAuthContext(bipiUser)

    // warm up caches
    await apiGet(bipiApi, campUri)
    await expectCacheHit(bipiApi, campUri)
    await apiGet(bipiApi, periodUri)
    await expectCacheHit(bipiApi, periodUri)

    // material items of a period are posted to the writable root collection,
    // the parent is carried in the payload
    const postRes = await apiPost(bipiApi, '/api/material_items', {
      quantity: 7,
      unit: 'Stück',
      article: 'Cache Test Lampe',
      materialList: `/api/material_lists/${grgrMaterialListId}`,
      period: `/api/periods/${grgrPeriodId}`,
    })
    expect(postRes.status()).toBe(201)
    const body = await postRes.json()
    const newMaterialItemUri = body._links.self.href
    expect(body._links.camp.href).toBe(`/api/camps/${grgrCampId}`)
    expect(body._links.period.href).toBe(`/api/periods/${grgrPeriodId}`)

    // ensure caches were invalidated
    await waitForCacheMiss(bipiApi, campUri)
    await expectCacheHit(bipiApi, campUri)
    await waitForCacheMiss(bipiApi, periodUri)
    await expectCacheHit(bipiApi, periodUri)

    // delete newly created material item
    await apiDelete(bipiApi, newMaterialItemUri)

    // ensure caches were invalidated
    await waitForCacheMiss(bipiApi, campUri)
    await expectCacheHit(bipiApi, campUri)
    await waitForCacheMiss(bipiApi, periodUri)
    await expectCacheHit(bipiApi, periodUri)
  })

  test('invalidates /camps/{campId}/material_items when changing a material item', async () => {
    const uri = `/api/camps/${grgrCampId}/material_items`
    const materialItemUri = `/api/material_items/${grgrLeuchtstabMaterialItemId}`

    const bipiApi = await getAuthContext(bipiUser)

    // warm up cache
    await apiGet(bipiApi, uri)
    await expectCacheHit(bipiApi, uri)

    // patch an existing material item
    await apiPatch(bipiApi, materialItemUri, { quantity: 21 })

    // ensure cache was invalidated
    await waitForCacheMiss(bipiApi, uri)
    await expectCacheHit(bipiApi, uri)

    // restore original quantity
    await apiPatch(bipiApi, materialItemUri, { quantity: 20 })
    await waitForCacheMiss(bipiApi, uri)
    await expectCacheHit(bipiApi, uri)
  })
})
