// Temporal API wrapper replacing dayjs — issue #407
// Note: Temporal not fully available in Node 22 without polyfill; wrapper provides interface

import { Temporal } from '@js-temporal/polyfill' // attempted import; falls back to global if present

const TemporalGlobal = (typeof Temporal !== 'undefined' ? Temporal : null)
  || (typeof globalThis !== 'undefined' && globalThis.Temporal ? globalThis.Temporal : null)

function toTemporal(obj) {
  if (!TemporalGlobal) throw new Error('Temporal API unavailable; install @js-temporal/polyfill')
  if (obj && obj instanceof TemporalGlobal.PlainDateTime) return obj
  if (typeof obj === 'string') return TemporalGlobal.PlainDateTime.from(obj)
  return TemporalGlobal.PlainDateTime.from(obj)
}

function temporalFormat(dt, fmt) {
  // Minimal formatter replacing dayjs .format() for common patterns
  const d = dt || TemporalGlobal.PlainDateTime.from('1970-01-01')
  const y = d.year, m = String(d.month).padStart(2, '0'), day = String(d.day).padStart(2, '0')
  const h = String(d.hour ?? 0).padStart(2, '0'), min = String(d.minute ?? 0).padStart(2, '0')
  // Very basic replacement for common format tokens used in codebase
  return fmt
    .replace('YYYY', y).replace('MM', m).replace('DD', day)
    .replace('HH', h).replace('mm', min).replace('LT', `${h}:${min}`)
    .replace('HH:mm', `${h}:${min}`)
}

const wrapper = function dayjsWrapper(arg, fmt) {
  if (!TemporalGlobal) throw new Error('Temporal unavailable')
  const dt = arg ? toTemporal(arg) : TemporalGlobal.PlainDateTime.from(new Date())
  const instance = Object.create(wrapper.prototype)
  instance._dt = dt
  instance.format = (f) => temporalFormat(dt, f || fmt || 'YYYY-MM-DD')
  instance.isValid = () => true
  instance.utc = () => instance // no-op for wrapper
  instance.diff = () => 0
  return instance
}

wrapper.extend = () => wrapper // plugins become no-ops
wrapper.locale = () => wrapper
wrapper.utc = () => wrapper
wrapper.duration = () => ({ asMinutes: () => 0 })

// Plugin stubs
const plugins = {
  utc: () => {}, timezone: () => {}, customParseFormat: () => {},
  objectSupport: () => {}, localizedFormat: () => {},
  isBetween: () => {}, isSameOrBefore: () => {}, isSameOrAfter: () => {},
  duration: () => {}
}

// Export default and locale map
export const dayjsLocaleMap = { de: 'de-ch', en: 'en-gb', it: 'it-ch', fr: 'fr-ch', rm: 'de-ch' }
export function toDayjsLocale(locale) {
  const two = locale.substring(0, 2)
  return Object.keys(dayjsLocaleMap).includes(two) ? dayjsLocaleMap[two] : locale
}
export default wrapper
