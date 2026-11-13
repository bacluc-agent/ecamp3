import { minBy, maxBy, sortBy, keyBy } from 'lodash-es'
import { Temporal } from '@/helpers/temporal.js'
import { arrange } from './scheduleEntryLayout.js'

const unixSeconds = (instant) => Math.floor(instant.epochMilliseconds / 1000)
const diffMinutes = (a, b) =>
  Math.floor((a.epochMilliseconds - b.epochMilliseconds) / 60000)

/**
 * Splits a set of days into pages, such that all pages contain a similar number of days.
 *
 * @param days {array} set of days to split into pages
 * @param maxDaysPerPage {number} maximum number of days to put on one page
 * @returns {array} list of pages, each containing a list of the days on the page
 */
export function splitDaysIntoPages(days, maxDaysPerPage) {
  if (!maxDaysPerPage) return []
  const numberOfDays = days.length
  const numberOfPages = Math.ceil(numberOfDays / maxDaysPerPage)
  const daysPerPage = Math.floor(numberOfDays / numberOfPages)
  const numLargerPages = numberOfDays % numberOfPages
  let nextUnassignedDayIndex = 0

  return [...Array(numberOfPages).keys()].map((i) => {
    const isLargerPage = i < numLargerPages
    const numDaysOnCurrentPage = daysPerPage + (isLargerPage ? 1 : 0)
    const firstDayIndex = nextUnassignedDayIndex
    nextUnassignedDayIndex = firstDayIndex + numDaysOnCurrentPage

    return days.filter((day, index) => {
      return index >= firstDayIndex && index < nextUnassignedDayIndex
    })
  })
}

/**
 * Finds the largest consecutive time period during the night, in which no schedule entries start or end.
 * This time period can be treated as the common "bedtime" in the camp, during which
 * the people in the camp are not active. This time period can be safely hidden on the picasso.
 *
 * @param scheduleEntries set of schedule entries to consider
 * @param firstDayStart UTC ISO date-time string describing the start of the first day displayed. Is used to make sure that schedule
 * entries starting on this day may not be assigned to the preceding day, because that would mean they would become
 * invisible on the picasso
 * @param lastDayEnd UTC ISO date-time string describing the end of the last day displayed. Is used to make sure that schedule
 * entries ending on this day may not be assigned to the following day, because that would mean they would become
 * invisible on the picasso
 * @param timeBucketSize size of the time buckets into which the schedule entry boundaries are quantized, in hours
 * @returns {{bedtime: number, getUpTime: number}}
 */
export function calculateBedtime(
  scheduleEntries,
  firstDayStart,
  lastDayEnd,
  timeBucketSize = 1
) {
  const firstDayStartInstant = Temporal.Instant.from(firstDayStart)
  const lastDayEndInstant = Temporal.Instant.from(lastDayEnd)
  const scheduleEntryBounds = getScheduleEntryBounds(
    scheduleEntries,
    unixSeconds(firstDayStartInstant),
    unixSeconds(lastDayEndInstant)
  )
  if (!scheduleEntryBounds.length) return { bedtime: 24, getUpTime: 0 }

  const gaps = scheduleEntryBounds.reduce((gaps, current, index) => {
    if (index === 0) return gaps
    const previous = scheduleEntryBounds[index - 1]
    const duration = current.hours - previous.hours
    if (duration === 0) return gaps
    gaps.push({
      start: previous.hours,
      end: current.hours,
      duration,
    })
    return gaps
  }, [])

  // The first and last day on our picasso impose some constraints on the range of bedtimes we can choose.
  const { earliestBedtime, latestGetUpTime } = bedtimeConstraintsFromFirstAndLastDay(
    scheduleEntryBounds,
    firstDayStartInstant,
    lastDayEndInstant,
    timeBucketSize
  )

  const largestBedtimeGap = maxBy(
    gaps.filter((gap) => {
      // Prevent bedtimes which would hide some schedule entry on the first or last day
      if (gap.start < earliestBedtime || gap.end > latestGetUpTime) return false
      // Prevent bedtimes which are not during the night
      if (gap.start > 30 || gap.end < 24) return false
      return true
    }),
    (gap) => gap.duration
  )

  return {
    bedtime: optimalBedtime(largestBedtimeGap, scheduleEntryBounds, timeBucketSize),
    getUpTime:
      optimalGetUpTime(largestBedtimeGap, scheduleEntryBounds, timeBucketSize) - 24,
  }
}

function getScheduleEntryBounds(
  scheduleEntries,
  firstDayStartTimestamp,
  lastDayEndTimestamp
) {
  const bounds = scheduleEntries
    .flatMap((scheduleEntry) => {
      const start = Temporal.Instant.from(scheduleEntry.start)
      const end = Temporal.Instant.from(scheduleEntry.end)
      const startUtc = start.toZonedDateTimeISO('UTC')
      const endUtc = end.toZonedDateTimeISO('UTC')
      const startHours = startUtc.hour + startUtc.minute / 60
      const endHours = endUtc.hour + endUtc.minute / 60
      const duration = diffMinutes(end, start) / 60
      return [
        { hours: startHours, time: start, type: 'start', duration },
        { hours: endHours, time: end, type: 'end', duration },
      ]
    })
    .filter(
      (bound) =>
        unixSeconds(bound.time) >= firstDayStartTimestamp &&
        unixSeconds(bound.time) <= lastDayEndTimestamp
    )
  // Add a copy of all bounds 24 hours later, to simplify working with the circular characteristics of daytimes
  const shifted = bounds.map((bound) => ({
    ...bound,
    hours: bound.hours + 24,
    time: bound.time.add({ hours: 24 }),
  }))
  return sortBy([...bounds, ...shifted], (bound) => bound.hours)
}

function bedtimeConstraintsFromFirstAndLastDay(
  scheduleEntryBounds,
  firstDayStart,
  lastDayEnd
) {
  // The start of the very first schedule entry on the first day (if any) must always be displayed on the first day.
  // We must make sure that our calculated "get up time" lies before this, so we do not accidentally hide a
  // schedule entry.
  const latestGetUpTime = earliestScheduleEntryBoundOnFirstDay(
    scheduleEntryBounds,
    firstDayStart
  )

  // Similarly, the end of the very last schedule entry end must always be displayed on the last day.
  // So we must make sure that our calculated "go to bed time" lies after this.
  const earliestBedtime = latestScheduleEntryBoundOnLastDay(
    scheduleEntryBounds,
    lastDayEnd.subtract({ seconds: 1 })
  )

  return {
    earliestBedtime: earliestBedtime === undefined ? 0 : earliestBedtime,
    latestGetUpTime: latestGetUpTime === undefined ? 48 : latestGetUpTime + 24,
  }
}

function earliestScheduleEntryBoundOnFirstDay(scheduleEntryBounds, firstDayStart) {
  const earliestBound = minBy(scheduleEntryBounds, (bound) => unixSeconds(bound.time))
  if (
    earliestBound.hours < 24 &&
    diffMinutes(earliestBound.time, firstDayStart) / 60 < 24
  ) {
    return earliestBound.hours
  }
  return undefined
}

function latestScheduleEntryBoundOnLastDay(scheduleEntryBounds, lastDayEnd) {
  const latestBound = maxBy(scheduleEntryBounds, (bound) => unixSeconds(bound.time))
  if (latestBound.hours < 24 && diffMinutes(lastDayEnd, latestBound.time) / 60 < 24) {
    return latestBound.hours
  }
  return undefined
}

function optimalBedtime(gap, scheduleEntryBounds, timeBucketSize) {
  const bedtime = Math.ceil(gap.start / timeBucketSize) * timeBucketSize
  if (
    scheduleEntryBounds.some(
      (bound) =>
        bound.type === 'start' &&
        bound.hours <= bedtime &&
        bound.hours > bedtime - timeBucketSize / 2 &&
        bound.duration > bedtime - bound.hours
    )
  ) {
    // There exists a schedule entry which starts at the bedtime or less than half a time bucket before it.
    // Move the bedtime later, so that this schedule entry is still clearly visible.
    return bedtime + timeBucketSize
  }
  // There is already a large enough margin, or there are no schedule entries starting around the bedtime.
  return bedtime
}

function optimalGetUpTime(gap, scheduleEntryBounds, timeBucketSize) {
  const getUpTime = Math.floor(gap.end / timeBucketSize) * timeBucketSize
  if (
    scheduleEntryBounds.some(
      (bound) =>
        bound.type === 'end' &&
        bound.hours >= getUpTime &&
        bound.hours < getUpTime + timeBucketSize / 2 &&
        bound.duration > bound.hours - getUpTime
    )
  ) {
    // There exists a schedule entry which ends at the getUpTime or less than half a time bucket after it.
    // Move the getUpTime later, so that this schedule entry is still clearly visible.
    return getUpTime - timeBucketSize
  }
  // There is already a large enough margin, or there are no schedule entries ending around the getUpTime.
  return getUpTime
}

/**
 * Generates an array of time row descriptions, used for labeling the vertical axis of the picasso.
 * Format of each array element: [hour, weight] where weight determines how tall the time row is rendered.
 *
 * @typedef {*[[hour: number, weight: number]]} TimeWeights
 * @returns TimeWeights
 */
export function times(getUpTime, bedTime, timeStep) {
  const times = [[getUpTime - timeStep / 2, 0.5]]
  for (let i = 0; getUpTime + i * timeStep < bedTime; i++) {
    // TODO The weight could also be generated depending on the schedule entries present in the camp:
    //   e.g. give less weight to hours that contain no schedule entries.
    const weight = 1
    times.push([getUpTime + i * timeStep, weight])
  }
  times.push([bedTime, 0.5])
  // this last hour is only needed for defining the length of the day. The weight should be 0.
  times.push([bedTime + timeStep / 2, 0])

  return times
}

/**
 * Returns the total sum of weights in the times array (with times format as generated by times() function)
 */
export function timesWeightsSum(times) {
  return times.reduce((sum, [_, weight]) => sum + weight, 0)
}

/**
 * Calculates the relative positioning in percentage of "milliseconds" within the times array
 */
export function positionPercentage(milliseconds, times) {
  const hours = milliseconds / (3600.0 * 1000)
  let matchingTimeIndex = times.findIndex(([time, _]) => time > hours) - 1
  matchingTimeIndex = Math.min(
    Math.max(matchingTimeIndex === -2 ? times.length : matchingTimeIndex, 0),
    times.length - 1
  )
  const remainder =
    times[matchingTimeIndex][1] !== 0
      ? (hours - times[matchingTimeIndex][0]) / times[matchingTimeIndex][1]
      : 0 // avoid division by zero, in case the schedule entry ends on a later day
  const positionWeightsSum =
    timesWeightsSum(times.slice(0, matchingTimeIndex)) +
    remainder * times[Math.min(matchingTimeIndex, times.length)][1]
  const totalWeightsSum = timesWeightsSum(times)
  if (totalWeightsSum === 0) {
    return 0
  }
  const result = (positionWeightsSum * 100.0) / totalWeightsSum
  return Math.max(0, Math.min(100, result))
}

export function filterScheduleEntriesByDay(scheduleEntries, day, times) {
  const startOfDayMs = Temporal.Instant.from(dayStart(day, times)).epochMilliseconds
  const endOfDayMs = Temporal.Instant.from(dayEnd(day, times)).epochMilliseconds
  return scheduleEntries.filter(
    (scheduleEntry) =>
      Temporal.Instant.from(scheduleEntry.start).epochMilliseconds < endOfDayMs &&
      Temporal.Instant.from(scheduleEntry.end).epochMilliseconds > startOfDayMs
  )
}

/**
 * @param day a day object of the api
 * @param offset {number} the offset hour of the day
 * @returns {string} UTC ISO date-time string
 */
function dayOffset(day, offset) {
  return Temporal.Instant.from(day.start)
    .add({ seconds: offset * 3600 })
    .toString()
}

/**
 * Calculates the day start according to times
 *
 * @param day a day object of the api
 * @param times {TimeWeights}
 * @returns {string} UTC ISO date-time string
 */
export function dayStart(day, times) {
  const dayStart = times[0][0]
  return dayOffset(day, dayStart)
}

/**
 * Calculates the day end according to times
 *
 * @param day a day object of the api
 * @param times {TimeWeights}
 * @returns {string} UTC ISO date-time string
 */
export function dayEnd(day, times) {
  const dayEnd = times[times.length - 1][0]
  return dayOffset(day, dayEnd)
}

function leftAndWith(scheduleEntries) {
  return keyBy(arrange(scheduleEntries), 'id')
}

/**
 * Calculates the positions styles (in percentages) for all scheduleEntries
 */
export function positionStyles(scheduleEntries, day, times) {
  const leftAndWidth = leftAndWith(scheduleEntries)
  const dayStartMs = Temporal.Instant.from(day.start).epochMilliseconds

  return keyBy(
    scheduleEntries.map((scheduleEntry) => {
      const left = leftAndWidth[scheduleEntry.id]?.left || 0
      const width = leftAndWidth[scheduleEntry.id]?.width || 0
      const top = positionPercentage(
        Temporal.Instant.from(scheduleEntry.start).epochMilliseconds - dayStartMs,
        times
      )
      const bottom =
        100 -
        positionPercentage(
          Temporal.Instant.from(scheduleEntry.end).epochMilliseconds - dayStartMs,
          times
        )
      return {
        id: scheduleEntry.id,
        top: top + '%',
        bottom: bottom + '%',
        left: left + '%',
        right: 100 - width - left + '%',
        percentageHeight: 100 - bottom - top,
      }
    }),
    'id'
  )
}
