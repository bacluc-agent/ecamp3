import { test, expect } from '@playwright/test'
import { bruceWayneUser, loremIpsumCampId } from '@/utils/constants'
import {
  getAuthContext,
  expectCacheHit,
  expectCacheMiss,
  waitForCacheMiss,
  apiGet,
  apiPatch,
} from '@/utils/helpers'

const collectionUri = `/api/camps/${loremIpsumCampId}/activities`
// `camp` is a configured ApiFilter on Activity, `page` is not (pagination is disabled
// app-wide). Both are part of the cache key, which is what is under test here.
const filteredUri = `${collectionUri}?camp=%2Fcamps%2F${loremIpsumCampId}&page=1`
const reversedUri = `${collectionUri}?page=1&camp=%2Fcamps%2F${loremIpsumCampId}`
const activityId = '3d1e5c91ceb2'

test.describe('cache test: collection with query params', { tag: '@mature' }, () => {
  test.describe.configure({ mode: 'serial' })

  test('caches a filtered url and tags it like the unfiltered one', async () => {
    const bruceApi = await getAuthContext(bruceWayneUser)

    // first request is a cache miss
    const filtered = await apiGet(bruceApi, filteredUri)
    expect(filtered.headers()['x-cache']).toBe('MISS')
    // the tag is the collection iri, without the query string
    expect(filtered.headers()['xkey']).toContain(collectionUri)

    // second request is a cache hit
    await expectCacheHit(bruceApi, filteredUri)

    // the unfiltered url is cached separately and carries exactly the same tags
    const unfiltered = await apiGet(bruceApi, collectionUri)
    expect(unfiltered.headers()['x-cache']).toBe('MISS')
    expect(unfiltered.headers()['xkey']).toBe(filtered.headers()['xkey'])
  })

  test('caches the same params in a different order as a separate entry', async () => {
    const bruceApi = await getAuthContext(bruceWayneUser)

    await apiGet(bruceApi, filteredUri)
    await expectCacheHit(bruceApi, filteredUri)

    // query params are not sorted, so this is a different cache entry
    await expectCacheMiss(bruceApi, reversedUri)
    await expectCacheHit(bruceApi, reversedUri)
  })

  test('invalidates every variant of the collection on activity patch', async () => {
    const bruceApi = await getAuthContext(bruceWayneUser)

    // bring data into defined state
    await apiPatch(bruceApi, `/api/activities/${activityId}`, {
      title: 'Breakfast',
    })

    // warm up both variants
    await apiGet(bruceApi, collectionUri)
    await expectCacheHit(bruceApi, collectionUri)
    await apiGet(bruceApi, filteredUri)
    await expectCacheHit(bruceApi, filteredUri)

    // touch activity
    await apiPatch(bruceApi, `/api/activities/${activityId}`, {
      title: 'Frühstück',
    })

    // ensure both variants were invalidated; the first poll of each re-warms it
    await waitForCacheMiss(bruceApi, collectionUri)
    await expectCacheHit(bruceApi, collectionUri)
    await waitForCacheMiss(bruceApi, filteredUri)
    await expectCacheHit(bruceApi, filteredUri)
  })
})
