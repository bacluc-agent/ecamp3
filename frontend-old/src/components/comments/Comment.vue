<template>
  <v-sheet
    outlined
    class="ec-comment"
    elevation="2"
    rounded="lg"
    border="left"
    colored-border="blue"
  >
    <v-card-text class="px-3 pt-2 pb-2 ec-comment__text">
      <slot />
    </v-card-text>
    <PromptEntityDelete
      v-if="isDeletable()"
      :entity="comment._meta.self"
      class="ec-comment__delete"
      warning-text-entity="Kommentar"
    >
      <template #activator="{ attrs, on }">
        <v-btn
          v-if="isDeletable()"
          class="ec-comment__delete"
          icon
          absolute
          right
          v-bind="attrs"
          v-on="on"
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>
    </PromptEntityDelete>
  </v-sheet>
</template>

<script>
import PromptEntityDelete from '@/components/prompt/PromptEntityDelete.vue'
import { mapGetters } from 'vuex'

export default {
  name: 'Comment',
  components: { PromptEntityDelete },
  props: {
    comment: {
      type: Object,
      required: false,
    },
  },

  methods: {
    isDeletable() {
      return this.comment !== undefined && this.comment.author().id === this.authUser.id
    },
  },
  computed: {
    ...mapGetters({
      authUser: 'getLoggedInUser',
    }),
  },
}
</script>

<style scoped>
.ec-comment {
  background-color: #cfe2f1 !important;
  border-color: #e3edfc #cfe2f1 #588ebc !important;
  position: relative;
}

.ec-comment:not(:hover) .ec-comment__delete {
  display: none;
}

.ec-comment button.ec-comment__delete {
  top: 0;
  right: 0rem;
}

.ec-comment__text :deep(p) {
  margin-bottom: 6px;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.375rem;
  letter-spacing: -0.006em;
}
</style>
