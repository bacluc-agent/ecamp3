<template>
  <Field
    :rules="veeRules"
    v-bind="$attrs"
    as="div"
    class="e-form-container"
    :class="{ 'e-form-container--required': required }"
  >
    <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps || {}"></slot>
    </template>
  </Field>
</template>

<script>
import { Field } from 'vee-validate'
import { formComponentValidation } from '@/mixins/formComponentValidation.js'

export default {
  name: 'ValidationField',
  components: {
    Field,
  },
  mixins: [formComponentValidation],
  inheritAttrs: false,
}
</script>

<style scoped>
.e-form-container--required:deep(label::after) {
  content: '\a0*' / '*';
  font-size: 75%;
  color: #d32f2f;
}
.e-form-container--required:deep(.v-input--is-label-active label::after) {
  color: gray;
}
</style>
