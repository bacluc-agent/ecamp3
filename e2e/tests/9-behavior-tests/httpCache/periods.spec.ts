import { test, expect } from '@playwright/test'
import { bipiUser, bruceWayneUser, grgrCampId } from '@/utils/constants'
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

const newPeriod = {
  camp: `/api/camps/${grgrCampId}`,
  start: '2036-06-01',
  end: '2036-06-04',
  description: 'Cache Test Period',
}

test.describe('cache test: /camps/{campId}/periods', { tag: '@mature' }, () => {
  test.describe.configure({ mode: 'serial' })

  test('caches /camps/{campId}/periods separately for each login', async () => {
    const uri = `/api/camps/${grgrCampId}/periods`

    const bipiApi = await getAuthContext(bipiUser)

    // first request is a cache miss, the collection URI is part of the tags
    // (for detecting newly added periods)
    const res1 = await apiGet(bipiApi, uri)
    expect(res1.headers()['x-cache']).toBe('MISS')
    expect(res1.headers()['xkey']).toContain(`/api/camps/${grgrCampId}/periods`)

    // second request is a cache hit
    await expectCacheHit(bipiApi, uri)

    // request with a new user is a cache miss
    const bruceApi = await getAuthContext(bruceWayneUser)
    await expectCacheMiss(bruceApi, uri)
  })

  test('invalidates /camps/{campId}/periods when adding and removing a period', async () => {
    const uri = `/api/camps/${grgrCampId}/periods`

    const bipiApi = await getAuthContext(bipiUser)

    // warm up cache
    await apiGet(bipiApi, uri)
    await expectCacheHit(bipiApi, uri)

    // add new period to camp
    const postRes = await apiPost(bipiApi, '/api/periods', newPeriod)
    expect(postRes.status()).toBe(201)
    const newPeriodUri = (await postRes.json())._links.self.href

    // ensure cache was invalidated
    await waitForCacheMiss(bipiApi, uri)
    await expectCacheHit(bipiApi, uri)

    // delete newly created period
    await apiDelete(bipiApi, newPeriodUri)

    // ensure cache was invalidated
    await waitForCacheMiss(bipiApi, uri)
    await expectCacheHit(bipiApi, uri)
  })

  test('invalidates /camps/{campId}/periods when changing a period', async () => {
    const uri = `/api/camps/${grgrCampId}/periods`

    const bipiApi = await getAuthContext(bipiUser)

    // add a period to change
    const postRes = await apiPost(bipiApi, '/api/periods', newPeriod)
    expect(postRes.status()).toBe(201)
    const newPeriodUri = (await postRes.json())._links.self.href

    // warm up cache
    await apiGet(bipiApi, uri)
    await expectCacheHit(bipiApi, uri)

    // move period dates
    await apiPatch(bipiApi, newPeriodUri, {
      start: '2036-06-02',
      end: '2036-06-05',
    })

    // ensure cache was invalidated
    await waitForCacheMiss(bipiApi, uri)
    await expectCacheHit(bipiApi, uri)

    // delete newly created period
    await apiDelete(bipiApi, newPeriodUri)

    // ensure cache was invalidated
    await waitForCacheMiss(bipiApi, uri)
    await expectCacheHit(bipiApi, uri)
  })
})
