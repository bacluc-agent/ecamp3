<!--
Displays a field as a time picker + write access via API wrapper
-->

<template>
  <api-wrapper v-slot="wrapper" v-bind="{ ...$props, ...$attrs }">
    <e-time-picker
      v-bind="$attrs"
      :model-value="wrapper.localValue || ''"
      :path="path"
      :readonly="wrapper.readonly"
      :disabled="disabled"
      :variant="variant"
      :loading="wrapper.isSaving || wrapper.isLoading ? 'secondary' : false"
      :error-messages="wrapper.errorMessages"
      @update:model-value="wrapper.on.input"
    >
      <template #append-inner>
        <api-wrapper-append :wrapper="wrapper" />
      </template>
    </e-time-picker>
  </api-wrapper>
</template>

<script>
import { apiPropsMixin } from '@/mixins/apiPropsMixin.js'
import ApiWrapper from './ApiWrapper.vue'
import ApiWrapperAppend from './ApiWrapperAppend.vue'

export default {
  name: 'ApiTimePicker',
  components: { ApiWrapper, ApiWrapperAppend },
  mixins: [apiPropsMixin],
  data() {
    return {}
  },
}
</script>

<style scoped></style>
