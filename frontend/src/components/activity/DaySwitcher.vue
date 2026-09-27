<template>
  <v-list-item v-if="loading" class="pl-4 pr-0" height="48" inactive>
    <template #prepend>
      <v-skeleton-loader
        type="text"
        width="3ch"
        class="v-skeleton-loader--no-margin mr-2"
      />
    </template>
    <template #title>
      <v-skeleton-loader
        type="text"
        class="basis-auto flex-shrink-0 v-skeleton-loader--no-margin"
      />
    </template>
    <template #append>
      <v-skeleton-loader
        type="avatar"
        width="28"
        height="28"
        class="v-skeleton-loader--no-margin v-skeleton-loader--inherit-size ml-6 mr-1"
      />
      <v-icon>mdi-menu-down</v-icon>
    </template>
  </v-list-item>
  <e-select
    v-else
    name="day-switcher"
    :model-value="daySelection.number"
    :items="items"
    density="comfortable"
    item-value="number"
    variant="underlined"
    return-object
    :menu-props="{
      offsetY: true,
      contentClass: 'ec-day-switcher__menu',
      maxHeight: 'min(400px, calc(100vh - 32px))',
    }"
    class="ec-day-switcher"
    input-class="ec-day-switcher__select mt-0 pt-0"
    @update:model-value="changeDay"
  >
    <template #selection="{ index, item }">
      <v-list-item
        v-if="index === 0"
        class="pl-4 pr-0 w-100"
        :title="null"
        height="48"
        inactive
      >
        <template #prepend>
          <strong class="basis-num mr-2">{{ item.title }}.</strong>
        </template>
        <template #subtitle>
          {{ $date.utc(daySelection.start).format('dd. DD. MMM') }}
        </template>
        <template #append>
          <AvatarRow
            :camp-collaborations="
              daySelection
                .dayResponsibles()
                .items.map((responsible) => responsible.campCollaboration())
            "
            min-size="28"
            max-size="28"
          />
        </template>
      </v-list-item>
    </template>
    <template #item="{ item, props }">
      <v-list-item v-bind="props" :title="null">
        <template #prepend>
          <strong class="basis-num mr-2">{{ item.raw.number }}.</strong>
        </template>
        <template #subtitle>
          {{ $date.utc(item.raw.start).format('dd. DD. MMM') }}
        </template>
        <template #append>
          <AvatarRow
            :camp-collaborations="
              item.raw
                .dayResponsibles()
                .items.map((responsible) => responsible.campCollaboration())
            "
            min-size="28"
            max-size="28"
          />
        </template>
      </v-list-item>
    </template>
  </e-select>
</template>
<script>
import AvatarRow from '@/components/generic/AvatarRow.vue'
import { toRaw } from 'vue'
import { reduce, sortBy } from 'lodash-es'

export default {
  name: 'DaySwitcher',
  components: { AvatarRow },
  props: {
    camp: { type: Object, required: true },
    daySelection: { type: Object, required: true },
    loading: { type: Boolean },
  },
  emits: ['changeDay'],
  computed: {
    items() {
      return reduce(
        this.periods,
        (result, period, index) => {
          if (index > 0) {
            result.push({ type: 'divider' })
          }
          if (this.periods.length > 1) {
            result.push({
              type: 'subheader',
              title: period.description,
              text: period.description,
            })
          }
          result.push(...sortBy(period.days().items, 'number'))
          return result
        },
        []
      )
    },
    periods() {
      return sortBy(this.camp.periods().items, 'start')
    },
  },
  methods: {
    changeDay(value) {
      this.$emit('changeDay', toRaw(value))
    },
  },
}
</script>

<!-- these styles should apply to inner elements -->
<!-- eslint-disable-next-line vue-scoped-css/enforce-style-type -->
<style>
.basis-num {
  width: 2.5ch;
}
/* .ec-day-switcher__menu is in the <e-select> tag */
/*noinspection CssUnusedSymbol*/
.ec-day-switcher__menu {
  transform: translateX(-12px);
}
/*noinspection CssUnusedSymbol*/
.ec-day-switcher__select {
  --v-input-padding-top: 0;
}
</style>

<style scoped>
.ec-day-switcher__select :deep(.v-field) {
  --v-field-padding-end: 0;
}

/* .v-select__selection is in an inner tag */
/*noinspection CssUnusedSymbol*/
.ec-day-switcher :deep(.v-select__selection) {
  width: 100%;
}

/* .v-field__append-inner is in an inner tag */
/*noinspection CssUnusedSymbol*/
.ec-day-switcher :deep(.v-field__append-inner) {
  align-items: center;
}
</style>
