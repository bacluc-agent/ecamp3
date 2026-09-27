<!--
Displays all periods of a single camp and allows to edit them & create new ones
-->

<template>
  <content-group
    :title="$t('components.campAdmin.campPeriods.title', camp.periods().items.length)"
    icon="mdi-calendar-multiple"
  >
    <template #title-actions>
      <dialog-period-create v-if="!disabled" :camp="camp">
        <template #activator="{ props }">
          <button-add
            v-bind="props"
            color="blue-grey-darken-2"
            variant="text"
            class="my-n2"
            :hide-label="$vuetify.display.xs"
          >
            {{ $t('components.campAdmin.campPeriods.createPeriod') }}
          </button-add>
        </template>
      </dialog-period-create>
    </template>
    <v-skeleton-loader v-if="camp.periods()._meta.loading" type="article" />
    <v-list class="py-0">
      <period-item
        v-for="period in periods"
        :key="period._meta.self"
        class="px-0"
        :period="period"
        :disabled="disabled"
      />
    </v-list>
  </content-group>
</template>

<script>
import { sortBy } from 'lodash-es'
import ButtonAdd from '@/components/buttons/ButtonAdd.vue'
import PeriodItem from './CampPeriodsListItem.vue'
import DialogPeriodCreate from './DialogPeriodCreate.vue'
import ContentGroup from '@/components/layout/ContentGroup.vue'

export default {
  name: 'CampPeriods',
  components: { ContentGroup, ButtonAdd, PeriodItem, DialogPeriodCreate },
  props: {
    camp: { type: Object, required: true },
    disabled: { type: Boolean, default: false },
  },
  data() {
    return {}
  },
  computed: {
    periods() {
      return sortBy(this.camp.periods().items, (p) => p.start)
    },
  },
}
</script>

<style scoped></style>
