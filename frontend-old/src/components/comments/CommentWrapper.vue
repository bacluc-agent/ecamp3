<template>
  <div style="display: flex" class="gap-4">
    <div style="flex-grow: 1; flex-shrink: 1">
      <slot />
    </div>
    <template v-if="openComments">
      <div
        v-if="$vuetify.breakpoint.width > 1360"
        style="flex-basis: 320px"
        class="d-flex flex-column gap-2 items-center"
      >
        <slot name="comments" />
      </div>
      <v-navigation-drawer
        v-else
        v-model="openComments"
        clipped
        right
        app
        permanent
        temporary
        color="blue-grey"
        floating
        width="320"
      >
        <div class="py-3 px-3 d-flex flex-column gap-2 items-center">
          <slot name="comments" />
        </div>
      </v-navigation-drawer>
    </template>
    <v-btn
      fab
      fixed
      bottom
      right
      color="primary"
      class="mb-4 mr-4"
      @click="openComments = !openComments"
    >
      <v-icon>mdi-chat</v-icon>
    </v-btn>
  </div>
</template>

<script>
export default {
  name: 'CommentWrapper',
  data() {
    return {
      openComments: false,
    }
  },
}
</script>

<style scoped></style>
