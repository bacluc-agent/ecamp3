import { test, expect } from '@playwright/test'
import collectionResponse from '@/test-data/httpCache/content_types_collection.json'
import itemResponse from '@/test-data/httpCache/content_types_entity.json'
import { bipiUser, castorUser, grgrCampId } from '@/utils/constants'
import {
  expectCacheHit,
  expectCacheMiss,
  waitForCacheMiss,
  apiGet,
  apiPost,
  apiDelete,
  getAuthContext,
} from '@/utils/helpers'

const collectionXKeys =
  'a4211c11211c f17470519474 1a0f84e322c8 c462edd869f3 5e2028c55ee4 3ef17bd1df72 4f0c657fecef a4211c112939 44dcc7493c65 cfccaecd4bad 318e064ea0c9 /api/content_types'

test.describe('cache test: /content-types', { tag: '@mature' }, () => {
  test.describe.configure({ mode: 'serial' })

  test('caches collection separately for each login', async () => {
    const uri = '/api/content_types'
    const queryUri = `${uri}?name=Checklist`

    const bipiApi = await getAuthContext(bipiUser)

    // first request is a cache miss
    const res1 = await apiGet(bipiApi, uri)
    const headers = res1.headers()
    expect(headers['xkey']).toBe(collectionXKeys)
    expect(headers['x-cache']).toBe('MISS')
    expect(await res1.json()).toEqual(collectionResponse)

    // second request is a cache hit
    await expectCacheHit(bipiApi, uri)
    await expectCacheMiss(bipiApi, queryUri)
    await expectCacheHit(bipiApi, queryUri)

    // request with a new user is a cache miss
    const castorApi = await getAuthContext(castorUser)
    await expectCacheMiss(castorApi, uri)
  })

  test('caches collection with query params and tags it for invalidation', async () => {
    const uri = '/api/content_types'
    const queryUri = `${uri}?name=ColumnLayout`

    const bipiApi = await getAuthContext(bipiUser)

    const res1 = await apiGet(bipiApi, queryUri)
    const headers = res1.headers()
    expect(headers['x-cache']).toBe('MISS')
    const xkeyTags = headers['xkey'].split(' ')
    expect(xkeyTags).toContain(`${uri}?`)

    await expectCacheHit(bipiApi, queryUri)
  })

  test('caches item', async () => {
    const contentTypeId = '318e064ea0c9'
    const uri = `/api/content_types/${contentTypeId}`
    const queryUri = `${uri}?name=Checklist`

    const bipiApi = await getAuthContext(bipiUser)

    // first request is a cache miss
    const res1 = await apiGet(bipiApi, uri)
    const headers = res1.headers()
    expect(headers['xkey']).toBe(contentTypeId)
    expect(headers['x-cache']).toBe('MISS')
    expect(await res1.json()).toEqual(itemResponse)

    // second request is a cache hit
    await expectCacheHit(bipiApi, uri)
    await expectCacheMiss(bipiApi, queryUri)
    await expectCacheHit(bipiApi, queryUri)
  })

  test('invalidates /content_types when a category with preferredContentTypes is created', async () => {
    const uri = '/api/content_types'
    const queryUri = `${uri}?name=Checklist`

    const bipiApi = await getAuthContext(bipiUser)

    // warm up cache
    await apiGet(bipiApi, uri)
    await expectCacheHit(bipiApi, uri)
    await apiGet(bipiApi, queryUri)
    await expectCacheHit(bipiApi, queryUri)

    // content types are read-only via the API; creating a category with
    // preferredContentTypes is the API-triggered mutation that purges /content_types?
    // (api/tests/Api/Categories/CreateCategoryTest.php testCreateCategoryPurgesCacheTags)
    const postRes = await apiPost(bipiApi, '/api/categories', {
      camp: `/api/camps/${grgrCampId}`,
      short: 'ctc',
      name: 'content type cache',
      color: '#000000',
      numberingStyle: '1',
      preferredContentTypes: ['/api/content_types/a4211c11211c'],
    })
    expect(postRes.status()).toBe(201)
    const newCategoryUri = (await postRes.json())._links.self.href

    // ensure cache was invalidated (mutated entity is not in the name filter)
    await waitForCacheMiss(bipiApi, uri)
    await expectCacheHit(bipiApi, uri)
    await waitForCacheMiss(bipiApi, queryUri)
    await expectCacheHit(bipiApi, queryUri)

    // delete newly created category
    const delRes = await apiDelete(bipiApi, newCategoryUri)
    expect(delRes.status()).toBe(204)

    // ensure cache was invalidated
    await waitForCacheMiss(bipiApi, uri)
    await expectCacheHit(bipiApi, uri)
    await waitForCacheMiss(bipiApi, queryUri)
    await expectCacheHit(bipiApi, queryUri)
  })
})
