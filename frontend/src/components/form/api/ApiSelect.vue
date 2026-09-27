<!--
Displays a field as a e-select + write access via API wrapper
-->

<template>
  <api-wrapper
    v-slot="wrapper"
    v-bind="{ ...$props, ...$attrs }"
    :path
    :auto-save-delay="autoSaveDelayComputed"
  >
    <e-select
      :model-value="wrapper.localValue"
      v-bind="$attrs"
      :path="path"
      :readonly="wrapper.readonly"
      :disabled="disabled"
      :error-messages="wrapper.errorMessages"
      :loading="wrapper.isSaving || wrapper.isLoading ? 'secondary' : false"
      :variant
      :density
      :multiple="multiple"
      @update:model-value="wrapper.on.input"
    >
      <template #append-inner>
        <api-wrapper-append :wrapper="wrapper" />
      </template>
    </e-select>
  </api-wrapper>
</template>

<script>
import { apiPropsMixin } from '@/mixins/apiPropsMixin.js'
import ApiWrapper from './ApiWrapper.vue'
import ApiWrapperAppend from './ApiWrapperAppend.vue'

export default {
  name: 'ApiSelect',
  components: { ApiWrapper, ApiWrapperAppend },
  mixins: [apiPropsMixin],
  props: {
    // disable delay per default
    autoSaveDelay: { type: Number, default: null, required: false },

    // v-select multiple property
    multiple: { type: Boolean, default: false, required: false },
  },
  data() {
    return {}
  },
  computed: {
    autoSaveDelayComputed() {
      return (
        this.autoSaveDelay ?? // manual override
        (this.multiple
          ? 800 // default: 800ms save delay for multiple selection
          : 0) // default: immediate save for single selection
      )
    },
  },
}
</script>

<style scoped></style>
