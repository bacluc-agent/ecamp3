<template>
  <EParseField
    v-bind="$attrs"
    ref="input"
    :model-value="modelValue"
    :format="format"
    :parse="parse"
    :input-filter="inputFilter"
    :required="required"
    :vee-id="veeId"
    :vee-rules="veeRules"
    reset-on-blur
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <!-- passing through all slots -->
    <template v-for="(_, slot) of $slots" #[slot]="slotData">
      <slot :name="slot" v-bind="slotData || {}"></slot>
    </template>
  </EParseField>
</template>

<script>
import { formComponentValidation } from '@/mixins/formComponentValidation.js'

export default {
  name: 'ENumberField',
  mixins: [formComponentValidation],
  props: {
    modelValue: { type: [String, Number], required: false, default: null },
  },
  emits: ['update:modelValue'],
  methods: {
    format(value) {
      switch (value) {
        case null:
          return ''
        default:
          return value + ''
      }
    },
    inputFilter(value) {
      if (/\d/.test(value) && value.match(/^[^,]*,[^,.]+$/g)) {
        value = value.replace(/\./g, '').replace(/,/g, '.')
      }

      // Remove all dots except the first one
      let firstDotFound = false
      value = value.replace(/\./g, (match) =>
        firstDotFound ? '' : (firstDotFound = match)
      )

      // Remove everything except numbers, dots and the first minus sign
      const negative = value.startsWith('-')
      value = value.replace(/[^0-9.]/g, '')
      value = negative ? '-' + value : value
      return value
    },
    /**
     * @param {string} value
     */
    parse(value) {
      return isNaN(parseFloat(value)) || /^\.0*$/.test(value) ? null : parseFloat(value)
    },
    focus() {
      this.$refs.input.focus()
    },
  },
}
</script>
