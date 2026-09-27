<template>
  <DetailPane
    v-model="showDialog"
    :loading="loading"
    :error="error"
    icon="mdi-account-plus"
    :title="$tc('components.checklist.checklistItemEdit.title')"
    :submit-action="update"
    :submit-label="$tc('global.button.submit')"
    submit-icon="mdi-send"
    submit-color="success"
    :cancel-action="close"
  >
    <template #moreActions>
      <PromptEntityDelete
        :entity="checklistItem"
        :submit-enabled="activitiesWithChecklistItem.length === 0"
        align="left"
        position="top"
        :btn-attrs="{
          class: 'v-btn--has-bg',
        }"
      >
        <template v-if="activitiesWithChecklistItem.length > 0" #error>
          <ErrorExistingActivitiesList
            :camp="camp"
            :existing-activities="activitiesWithChecklistItem"
          />
        </template>
        {{
          $tc('components.checklist.checklistItemEdit.delete', 0, {
            text: checklistItem.text,
          })
        }}
      </PromptEntityDelete>
    </template>

    <template #activator="{ on }">
      <slot name="activator" v-bind="{ on }" />
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
import { sortBy } from 'lodash-es'
import DetailPane from '@/components/generic/DetailPane.vue'
import DialogBase from '@/components/dialog/DialogBase.vue'
import PromptEntityDelete from '@/components/prompt/PromptEntityDelete.vue'
import ErrorExistingActivitiesList from '@/components/campAdmin/ErrorExistingActivitiesList.vue'

export default {
  name: 'ChecklistItemEdit',
  components: {
    DetailPane,
    PromptEntityDelete,
    ErrorExistingActivitiesList,
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
      activitiesWithChecklistItem: [],
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
    checklistItem: {
      async handler(checklistItem) {
        await this.camp.activities()._meta.load
        const activities = await Promise.all(
          this.camp.activities().items.map(async (a) => ({
            activity: a,
            rootContentNodeUri: await a.$href('rootContentNode'),
          }))
        )

        await this.loadData()

        const checklistNodes = await Promise.all(
          checklistItem.checklistNodes().items.map(async (cn) => ({
            checklistNode: cn,
            rootUri: await cn.$href('root'),
          }))
        )

        const res = sortBy(
          activities
            .filter((a) =>
              checklistNodes.some((cn) => cn.rootUri == a.rootContentNodeUri)
            )
            .map((a) => a.activity),
          (activity) =>
            activity
              .scheduleEntries()
              .items.map(
                (s) =>
                  `${s.dayNumber}`.padStart(3, '0') +
                  `${s.scheduleEntryNumber}`.padStart(3, '0')
              )
              .reduce((p, v) => (p < v ? p : v))
        )
        this.activitiesWithChecklistItem = res
      },
      immediate: true,
    },
  },
  async mounted() {
    this.api.href(this.api.get(), 'checklistItems').then((uri) => (this.entityUri = uri))
    this.loadData()
  },
  methods: {
    async loadData() {
      return Promise.all([
        this.api.get().checklistNodes({ camp: this.camp._meta.self }),
        this.api.get().checklistItems({ 'checklist.camp': this.camp._meta.self }),
      ])
    },
  },
}
</script>

<style scoped></style>
