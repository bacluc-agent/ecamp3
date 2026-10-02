// vitest.config.ts
import { configDefaults } from 'vitest/config'
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    environmentOptions: {
      // ponytail: hard-code h3 v1 for the test environment. The dev-only ESLint config
      // inspector chain (@eslint/config-inspector -> devframe / @devframes/agentic) needs
      // h3 2.x, and any lock file maintenance can hoist it to the top level, where
      // @nuxt/test-utils auto-detects h3 v2 and imports the optional peer `h3-next`,
      // which npm never installs - then every vitest worker dies with
      // Could not resolve "h3-next/generic". print itself runs h3 v1 (nitro,
      // unstorage, listhen, @nuxtjs/i18n and @nuxtjs/tailwindcss all require
      // h3 ^1.15.11), so v1 is what the tests must exercise. Remove this block once
      // the inspector chain stops forcing an h3 2.x hoist.
      nuxt: {
        h3Version: 1,
      },
    },
    exclude: ['node_modules/**', 'common/**'],
    coverage: {
      include: ['test/**/*'],
      exclude: [...(configDefaults.coverage.exclude || []), '**/.nuxt/**', 'test/**'],
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
    },
  },
})
