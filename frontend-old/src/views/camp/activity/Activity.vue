<!--
Displays a single activity
-->

<template>
  <v-container fluid>
    <ScheduleEntry
      v-if="!featureCommentsEnabled"
      :activity-id="activityId"
      :schedule-entry-id="scheduleEntryId"
    />
    <Comments v-else :activity-id="activityId">
      <ScheduleEntry :activity-id="activityId" :schedule-entry-id="scheduleEntryId" />
    </Comments>
  </v-container>
</template>

<script>
import ScheduleEntry from '@/components/activity/ScheduleEntry.vue'
import Comments from '@/components/comments/Comments.vue'
import { getEnv } from '@/environment.js'

export default {
  name: 'Activity',
  components: {
    ScheduleEntry,
    Comments,
  },
  props: {
    activityId: {
      type: String,
      required: true,
    },
    scheduleEntryId: {
      type: String,
      default: null,
    },
  },
  computed: {
    featureCommentsEnabled() {
      return getEnv().FEATURE_COMMENTS ?? false
    },
  },
}
</script>
