<template>
  <e-form name="period">
    <e-text-field
      :model-value="localPeriod.description"
      path="description"
      vee-rules="required"
      @update:model-value="localPeriod.description = $event"
    />

    <e-date-picker
      :model-value="localPeriod.start"
      path="start"
      vee-rules="required"
      :max="localPeriod.end"
      @update:model-value="localPeriod.start = $event"
    />

    <e-date-picker
      :min="localPeriod.start"
      :model-value="localPeriod.end"
      path="end"
      vee-rules="required|greaterThanOrEqual_date:@start"
      @update:model-value="localPeriod.end = $event"
    />
  </e-form>
</template>

<script>
export default {
  name: 'DialogPeriodForm',
  props: {
    period: { type: Object, required: true },
  },
  data() {
    return {
      localPeriod: this.period,
    }
  },
}
</script>
