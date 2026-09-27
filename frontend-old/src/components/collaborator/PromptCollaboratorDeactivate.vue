<template>
  <PopoverPrompt
    v-model="showDialog"
    type="error"
    :error="error"
    :submit-action="deactivateUser"
    :submit-enabled="!$slots.error"
    :submit-label="submitLabel"
    submit-color="error"
    submit-icon="mdi-cancel"
    cancel-icon=""
    :cancel-action="close"
    v-bind="$attrs"
  >
    <template #activator="scope">
      <slot name="activator" v-bind="scope" />
    </template>
    <slot>
      {{ warningText }}
    </slot>
    <template v-if="$slots.error || error" #error>
      <slot name="error">
        {{ error }}
      </slot>
    </template>
  </PopoverPrompt>
</template>

<script>
import DialogBase from '@/components/dialog/DialogBase.vue'
import campCollaborationDisplayName from '@/common/helpers/campCollaborationDisplayName.js'
import { errorToMultiLineToast } from '@/components/toast/toasts'
import PopoverPrompt from '@/components/prompt/PopoverPrompt.vue'
import isOwnCampCollaboration from './isOwnCampCollaboration.js'
import campShortTitle from '@/common/helpers/campShortTitle.js'

export default {
  name: 'PromptCollaboratorDeactivate',
  components: { PopoverPrompt },
  extends: DialogBase,
  props: {
    entity: { type: Object, required: true },
  },
  computed: {
    isOwnCampCollaboration() {
      return isOwnCampCollaboration(this.entity, this.$store.state.auth)
    },
    displayName() {
      return campCollaborationDisplayName(this.entity, this.$tc.bind(this))
    },
    submitLabel() {
      return this.isOwnCampCollaboration
        ? this.$tc('components.collaborator.promptCollaboratorDeactivate.leaveCamp')
        : this.$tc('components.collaborator.promptCollaboratorDeactivate.deactivate')
    },
    warningText() {
      const key = this.isOwnCampCollaboration
        ? 'components.collaborator.promptCollaboratorDeactivate.warningTextLeaveCamp'
        : 'components.collaborator.promptCollaboratorDeactivate.warningText'
      return this.$tc(key, 1, {
        name: this.displayName,
        camp: campShortTitle(this.entity.camp()),
      })
    },
  },
  created() {
    this.entityUri = this.entity._meta.self
  },
  methods: {
    deactivateUser() {
      this.error = null
      const promise = this.api
        .patch(this.entity, { status: 'inactive' })
        .catch((e) => this.$toast.error(errorToMultiLineToast(e)))

      // User left camp -> navigate to camp-overview
      promise.then(() => {
        if (!this.isOwnCampCollaboration) {
          return
        }
        this.api
          .get()
          .camps({ campCollaborator: this.$store.getters.getLoggedInUser?._meta.self })
          .$reload()
        this.$router.push({ name: 'camps' })
      })

      return promise
    },
  },
}
</script>

<style scoped></style>
