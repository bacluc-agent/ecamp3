<template>
  <div class="w-100">
    <template
      v-for="{ checklist, selectedItems } in checklists.filter(
        ({ selectedItems }) => selectedItems.length > 0
      )"
      :key="checklist._meta.self"
    >
      <h3 class="px-4">{{ checklist.name }}</h3>
      <v-list-item
        v-for="{ item, parents } in selectedItems"
        :key="item._meta.self"
        class="min-h-0 d-grid"
        :disabled="layoutMode"
      >
        <v-list-item-subtitle v-if="parents.length > 0" class="d-flex gap-1">
          <template v-for="(parent, index) in parents" :key="parent._meta.self">
            <span v-if="index">/</span>
            <span class="e-checklist-item-parent-name">{{ parent.text }}</span>
          </template>
        </v-list-item-subtitle>
        <v-list-item-title class="ec-checklist--item-title">
          {{ parents.map(({ position }) => position + 1 + '.').join('')
          }}{{ item.position + 1 }}. {{ item.text }}
        </v-list-item-title>
      </v-list-item>
    </template>
  </div>
</template>
<script>
export default {
  name: 'ChecklistDisplaySelectedItems',
  props: {
    checklists: {
      type: Array,
      required: true,
    },
    layoutMode: {
      type: Boolean,
      default: false,
    },
  },
}
</script>
<style scoped>
.e-checklist-item-parent-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ec-checklist--item-title {
  white-space: normal;
  line-height: 1.33;
}
</style>
