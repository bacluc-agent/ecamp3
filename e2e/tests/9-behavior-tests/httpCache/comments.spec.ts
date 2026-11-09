import { test, expect } from '@playwright/test'
import { bipiUser, bruceWayneUser, skilagerCampId } from '@/utils/constants'
import {
  apiDelete,
  apiGet,
  apiPost,
  expectCacheHit,
  expectCacheMiss,
  getAuthContext,
  waitForCacheMiss,
} from '@/utils/helpers'

/* activity "Snowboardfahren" in camp skilager, has one comment */
const activityId = 'a13fadc97610'
/* activity "Skifahren" in the same camp, not mutated by this test */
const otherActivityId = 'b29d387cc403'

test.describe('cache test: /activities/{activityId}/comments', { tag: '@mature' }, () => {
  test.describe.configure({ mode: 'serial' })

  test('caches /activities/{activityId}/comments separately for each login', async () => {
    const uri = `/api/activities/${activityId}/comments`
    const filteredUri = `${uri}?camp=%2Fcamps%2F${skilagerCampId}`

    const bipiApi = await getAuthContext(bipiUser)

    // first request is a cache miss
    const res1 = await apiGet(bipiApi, uri)
    const headers = res1.headers()
    expect(res1.status()).toBe(200)
    expect(headers['x-cache']).toBe('MISS')
    const items: Array<{ id: string }> = (await res1.json())._embedded?.items ?? []
    expect(items.length).toBeGreaterThan(0)

    // second request is a cache hit
    await expectCacheHit(bipiApi, uri)

    // the query param variant is a separate cache entry carrying the query tags
    const res2 = await apiGet(bipiApi, filteredUri)
    const filteredHeaders = res2.headers()
    expect(res2.status()).toBe(200)
    expect(filteredHeaders['x-cache']).toBe('MISS')
    const xkeyTags = filteredHeaders['xkey'].split(' ')
    expect(xkeyTags).toContain(uri)
    expect(xkeyTags).toContain(`${uri}?`)
    expect(xkeyTags).toContain(`?${skilagerCampId}`)
    await expectCacheHit(bipiApi, filteredUri)

    // request with a new user is a cache miss
    const bruceApi = await getAuthContext(bruceWayneUser)
    await expectCacheMiss(bruceApi, uri)
    await expectCacheMiss(bruceApi, filteredUri)
  })

  test('invalidates /activities/{activityId}/comments on comment create and delete', async () => {
    const uri = `/api/activities/${activityId}/comments`
    const filteredUri = `${uri}?camp=%2Fcamps%2F${skilagerCampId}`
    const excludedEntityUri = `/api/activities/${otherActivityId}/comments?camp=%2Fcamps%2F${skilagerCampId}`

    const bipiApi = await getAuthContext(bipiUser)

    // warm up cache
    await apiGet(bipiApi, uri)
    await expectCacheHit(bipiApi, uri)
    await expectCacheMiss(bipiApi, filteredUri)
    await expectCacheHit(bipiApi, filteredUri)
    const excludedBefore = await apiGet(bipiApi, excludedEntityUri)
    expect(excludedBefore.status()).toBe(200)
    expect(excludedBefore.headers()['x-cache']).toBe('MISS')
    const excludedBeforeItems: Array<{ id: string }> =
      (await excludedBefore.json())._embedded?.items ?? []
    expect(excludedBeforeItems.length).toBeGreaterThan(0)
    await expectCacheHit(bipiApi, excludedEntityUri)

    // add new comment
    const postRes = await apiPost(bipiApi, '/api/comments', {
      camp: `/api/camps/${skilagerCampId}`,
      activity: `/api/activities/${activityId}`,
      textHtml: 'cache invalidation test comment',
    })
    expect(postRes.status()).toBe(201)
    const createdComment = await postRes.json()

    // ensure cache was invalidated
    await waitForCacheMiss(bipiApi, uri)
    await expectCacheHit(bipiApi, uri)
    await waitForCacheMiss(bipiApi, filteredUri)
    await expectCacheHit(bipiApi, filteredUri)
    await waitForCacheMiss(bipiApi, excludedEntityUri)
    await expectCacheHit(bipiApi, excludedEntityUri)

    // the new comment is visible on its own activity
    const mutatedAfter = await apiGet(bipiApi, uri)
    const mutatedItems: Array<{ id: string }> =
      (await mutatedAfter.json())._embedded?.items ?? []
    expect(mutatedItems.some((item) => item.id === createdComment.id)).toBe(true)

    // the new comment is not part of the other activity's comments
    const excludedAfter = await apiGet(bipiApi, excludedEntityUri)
    const excludedAfterItems: Array<{ id: string }> =
      (await excludedAfter.json())._embedded?.items ?? []
    expect(excludedAfterItems.some((item) => item.id === createdComment.id)).toBe(false)

    // delete newly created comment
    await apiDelete(bipiApi, createdComment._links.self.href)

    // ensure cache was invalidated
    await waitForCacheMiss(bipiApi, uri)
    await expectCacheHit(bipiApi, uri)
    await waitForCacheMiss(bipiApi, filteredUri)
    await expectCacheHit(bipiApi, filteredUri)
    await waitForCacheMiss(bipiApi, excludedEntityUri)
    await expectCacheHit(bipiApi, excludedEntityUri)
  })
})
