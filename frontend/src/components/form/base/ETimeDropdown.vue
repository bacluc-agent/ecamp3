<template>
  <v-menu ref="menu" v-bind="menuProps" @update:model-value="toggle">
    <template #activator="{ props }">
      <e-time-field
        v-bind="{ ...props, ...$attrs }"
        :model-value="modelValue"
        class="e-time-dropdown--input"
        :class="inputClass"
        @update:model-value="onInput"
      />
    </template>

    <v-list>
      <v-list-item
        v-for="{ label, value: itemValue, ...args } of items"
        :key="itemValue"
        @click="onInput(itemValue)"
      >
        <slot name="item" :item="{ label, value: itemValue, ...args }">
          <span class="tabular-nums">{{ label }}</span>
        </slot>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script>
import ETimeField from '@/components/form/base/ETimeField.vue'

export default {
  name: 'ETimeDropdown',
  components: { ETimeField },
  inheritAttrs: false,
  props: {
    modelValue: { type: [Object, String], required: true },
    items: { type: Array, required: true },
    inputClass: { type: [String, Object], default: '' },
    menuProps: { type: Object, default: () => ({}) },
  },
  emits: ['update:modelValue'],
  computed: {
    // find the closest index to current value
    index() {
      const date = this.$date.utc(this.modelValue)
      return this.items
        .map((item) => Math.abs(date.diff(item.date)))
        .reduce(
          (result, current, index, array) => (array[result] < current ? result : index),
          0
        )
    },
  },
  methods: {
    onInput(value) {
      this.$refs.menu && (this.$refs.menu.isActive = false)
      this.$emit('update:modelValue', value)
    },
    toggle() {
      setTimeout(() => this.setMenuIndex(this.index), 10)
    },
    setMenuIndex(index) {
      this.$refs.menu && (this.$refs.menu.listIndex = index)
    },
  },
}
</script>

<style scoped>
.e-time-dropdown--input {
  width: 56px;
}
</style>
