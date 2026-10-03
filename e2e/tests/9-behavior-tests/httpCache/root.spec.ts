import {
  API_ROOT_URL_CACHED,
  expectCacheHit,
  expectCacheMiss,
  expectCachePass,
  loginAndSetCookie,
} from '@/utils/helpers'
import { expect, test } from '@playwright/test'

const user1 = 'test@example.com'
const user2 = 'castor@example.com'

test('caches the root endpoint', { tag: '@mature' }, async ({ browser }) => {
  const uri = '/api/index'

  // Create context for user 1
  const context1 = await browser.newContext()
  const page1 = await context1.newPage()
  await loginAndSetCookie(page1, context1, user1)

  await expectCacheMiss(context1.request, uri)
  await expectCacheHit(context1.request, uri)

  await context1.close()

  // Create context for user 2
  const context2 = await browser.newContext()
  const page2 = await context2.newPage()
  await loginAndSetCookie(page2, context2, user2)

  await expectCacheMiss(context2.request, uri)
  await context2.close()
})

test(
  'passes root endpoints with query params',
  { tag: '@mature' },
  async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await loginAndSetCookie(page, context, user1)

    await expectCachePass(context.request, '/api/index?x=1')

    for (const uri of ['/api/index?x=1', '/api/index.jsonhal?x=1', '/api/?x=1']) {
      const response = await context.request.get(`${API_ROOT_URL_CACHED}${uri}`, {
        headers: { Accept: 'application/hal+json' },
      })
      expect(response.headers()['x-cache']).toBe('PASS')
      expect(response.headers()['xkey']).toBeUndefined()
      expect(response.headers()['cache-control']).toBe('no-cache, private')
    }

    await context.close()
  }
)
