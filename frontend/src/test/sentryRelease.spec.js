import { expect, it } from 'vitest'
import { sentryRelease } from '@/sentryRelease.js'

it('uses the Sentry release name from the frontend build', () => {
  expect(sentryRelease).toBe(process.env.SENTRY_RELEASE_NAME || 'development')
})
