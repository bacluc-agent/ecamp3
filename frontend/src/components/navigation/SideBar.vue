<template>
  <v-navigation-drawer
    v-if="$vuetify.display.smAndUp"
    :model-value="true"
    app
    :order="!mini && !$vuetify.display.mdAndUp ? -1 : 0"
    scrim
    :permanent="!(!mini && !$vuetify.display.mdAndUp)"
    :temporary="!mini && !$vuetify.display.mdAndUp"
    :width="$vuetify.display.xl || (!mini && !$vuetify.display.mdAndUp) ? 350 : 256"
    :rail.sync="mini"
    rail-width="40"
    :color="!title || mini ? 'blue-grey-lighten-4' : null"
    @update:model-value="drawer = $event"
  >
    <v-list class="py-0">
      <v-btn
        v-if="mini"
        variant="text"
        slim
        class="py-1"
        min-width="40"
        height="56"
        @click.stop="overrideExpanded = true"
      >
        <v-icon>{{ icon }}</v-icon>
      </v-btn>
      <v-list-item v-else class="py-1 pr-2">
        <v-list-item-title class="text-subtitle-1 font-weight-bold">
          {{ title }}
        </v-list-item-title>
        <template #append>
          <v-btn icon variant="text" @click.stop="overrideExpanded = false">
            <v-icon>mdi-chevron-left</v-icon>
          </v-btn>
        </template>
      </v-list-item>
    </v-list>
    <v-divider />
    <slot v-if="!mini" />
  </v-navigation-drawer>
</template>

<script>
export default {
  name: 'SideBar',
  props: {
    title: { type: String, required: true },
    icon: { type: String, default: 'mdi-format-list-bulleted-type' },
  },
  data() {
    return {
      drawer: false,
      overrideExpanded: null,
    }
  },
  computed: {
    mini() {
      return this.overrideExpanded !== null
        ? !this.overrideExpanded
        : !this.$vuetify.display.mdAndUp
    },
  },
}
</script>

<style scoped></style>
