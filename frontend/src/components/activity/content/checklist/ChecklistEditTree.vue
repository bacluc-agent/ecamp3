<template>
  <li>
    <div
      class="d-flex gap-2 pb-2"
      @click="checked ? $emit('removeItem', item.id) : $emit('addItem', item.id)"
    >
      <component :is="checked ? 'strong' : 'span'" class="flex-grow-1"
        >{{ item.text }}
      </component>
      <v-switch :model-value="checked" density="compact" hide-details color="primary" />
    </div>
    <ol v-if="children.length > 0" class="pl-6">
      <ChecklistEditTree
        v-for="child in children"
        :key="child.item._meta.self"
        :checklist="checklist"
        :item="child.item"
        :items="items"
        v-bind="$attrs"
        @add-item="$emit('addItem', $event)"
        @remove-item="$emit('removeItem', $event)"
      />
    </ol>
  </li>
</template>

<script>
import { filter, sortBy } from 'lodash-es'

export default {
  name: 'ChecklistEditTree',
  inject: ['checkedItems'],
  props: {
    checklist: {
      type: Object,
      required: true,
    },
    item: {
      type: Object,
      required: true,
    },
    items: {
      type: Array,
      required: true,
    },
  },
  emits: ['addItem', 'removeItem'],
  computed: {
    children() {
      return sortBy(
        filter(
          this.items,
          ({ item }) => item.parent?.()._meta.self === this.item?._meta.self
        ),
        'position'
      )
    },
    checked() {
      return this.checkedItems.includes(this.item.id)
    },
  },
}
</script>

<style lang="scss" scoped>
:deep(.v-input.v-input--horizontal) {
  grid-template-areas: unset;
}
</style>
