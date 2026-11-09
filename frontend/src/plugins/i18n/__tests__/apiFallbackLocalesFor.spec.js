import { describe, expect, it } from 'vitest'
import { fallbackLocales } from '@/plugins/i18n'
import fallbackLocalesFor from '@/plugins/i18n/apiFallbackLocalesFor'

const defaultFallbacks = fallbackLocales.default

describe('apiFallbackLocales', () => {
  ;[null, undefined, 1, [], {}].forEach((param) => {
    it(`returns default fallbacks if input is not a string, but ${param}`, () => {
      expect([...fallbackLocalesFor(param)]).toStrictEqual([...defaultFallbacks])
    })

    it('returns default fallbacks if string does not contain underscores', () => {
      expect([...fallbackLocalesFor('de')]).toStrictEqual([...defaultFallbacks])
    })

    Object.entries({
      de_CH_scout: ['de_CH', 'de', ...defaultFallbacks],
      de_CH: ['de', ...defaultFallbacks],
      fr_CH_scout: ['fr_CH', 'fr', ...defaultFallbacks],
      fr_CH: ['fr', ...defaultFallbacks],
      it_CH_scout: ['it_CH', 'it', ...defaultFallbacks],
      it_CH: ['it', ...defaultFallbacks],
      en_CH_scout: ['en_CH', 'en', ...defaultFallbacks],
      en_CH: ['en', ...defaultFallbacks],
      rm: ['de', ...defaultFallbacks],
      rm_CH: ['rm', 'de', ...defaultFallbacks],
      rm_CH_scout: ['rm_CH', 'rm', 'de', ...defaultFallbacks],
    }).forEach((entry) => {
      const locale = entry[0]
      const result = entry[1]
      it(`returns correct fallbacks [${result}] for locale ${locale}`, () => {
        expect([...fallbackLocalesFor(locale)]).toStrictEqual(result)
      })
    })
  })
})
