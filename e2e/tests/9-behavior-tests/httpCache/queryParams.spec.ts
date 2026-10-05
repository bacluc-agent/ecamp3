import { test, expect } from '@playwright/test'
import { bruceWayneUser, loremIpsumCampId } from '@/utils/constants'
import { getAuthContext, expectCacheHit, expectCacheMiss, apiGet } from '@/utils/helpers'

const collectionUri = `/api/camps/${loremIpsumCampId}/activities`
const filteredUri = `${collectionUri}?camp=%2Fcamps%2F${loremIpsumCampId}&page=1`
const reversedUri = `${collectionUri}?page=1&camp=%2Fcamps%2F${loremIpsumCampId}`
const activityId = '3d1e5c91ceb2'

test.describe('cache test: collection with query params', () => {
  test.describe.configure({ mode: 'serial' })

  test('caches the same params in a different order as a separate entry', async () => {
    const bruceApi = await getAuthContext(bruceWayneUser)

    await apiGet(bruceApi, filteredUri)
    await expectCacheHit(bruceApi, filteredUri)

    await expectCacheMiss(bruceApi, reversedUri)
    await expectCacheHit(bruceApi, reversedUri)
  })

  test('caches query-string item URLs for every configured item matcher', async () => {
    const bruceApi = await getAuthContext(bruceWayneUser)
    const itemUris = [
      `/api/activities/${activityId}?page=1`,
      '/api/content_types/a4211c11211c?page=1',
      '/api/periods/76be24bce434/schedule_entries/29c9e9a07d82?page=1',
      '/api/periods/76be24bce434/days/4b90ff5b42c0?page=1',
      '/api/camps/70ca971c992f/categories/1a869b162875?page=1',
    ]

    for (const uri of itemUris) {
      const response = await apiGet(bruceApi, uri)
      expect(response.headers()['x-cache'], uri).toBe('MISS')
      await expectCacheHit(bruceApi, uri)
    }
  })
})
