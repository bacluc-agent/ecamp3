<!--
Displays a field as a e-color-field + write access via API wrapper
-->

<template>
  <api-wrapper v-slot="wrapper" v-bind="{ ...$props, ...$attrs }" separate-buttons>
    <e-color-field
      v-bind="$attrs"
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
    </e-color-field>
  </api-wrapper>
</template>

<script>
import { apiPropsMixin } from '@/mixins/apiPropsMixin.js'
import ApiWrapper from './ApiWrapper.vue'
import ApiWrapperAppend from './ApiWrapperAppend.vue'

export default {
  name: 'ApiColorField',
  components: { ApiWrapper, ApiWrapperAppend },
  mixins: [apiPropsMixin],

  data() {
    return {}
  },
}
</script>

<style scoped></style>
