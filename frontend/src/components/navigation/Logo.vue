<template>
  <v-toolbar-items>
    <v-btn
      :to="{ name: 'home' }"
      class="px-2 e-logo"
      exact
      min-width="0"
      rounded
      variant="text"
    >
      <v-toolbar-title>
        <v-icon icon="$ecamp" size="24" />
        <span v-show="text" class="mx-2 e-logo-text">eCamp</span>
      </v-toolbar-title>
    </v-btn>
    <slot />
  </v-toolbar-items>
</template>

<script>
export default {
  name: 'Logo',
  props: {
    text: { type: Boolean, default: false },
  },
}
</script>

<style scoped>
.e-logo-text {
  letter-spacing: 0.25px;
}

.e-logo:hover .e-logo-text {
  display: inline !important;
}
</style>
