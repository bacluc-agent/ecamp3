<template>
  <DetailPane
    v-model="showDialog"
    :loading="loading"
    :error="error"
    icon="mdi-account-plus"
    :title="$t('components.checklist.checklistItemEdit.title')"
    :submit-action="update"
    :submit-label="$t('global.button.submit')"
    submit-icon="mdi-send"
    submit-color="success"
    :cancel-action="close"
  >
    <template #moreActions>
      <PromptEntityDelete
        :entity="checklistItem"
        align="left"
        position="top"
        :btn-attrs="{
          class: 'v-btn--has-bg',
        }"
      >
        {{
          $t(
            'components.checklist.checklistItemEdit.delete',
            { text: checklistItem.text },
            0
          )
        }}
      </PromptEntityDelete>
    </template>

    <template #activator="{ props }">
      <slot name="activator" v-bind="{ props }" />
    </template>

    <e-text-field
      v-model="entityData.text"
      type="text"
      path="text"
      vee-rules="required"
      autofocus
    />
  </DetailPane>
</template>

<script>
import DetailPane from '@/components/generic/DetailPane.vue'
import DialogBase from '@/components/dialog/DialogBase.vue'
import PromptEntityDelete from '@/components/prompt/PromptEntityDelete.vue'

export default {
  name: 'ChecklistItemEdit',
  components: {
    DetailPane,
    PromptEntityDelete,
  },
  extends: DialogBase,
  provide() {
    return {
      entityName: 'checklistItem',
    }
  },
  props: {
    checklist: { type: Object, required: true },
    checklistItem: { type: Object, default: null },
  },
  data() {
    return {
      entityProperties: ['checklist', 'text'],
      entityUri: '',
    }
  },
  computed: {
    camp() {
      return this.checklist.camp()
    },
  },
  watch: {
    showDialog: function (showDialog) {
      if (showDialog) {
        this.entityUri = this.checklistItem._meta.self
        this.setEntityData({
          text: this.checklistItem.text,
        })
      } else {
        // clear form on exit
        this.clearEntityData()
      }
    },
  },
  async mounted() {
    this.api.href(this.api.get(), 'checklistItems').then((uri) => (this.entityUri = uri))
  },
}
</script>

<style scoped></style>
