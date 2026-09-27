<!--
Displays a field as a e-number-field + write access via API wrapper
-->

<template>
  <api-wrapper v-slot="wrapper" v-bind="{ ...$props, ...$attrs }">
    <e-number-field
      v-bind="$attrs"
      ref="textField"
      :model-value="wrapper.localValue"
      :path="path"
      :readonly="wrapper.readonly"
      :disabled="disabled"
      :error-messages="wrapper.errorMessages"
      :loading="wrapper.isSaving || wrapper.isLoading ? 'secondary' : false"
      :variant
      :density
      @update:model-value="wrapper.on.input"
      @blur="wrapper.on.blur"
    >
      <template #append-inner>
        <api-wrapper-append :wrapper="wrapper" />
      </template>
    </e-number-field>
  </api-wrapper>
</template>

<script>
import { apiPropsMixin } from '@/mixins/apiPropsMixin.js'
import ApiWrapper from './ApiWrapper.vue'
import ApiWrapperAppend from './ApiWrapperAppend.vue'

export default {
  name: 'ApiNumberField',
  components: { ApiWrapper, ApiWrapperAppend },
  mixins: [apiPropsMixin],
  data() {
    return {}
  },
  methods: {
    focus() {
      this.$refs.textField.focus()
    },
  },
}
</script>

<style scoped></style>
