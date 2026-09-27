<template>
  <dialog-form
    v-model="showDialog"
    :loading="false"
    :error="error"
    icon="mdi-earth"
    :title="title"
    :submit-action="null"
    submit-color="success"
    :cancel-action="close"
    :cancel-label="$t('global.button.close')"
    :cancel-visible="false"
    close-visible-on-mobile
  >
    <template #activator="scope">
      <slot name="activator" v-bind="scope" />
    </template>
    <slot />
    <template #moreActions>
      <slot name="more-actions" />
    </template>
  </dialog-form>
</template>

<script>
import DialogBase from '@/components/dialog/DialogBase.vue'
import DialogForm from '@/components/dialog/DialogForm.vue'

export default {
  name: 'DialogShare',
  components: {
    DialogForm,
  },
  extends: DialogBase,
  props: {
    title: { type: String, required: true },
  },
}
</script>

<style scoped></style>
