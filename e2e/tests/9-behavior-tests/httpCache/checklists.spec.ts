import { test, expect } from '@playwright/test'
import { bipiUser, castorUser, basiskursCampId } from '@/utils/constants'
import {
  getAuthContext,
  expectCacheHit,
  expectCacheMiss,
  expectCachePass,
  waitForCacheMiss,
  apiGet,
  apiPatch,
  apiPost,
  apiDelete,
} from '@/utils/helpers'
import collectionResponse from '@/test-data/httpCache/checklists_collection.json'

const collectionXKeys =
  /* campCollaboration for bipiUser */
  '146c0608237f ' +
  /* checklist entry */
  'ebbd0c61eb85 ebbd0c61eb85#camp ' +
  /* collection URI (for detecting addition of new checklists) */
  '/api/camps/5d28f99890bc/checklists'

test.describe('cache test: /camps/checklists', { tag: '@mature' }, () => {
  test.describe.configure({ mode: 'serial' })

  test('caches /camp/{campId}/checklists separately for each login', async () => {
    const uri = `/api/camps/${basiskursCampId}/checklists`
    const filteredUri = `${uri}?isPrototype=true`

    const bipiApi = await getAuthContext(bipiUser)

    // first request is a cache miss
    const res1 = await apiGet(bipiApi, uri)
    const headers = res1.headers()
    expect(headers['xkey']).toBe(collectionXKeys)
    expect(headers['x-cache']).toBe('MISS')
    expect(await res1.json()).toEqual(collectionResponse)

    // second request is a cache hit
    await expectCacheHit(bipiApi, uri)

    // the query param variant is a separate cache entry
    await expectCacheMiss(bipiApi, filteredUri)
    await expectCacheHit(bipiApi, filteredUri)

    // request with a new user is a cache miss
    const castorApi = await getAuthContext(castorUser)
    await expectCacheMiss(castorApi, uri)
    await expectCacheMiss(castorApi, filteredUri)
  })

  test('does not cache a queried checklist item', async () => {
    const checklistId = 'ebbd0c61eb85'
    const uri = `/api/checklists/${checklistId}?camp=%2Fcamps%2F${basiskursCampId}`
    const bipiApi = await getAuthContext(bipiUser)

    const response = await apiGet(bipiApi, uri)
    expect((await response.json())._links.self.href).toMatch(
      new RegExp(`/checklists/${checklistId}$`)
    )
    await expectCachePass(bipiApi, uri)
  })

  test('invalidates /camp/{campId}/checklists on checklist patch', async () => {
    const uri = `/api/camps/${basiskursCampId}/checklists`
    const filteredUri = `${uri}?isPrototype=true`
    const excludedEntityUri = `${uri}?isPrototype=true&camp=%2Fcamps%2F${basiskursCampId}`

    // bring data into defined state
    const bipiApi = await getAuthContext(bipiUser)
    await apiPatch(bipiApi, '/api/checklists/ebbd0c61eb85', {
      name: 'Training targets',
    })

    // warm up cache
    await apiGet(bipiApi, uri)
    await expectCacheHit(bipiApi, uri)
    await apiGet(bipiApi, filteredUri)
    await expectCacheHit(bipiApi, filteredUri)
    const excludedEntity = await apiGet(bipiApi, excludedEntityUri)
    expect(excludedEntity.headers()['x-cache']).toBe('MISS')
    const filteredItems: Array<{ id: string }> =
      (await excludedEntity.json())._embedded?.items ?? []
    expect(filteredItems.some((item) => item.id === 'ebbd0c61eb85')).toBe(false)
    await expectCacheHit(bipiApi, excludedEntityUri)

    // touch checklist
    await apiPatch(bipiApi, '/api/checklists/ebbd0c61eb85', {
      name: 'Ausbildungsziele',
    })

    // ensure cache was invalidated
    await waitForCacheMiss(bipiApi, uri)
    await expectCacheHit(bipiApi, uri)
    await waitForCacheMiss(bipiApi, filteredUri)
    await expectCacheHit(bipiApi, filteredUri)
    await waitForCacheMiss(bipiApi, excludedEntityUri)
    await expectCacheHit(bipiApi, excludedEntityUri)
    const excludedItemsAfterMutation: Array<{ id: string }> =
      (await (await apiGet(bipiApi, excludedEntityUri)).json())._embedded?.items ?? []
    expect(excludedItemsAfterMutation.some((item) => item.id === 'ebbd0c61eb85')).toBe(
      false
    )
  })

  test('invalidates /camp/{campId}/checklists for new checklist', async () => {
    const uri = `/api/camps/${basiskursCampId}/checklists`
    const filteredUri = `${uri}?isPrototype=true`
    const excludedEntityUri = `${uri}?isPrototype=true&camp=%2Fcamps%2F${basiskursCampId}`

    const bipiApi = await getAuthContext(bipiUser)

    // warm up cache
    await apiGet(bipiApi, uri)
    await expectCacheHit(bipiApi, uri)
    await apiGet(bipiApi, filteredUri)
    await expectCacheHit(bipiApi, filteredUri)
    await expectCacheMiss(bipiApi, excludedEntityUri)
    await expectCacheHit(bipiApi, excludedEntityUri)

    // add new checklist to camp
    const postRes = await apiPost(bipiApi, '/api/checklists', {
      camp: `/api/camps/${basiskursCampId}`,
      name: 'new_checklist',
    })
    const body = await postRes.json()
    const newChecklistUri = body._links.self.href
    const newChecklistId = newChecklistUri.split('/').pop()

    // ensure cache was invalidated
    await waitForCacheMiss(bipiApi, uri)
    await expectCacheHit(bipiApi, uri)
    await waitForCacheMiss(bipiApi, filteredUri)
    await expectCacheHit(bipiApi, filteredUri)
    await waitForCacheMiss(bipiApi, excludedEntityUri)
    await expectCacheHit(bipiApi, excludedEntityUri)
    const excludedChecklistsAfterPost: Array<{ id: string }> =
      (await (await apiGet(bipiApi, excludedEntityUri)).json())._embedded?.items ?? []
    expect(excludedChecklistsAfterPost.some((item) => item.id === newChecklistId)).toBe(
      false
    )

    // delete newly created checklist
    await apiDelete(bipiApi, newChecklistUri)

    // ensure cache was invalidated
    await waitForCacheMiss(bipiApi, uri)
    await expectCacheHit(bipiApi, uri)
    await waitForCacheMiss(bipiApi, filteredUri)
    await expectCacheHit(bipiApi, filteredUri)
    await waitForCacheMiss(bipiApi, excludedEntityUri)
    await expectCacheHit(bipiApi, excludedEntityUri)
  })
})
