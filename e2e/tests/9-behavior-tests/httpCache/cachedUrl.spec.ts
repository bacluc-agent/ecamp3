import { expect, test } from '@playwright/test'
import { API_ROOT_URL_CACHED, cachedUrl } from '@/utils/helpers'

test('inserts the HAL extension without truncating query parameters', () => {
  expect(cachedUrl('/activities?camp=%2Fcamps%2F1&page=2')).toBe(
    `${API_ROOT_URL_CACHED}/activities.jsonhal?camp=%2Fcamps%2F1&page=2`
  )
  expect(cachedUrl('/activities?search=a?b&sort=name')).toBe(
    `${API_ROOT_URL_CACHED}/activities.jsonhal?search=a?b&sort=name`
  )
})
