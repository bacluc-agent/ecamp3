import { test, expect } from '@playwright/test'
import {
  loginWithOAuth,
  withOAuthSession,
  getProfileEmail,
  type OAuthProvider,
} from '@/utils/oauthHelpers'

test.describe('OAuth login', () => {
  const providers: OAuthProvider[] = ['Google', 'MiData', 'CeviDB', 'JublaDB']

  for (const provider of providers) {
    test(
      `${provider}: shows camp list after login`,
      { tag: '@mature' },
      async ({ page }) => {
        await loginWithOAuth(page, provider, 'test@example.com')
        await expect(page).toHaveURL('/camps')
      }
    )
  }
})

test.describe('OAuth login – account re-use', () => {
  test(
    'Google: second login returns the same account',
    { tag: '@mature' },
    async ({ browser }) => {
      const email1 = await withOAuthSession(
        browser,
        'Google',
        'admin@example.com',
        getProfileEmail
      )
      const email2 = await withOAuthSession(
        browser,
        'Google',
        'admin@example.com',
        getProfileEmail
      )
      expect(email2).toBe(email1)
    }
  )
})

test.describe('OAuth login – cross-provider account linking', () => {
  test(
    'Google and MiData with the same email link to the same account',
    { tag: '@mature' },
    async ({ browser }) => {
      const email1 = await withOAuthSession(
        browser,
        'Google',
        'test2@example.com',
        getProfileEmail
      )
      const email2 = await withOAuthSession(
        browser,
        'MiData',
        'test2@example.com',
        getProfileEmail
      )
      expect(email2).toBe(email1)
    }
  )

  test(
    'CeviDB and JublaDB with the same email link to the same account',
    { tag: '@mature' },
    async ({ browser }) => {
      const email1 = await withOAuthSession(
        browser,
        'CeviDB',
        'test2@example.com',
        getProfileEmail
      )
      const email2 = await withOAuthSession(
        browser,
        'JublaDB',
        'test2@example.com',
        getProfileEmail
      )
      expect(email2).toBe(email1)
    }
  )
})

test.describe('OAuth login – separate users', () => {
  test(
    'two different usernames produce two different accounts',
    { tag: '@mature' },
    async ({ browser }) => {
      const email1 = await withOAuthSession(
        browser,
        'Google',
        'test@example.com',
        getProfileEmail
      )
      const email2 = await withOAuthSession(
        browser,
        'Google',
        'test2@example.com',
        getProfileEmail
      )
      expect(email1).not.toBe(email2)
    }
  )
})

import { type Browser, type Page } from '@playwright/test'
// Aliased because the byte-identical import block above already binds `test`
// (from `@playwright/test`) and `OAuthProvider` (from `@/utils/oauthHelpers`).
import { test as poTest } from '@/utils/etest'
import {
  LoginPage,
  type OAuthProvider as PoOAuthProvider,
} from '@/utils/fixtures/pageObjects/loginPage'
import { OAuthProfilePage } from '@/utils/fixtures/pageObjects/oauthProfilePage'

// Free functions rather than a third page-object module: they orchestrate a
// whole browser session instead of wrapping locators, they own no `loaded()`
// gate, and `@boxedStep` would deepen the existing
// `boxedStep -> etest -> loginPage -> boxedStep` cycle. Not in
// `@/utils/helpers.ts` either: 13 specs import `loginAndSetCookie` from there.
// `inOAuthSession` is not named `withOAuthSession` because the import block
// above already binds that name to the helper from `@/utils/oauthHelpers`.
async function inOAuthSession<T>(
  browser: Browser,
  provider: PoOAuthProvider,
  username: string,
  fn: (page: Page) => Promise<T>
): Promise<T> {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  try {
    const loginPage = new LoginPage(page)
    await loginPage.open()
    await loginPage.loginWithOAuth(provider, username)
    return await fn(page)
  } finally {
    await ctx.close()
  }
}

// Reads the email from the *session* page, not the `page` fixture: only the
// context created by `inOAuthSession` carries the OAuth cookie.
async function profileEmail(page: Page): Promise<string> {
  const profilePage = new OAuthProfilePage(page)
  await profilePage.open()
  return await profilePage.emailValue()
}

const providers: PoOAuthProvider[] = ['Google', 'MiData', 'CeviDB', 'JublaDB']

for (const provider of providers) {
  poTest(
    `${provider}: shows camp list after login via page objects`,
    async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.open()
      await loginPage.loginWithOAuth(provider, 'test@example.com')
      await expect(page).toHaveURL('/camps')
    }
  )
}

poTest(
  'Google: second login returns the same account via page objects',
  async ({ browser }) => {
    const email1 = await inOAuthSession(
      browser,
      'Google',
      'admin@example.com',
      profileEmail
    )
    const email2 = await inOAuthSession(
      browser,
      'Google',
      'admin@example.com',
      profileEmail
    )
    expect(email2).toBe(email1)
  }
)

poTest(
  'Google and MiData with the same email link to the same account via page objects',
  async ({ browser }) => {
    const email1 = await inOAuthSession(
      browser,
      'Google',
      'test2@example.com',
      profileEmail
    )
    const email2 = await inOAuthSession(
      browser,
      'MiData',
      'test2@example.com',
      profileEmail
    )
    expect(email2).toBe(email1)
  }
)

poTest(
  'CeviDB and JublaDB with the same email link to the same account via page objects',
  async ({ browser }) => {
    const email1 = await inOAuthSession(
      browser,
      'CeviDB',
      'test2@example.com',
      profileEmail
    )
    const email2 = await inOAuthSession(
      browser,
      'JublaDB',
      'test2@example.com',
      profileEmail
    )
    expect(email2).toBe(email1)
  }
)

poTest(
  'two different usernames produce two different accounts via page objects',
  async ({ browser }) => {
    const email1 = await inOAuthSession(
      browser,
      'Google',
      'test@example.com',
      profileEmail
    )
    const email2 = await inOAuthSession(
      browser,
      'Google',
      'test2@example.com',
      profileEmail
    )
    expect(email1).not.toBe(email2)
  }
)
