<template>
  <v-container fluid>
    <content-card :title="$t('views.camp.material.materialUnassigned.title')" toolbar>
      <template #title-actions>
        <v-menu offset-y>
          <template #activator="{ props }">
            <v-btn icon v-bind="props">
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list class="py-0">
            <v-list-item @click="downloadFilteredXlsx">
              <template #prepend>
                <v-icon>mdi-microsoft-excel</v-icon>
              </template>
              {{ $t('global.button.download') }}
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
      <v-expansion-panels
        v-if="filteredCollection.length > 1"
        v-model="openPeriods"
        multiple
        flat
        variant="accordion"
      >
        <PeriodMaterialLists
          v-for="{ period, materialItems } in filteredCollection"
          :key="period._meta.self"
          :period="period"
          :material-item-collection="materialItems"
        />
      </v-expansion-panels>
      <v-card-text v-else-if="filteredCollection.length === 1">
        <MaterialTable
          v-for="{ period, materialItems } in filteredCollection"
          :key="period._meta.self"
          :camp="camp"
          :material-item-collection="materialItems"
          :period="period"
          disabled
        />
      </v-card-text>
    </content-card>
  </v-container>
</template>

<script>
import ContentCard from '@/components/layout/ContentCard.vue'
import MaterialTable from '@/components/material/MaterialTable.vue'
import PeriodMaterialLists from '@/components/material/PeriodMaterialLists.vue'
import { campRoleMixin } from '@/mixins/campRoleMixin.js'
import { useMaterialViewHelper } from '@/components/material/useMaterialViewHelper.js'

export default {
  name: 'MaterialUnassigned',
  components: {
    ContentCard,
    MaterialTable,
    PeriodMaterialLists,
  },
  mixins: [campRoleMixin],
  props: {
    camp: { type: Object, required: true },
  },
  setup(props) {
    return useMaterialViewHelper(props.camp, null)
  },
  head() {
    return {
      title: this.$t('views.camp.material.materialUnassigned.title'),
    }
  },
  computed: {
    filteredCollection() {
      return this.collection.map(({ period, materialItems }) => {
        return {
          period,
          materialItems: {
            items: materialItems.items.filter((item) => {
              return item.materialList === null
            }),
            _meta: {
              loading: materialItems._meta.loading,
            },
          },
        }
      })
    },
  },
  methods: {
    downloadFilteredXlsx() {
      this.downloadMaterialList(
        this.camp,
        { value: this.filteredCollection },
        this.$t('views.camp.material.materialUnassigned.excelTitle')
      )()
    },
  },
}
</script>
