<template>
  <ValidationField
    v-slot="{ handleChange, errors: veeErrors }"
    :model-value="modelValue"
    :name="veeId ?? path ?? validationLabel"
    :label="validationLabel"
    :vee-rules="veeRules"
  >
    <v-switch
      :class="[inputClass]"
      :error-messages="(veeErrors ?? []).concat(errorMessages)"
      :hide-details="hideDetails"
      :label="labelOrEntityFieldLabel"
      :model-value="modelValue"
      inset
      color="primary"
      v-bind="$attrs"
      @update:model-value="
        ($event) => {
          handleChange($event)
          $emit('update:modelValue', $event)
          $emit('input', $event)
        }
      "
    >
      <!-- passing through all slots -->
      <template v-for="(_, slot) of $slots" #[slot]="slotData">
        <slot :name="slot" v-bind="slotData || {}"></slot>
      </template>
    </v-switch>
  </ValidationField>
</template>

<script>
import { formComponentPropsMixin } from '@/mixins/formComponentPropsMixin.js'
import { formComponentValidation } from '@/mixins/formComponentValidation.js'
import ValidationField from './ValidationField.vue'

export default {
  name: 'ESwitch',
  components: {
    ValidationField,
  },
  mixins: [formComponentPropsMixin, formComponentValidation],
  props: {
    modelValue: { type: Boolean, required: false },
  },
  emits: ['update:modelValue', 'input'],
}
</script>
