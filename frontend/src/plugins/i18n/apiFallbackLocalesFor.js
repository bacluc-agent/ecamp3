import { fallbackLocales } from '@/plugins/i18n/index'

export default function* (locale) {
  if (typeof locale !== 'string') {
    if (Array.isArray(fallbackLocales.default)) {
      for (const fallback of fallbackLocales.default) {
        yield fallback
      }
    } else {
      yield fallbackLocales.default
    }
    return
  }
  if (fallbackLocales[locale]) {
    for (const fallback of fallbackLocales[locale]) {
      yield fallback
    }
  }
  const parts = locale.split('_')
  for (let i = parts.length - 1; i > 0; i--) {
    const implicitFallback = parts.slice(0, i).join('_')
    yield implicitFallback
    if (fallbackLocales[implicitFallback]) {
      for (const fallback of fallbackLocales[implicitFallback]) {
        yield fallback
      }
    }
  }
  if (Array.isArray(fallbackLocales.default)) {
    for (const fallback of fallbackLocales.default) {
      yield fallback
    }
  } else {
    yield fallbackLocales.default
  }
}
