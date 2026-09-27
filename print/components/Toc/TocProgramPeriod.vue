<template>
  <li>
    {{ $t('entity.period.name') }} {{ period.description }}

    <ul>
      <generic-error-message v-if="error" :error="error" />
      <toc-program-day
        v-for="day in days"
        v-else
        :key="day.id"
        :day="day"
        :filter="filter"
        :index="index"
      />
    </ul>
  </li>
</template>

<script setup>
import { filterMatchScheduleEntry } from '@/common/helpers/filterMatchScheduleEntry.js'

const props = defineProps({
  index: { type: Number, required: true },
  period: { type: Object, required: true },
  filter: { type: Object, default: () => ({}) },
})

const { data: days, error } = await useAsyncData(
  `TocProgramPeriod-${props.period._meta.self}`,
  async () => {
    await Promise.all([
      props.period.days().$loadItems(),
      props.period.scheduleEntries().$loadItems(),
    ])

    return props.period.days().items.filter((day) => {
      return (
        props.period
          .scheduleEntries()
          .items.filter(
            (scheduleEntry) =>
              scheduleEntry.day()._meta.self === day._meta.self &&
              filterMatchScheduleEntry(scheduleEntry, props.filter)
          ).length > 0
      )
    })
  }
)
</script>
