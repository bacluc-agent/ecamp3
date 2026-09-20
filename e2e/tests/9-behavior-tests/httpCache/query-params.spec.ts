import { test, expect } from '@playwright/test'
import {
  bipiUser,
  grgrCampId,
  skilagerCampId,
  basiskursCampId,
  grgrPeriodId,
  skilagerPeriodId,
} from '@/utils/constants'
import {
  getAuthContext,
  expectCacheHit,
  expectCacheMiss,
  waitForCacheMiss,
  apiGet,
  apiPost,
  apiDelete,
  apiPatch,
} from '@/utils/helpers'

test.describe('cache test: query params', () => {
  test.describe.configure({ mode: 'serial' })

  test('caches filtered activities url separately from the unfiltered url', async () => {
    const filteredUri = `/api/camps/${skilagerCampId}/activities?camp=/api/camps/${skilagerCampId}`
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

  test('caches filtered categories url separately from the unfiltered url', async () => {
    const filteredUri = `/api/camps/${grgrCampId}/categories?camp=/api/camps/${grgrCampId}`
    const unfilteredUri = `/api/camps/${grgrCampId}/categories`

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

  test('caches filtered checklists url separately from the unfiltered url', async () => {
    const filteredUri = `/api/camps/${basiskursCampId}/checklists?isPrototype=false`
    const unfilteredUri = `/api/camps/${basiskursCampId}/checklists`

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

  test('caches filtered content_types url separately from the unfiltered url', async () => {
    const filteredUri = '/api/content_types?name=Checklist'
    const unfilteredUri = '/api/content_types'

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

  test('caches filtered days url separately from the unfiltered url', async () => {
    const filteredUri = `/api/periods/${grgrPeriodId}/days?period=/api/periods/${grgrPeriodId}`
    const unfilteredUri = `/api/periods/${grgrPeriodId}/days`

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

  test('caches filtered schedule_entries url separately from the unfiltered url', async () => {
    const filteredUri = `/api/periods/${skilagerPeriodId}/schedule_entries?activity=/api/activities/a13fadc97610`
    const unfilteredUri = `/api/periods/${skilagerPeriodId}/schedule_entries`

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
    const uri1 = `/api/periods/${skilagerPeriodId}/schedule_entries?period=/api/periods/${skilagerPeriodId}&activity=/api/activities/a13fadc97610`
    const uri2 = `/api/periods/${skilagerPeriodId}/schedule_entries?activity=/api/activities/a13fadc97610&period=/api/periods/${skilagerPeriodId}`

    const bipiApi = await getAuthContext(bipiUser)

    // warm up the first variant
    await expectCacheMiss(bipiApi, uri1)
    await expectCacheHit(bipiApi, uri1)

    // the reversed param order is a separate cache entry
    await expectCacheMiss(bipiApi, uri2)
    await expectCacheHit(bipiApi, uri2)
  })

  test('invalidates filtered and unfiltered activities urls on write', async () => {
    const filteredUri = `/api/camps/${grgrCampId}/activities?camp=/api/camps/${grgrCampId}`
    const unfilteredUri = `/api/camps/${grgrCampId}/activities`

    const bipiApi = await getAuthContext(bipiUser)

    // warm up cache
    await apiGet(bipiApi, filteredUri)
    await expectCacheHit(bipiApi, filteredUri)
    await apiGet(bipiApi, unfilteredUri)
    await expectCacheHit(bipiApi, unfilteredUri)

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
    await waitForCacheMiss(bipiApi, filteredUri)
    await waitForCacheMiss(bipiApi, unfilteredUri)

    // delete newly created activity
    await apiDelete(bipiApi, newActivityUri)

    // ensure both cache entries were invalidated again
    await waitForCacheMiss(bipiApi, filteredUri)
    await waitForCacheMiss(bipiApi, unfilteredUri)
  })

  test('invalidates filtered and unfiltered categories urls on write', async () => {
    const filteredUri = `/api/camps/${grgrCampId}/categories?camp=/api/camps/${grgrCampId}`
    const unfilteredUri = `/api/camps/${grgrCampId}/categories`

    const bipiApi = await getAuthContext(bipiUser)

    // warm up cache
    await apiGet(bipiApi, filteredUri)
    await expectCacheHit(bipiApi, filteredUri)
    await apiGet(bipiApi, unfilteredUri)
    await expectCacheHit(bipiApi, unfilteredUri)

    // add new category to camp
    const postRes = await apiPost(bipiApi, '/api/categories', {
      camp: `/api/camps/${grgrCampId}`,
      short: 'new',
      name: 'new Category',
      color: '#000000',
      numberingStyle: '1',
    })
    const body = await postRes.json()
    const newCategoryUri = body._links.self.href

    // ensure both cache entries were invalidated
    await waitForCacheMiss(bipiApi, filteredUri)
    await waitForCacheMiss(bipiApi, unfilteredUri)

    // delete newly created category
    await apiDelete(bipiApi, newCategoryUri)

    // ensure both cache entries were invalidated again
    await waitForCacheMiss(bipiApi, filteredUri)
    await waitForCacheMiss(bipiApi, unfilteredUri)
  })

  test('invalidates filtered and unfiltered checklists urls on write', async () => {
    const filteredUri = `/api/camps/${basiskursCampId}/checklists?isPrototype=false`
    const unfilteredUri = `/api/camps/${basiskursCampId}/checklists`

    const bipiApi = await getAuthContext(bipiUser)

    // warm up cache
    await apiGet(bipiApi, filteredUri)
    await expectCacheHit(bipiApi, filteredUri)
    await apiGet(bipiApi, unfilteredUri)
    await expectCacheHit(bipiApi, unfilteredUri)

    // add new checklist to camp
    const postRes = await apiPost(bipiApi, '/api/checklists', {
      camp: `/api/camps/${basiskursCampId}`,
      name: 'new_checklist',
    })
    const body = await postRes.json()
    const newChecklistUri = body._links.self.href

    // ensure both cache entries were invalidated
    await waitForCacheMiss(bipiApi, filteredUri)
    await waitForCacheMiss(bipiApi, unfilteredUri)

    // delete newly created checklist
    await apiDelete(bipiApi, newChecklistUri)

    // ensure both cache entries were invalidated again
    await waitForCacheMiss(bipiApi, filteredUri)
    await waitForCacheMiss(bipiApi, unfilteredUri)
  })

  test('invalidates filtered and unfiltered schedule_entries urls on write', async () => {
    const filteredUri = `/api/periods/${grgrPeriodId}/schedule_entries?period=/api/periods/${grgrPeriodId}`
    const unfilteredUri = `/api/periods/${grgrPeriodId}/schedule_entries`

    const bipiApi = await getAuthContext(bipiUser)

    // warm up cache
    await apiGet(bipiApi, filteredUri)
    await expectCacheHit(bipiApi, filteredUri)
    await apiGet(bipiApi, unfilteredUri)
    await expectCacheHit(bipiApi, unfilteredUri)

    // add new schedule entry to period
    const postRes = await apiPost(bipiApi, '/api/schedule_entries', {
      start: '2036-05-10T10:00:00+00:00',
      end: '2036-05-10T11:00:00+00:00',
      period: `/api/periods/${grgrPeriodId}`,
      activity: '/api/activities/ffd08c52288c',
    })
    const body = await postRes.json()
    const newScheduleEntryUri = body._links.self.href

    // ensure both cache entries were invalidated
    await waitForCacheMiss(bipiApi, filteredUri)
    await waitForCacheMiss(bipiApi, unfilteredUri)

    // delete newly created schedule entry
    await apiDelete(bipiApi, newScheduleEntryUri)

    // ensure both cache entries were invalidated again
    await waitForCacheMiss(bipiApi, filteredUri)
    await waitForCacheMiss(bipiApi, unfilteredUri)
  })

  test('invalidates filtered and unfiltered days urls on write', async () => {
    const filteredUri = `/api/periods/${grgrPeriodId}/days?period=/api/periods/${grgrPeriodId}`
    const unfilteredUri = `/api/periods/${grgrPeriodId}/days`

    const bipiApi = await getAuthContext(bipiUser)

    // warm up cache
    await apiGet(bipiApi, filteredUri)
    await expectCacheHit(bipiApi, filteredUri)
    await apiGet(bipiApi, unfilteredUri)
    await expectCacheHit(bipiApi, unfilteredUri)

    // move period start date
    await apiPatch(bipiApi, `/api/periods/${grgrPeriodId}`, {
      start: '2036-05-09',
      end: '2036-05-12',
      moveScheduleEntries: true,
    })

    // ensure both cache entries were invalidated
    await waitForCacheMiss(bipiApi, filteredUri)
    await waitForCacheMiss(bipiApi, unfilteredUri)

    // move period start date back
    await apiPatch(bipiApi, `/api/periods/${grgrPeriodId}`, {
      start: '2036-05-10',
      end: '2036-05-13',
      moveScheduleEntries: true,
    })

    // ensure both cache entries were invalidated again
    await waitForCacheMiss(bipiApi, filteredUri)
    await waitForCacheMiss(bipiApi, unfilteredUri)
  })
})
