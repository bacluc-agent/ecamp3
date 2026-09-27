<template>
  <v-list>
    <v-list-item :to="materialListRoute(camp, '/all', { isDetail: true })" exact-path>
      <v-list-item-content>
        {{ $tc('components.material.materialLists.overview') }}
      </v-list-item-content>
      <v-list-item-icon>
        <v-icon color="blue-grey lighten-3">mdi-chevron-right</v-icon>
      </v-list-item-icon>
    </v-list-item>
    <v-list-item
      v-if="unassignedCount > 0"
      :to="materialListRoute(camp, '/unassigned', { isDetail: true })"
      exact-path
    >
      <v-list-item-content>
        <v-list-item-title>
          <span class="italic">{{
            $tc('components.material.materialLists.unassigned')
          }}</span>
        </v-list-item-title>
        <v-list-item-subtitle
          >{{
            $tc('components.material.materialLists.materialsCount', unassignedCount, {
              count: unassignedCount,
            })
          }}
        </v-list-item-subtitle>
      </v-list-item-content>
      <v-list-item-icon>
        <v-icon color="blue-grey lighten-3">mdi-chevron-right</v-icon>
      </v-list-item-icon>
    </v-list-item>
    <v-skeleton-loader v-if="materialLists._meta.loading" type="list-item@3" />
    <v-list-item
      v-for="materialList in materailListsSorted"
      :key="materialList._meta.self"
      :to="materialListRoute(camp, materialList, { isDetail: true })"
      exact-path
    >
      <v-list-item-content>
        <v-list-item-title>{{ materialList.name }}</v-list-item-title>
        <v-list-item-subtitle
          >{{
            $tc(
              'components.material.materialLists.materialsCount',
              materialList.itemCount,
              {
                count: materialList.itemCount,
              }
            )
          }}
        </v-list-item-subtitle>
      </v-list-item-content>
      <v-list-item-icon>
        <v-icon color="blue-grey lighten-3">mdi-chevron-right</v-icon>
      </v-list-item-icon>
    </v-list-item>
  </v-list>
</template>

<script>
import { materialListRoute } from '@/router.js'
import materialListsSorted from '@/common/helpers/materialListsSorted.js'

export default {
  name: 'MaterialLists',
  props: {
    camp: { type: Object, required: true },
  },
  computed: {
    materialLists() {
      return this.camp.materialLists()
    },
    allMaterialItems() {
      return this.camp.periods().items.flatMap((period) => period.materialItems().items)
    },
    materailListsSorted() {
      return materialListsSorted(this.materialLists.allItems)
    },
    unassignedCount() {
      if (this.allMaterialItems.length === 0 || this.materialLists._meta.loading) {
        return 0
      }
      return (
        this.allMaterialItems.length -
        this.materialLists.items.reduce((sum, list) => {
          return sum + list.itemCount
        }, 0)
      )
    },
  },
  mounted() {
    this.materialLists.$loadItems()
  },
  methods: {
    materialListRoute,
  },
}
</script>
