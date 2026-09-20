import { test, expect } from '@playwright/test'
import { bipiUser, grgrCampId, skilagerCampId } from '@/utils/constants'
import {
  getAuthContext,
  expectCacheHit,
  expectCacheMiss,
  waitForCacheMiss,
  apiGet,
  apiPost,
  apiDelete,
} from '@/utils/helpers'

test.describe('cache test: query params', { tag: '@mature' }, () => {
  test.describe.configure({ mode: 'serial' })

  test('caches filtered collection urls separately from the unfiltered url', async () => {
    const filteredUri = `/api/camps/${skilagerCampId}/activities?name=Snow`
    const unfilteredUri = `/api/camps/${skilagerCampId}/activities`

    const bipiApi = await getAuthContext(bipiUser)

    // first request is a cache miss and is tagged with the base collection iri
    const request = await apiGet(bipiApi, filteredUri)
    const headers = request.headers()
    expect(headers['x-cache']).toBe('MISS')
    expect(headers['xkey']).toContain(unfilteredUri)

    // second request is a cache hit
    await expectCacheHit(bipiApi, filteredUri)

    // the unfiltered url is a separate cache entry
    await expectCacheMiss(bipiApi, unfilteredUri)
    await expectCacheHit(bipiApi, unfilteredUri)
  })

  test('caches urls with reversed query param order separately', async () => {
    const uri1 = `/api/camps/${skilagerCampId}/activities?name=Snow&title=Test`
    const uri2 = `/api/camps/${skilagerCampId}/activities?title=Test&name=Snow`

    const bipiApi = await getAuthContext(bipiUser)

    // warm up the first variant
    await expectCacheMiss(bipiApi, uri1)
    await expectCacheHit(bipiApi, uri1)

    // the reversed param order is a separate cache entry
    await expectCacheMiss(bipiApi, uri2)
    await expectCacheHit(bipiApi, uri2)
  })

  test('invalidates filtered and unfiltered collection urls on write', async () => {
    const unfilteredUri = `/api/camps/${grgrCampId}/activities`
    const filteredUri = `/api/camps/${grgrCampId}/activities?name=Snow`

    const bipiApi = await getAuthContext(bipiUser)

    // warm up cache
    await apiGet(bipiApi, unfilteredUri)
    await expectCacheHit(bipiApi, unfilteredUri)
    await apiGet(bipiApi, filteredUri)
    await expectCacheHit(bipiApi, filteredUri)

    // add new activity to camp
    const postRes = await apiPost(bipiApi, '/api/activities', {
      title: 'New_activity',
      category: '/api/categories/1a869b162875',
      scheduleEntries: [
        {
          period: '/periods/76be24bce434',
          start: '2036-05-10T08:00:00+00:00',
          end: '2036-05-10T09:00:00+00:00',
        },
      ],
    })
    const body = await postRes.json()
    const newActivityUri = body._links.self.href

    // ensure both cache entries were invalidated
    await waitForCacheMiss(bipiApi, unfilteredUri)
    await waitForCacheMiss(bipiApi, filteredUri)

    // delete newly created activity
    await apiDelete(bipiApi, newActivityUri)

    // ensure both cache entries were invalidated again
    await waitForCacheMiss(bipiApi, unfilteredUri)
    await waitForCacheMiss(bipiApi, filteredUri)
  })
})
