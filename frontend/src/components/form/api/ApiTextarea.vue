<!--
Displays a field as a e-textarea + write access via API wrapper
-->

<template>
  <api-wrapper v-slot="wrapper" v-bind="{ ...$props, ...$attrs }" separate-buttons>
    <e-textarea
      :model-value="wrapper.localValue"
      v-bind="$attrs"
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
    </e-textarea>
  </api-wrapper>
</template>

<script>
import { apiPropsMixin } from '@/mixins/apiPropsMixin.js'
import ApiWrapper from './ApiWrapper.vue'
import ApiWrapperAppend from './ApiWrapperAppend.vue'

export default {
  name: 'ApiTextarea',
  components: { ApiWrapper, ApiWrapperAppend },
  mixins: [apiPropsMixin],

  data() {
    return {}
  },
}
</script>

<style scoped></style>
