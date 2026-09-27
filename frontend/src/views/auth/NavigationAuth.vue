<template>
  <v-app-bar
    v-if="$vuetify.display.mdAndUp"
    app
    clipped-left
    color="blue-grey-darken-4"
    dark
  >
    <logo text />
    <v-spacer />
    <v-toolbar-items>
      <v-btn :href="newsLink" target="_blank" variant="text">
        <v-icon start size="small">mdi-script-text-outline</v-icon>
        {{ $t('global.navigation.news') }}
      </v-btn>
    </v-toolbar-items>
    <v-btn
      :href="helpLink"
      target="_blank"
      variant="elevated"
      elevation="3"
      density="comfortable"
      icon="mdi-help"
      position="absolute"
      location="top right"
      class="help-button--desktop ma-3"
    >
      <v-icon>mdi-help</v-icon>
      <span class="d-sr-only">{{ $t('global.navigation.help') }}</span>
    </v-btn>
  </v-app-bar>
  <v-btn
    v-else
    :href="helpLink"
    target="_blank"
    variant="elevated"
    elevation="3"
    density="comfortable"
    icon="mdi-help"
    position="absolute"
    location="right top right"
    class="ma-3"
    style="z-index: 10"
  >
    <v-icon icon="mdi-help" />
    <span class="d-sr-only">{{ $t('global.navigation.help') }}</span>
  </v-btn>
</template>

<script>
import Logo from '@/components/navigation/Logo.vue'
import { getEnv } from '@/environment.js'
export default {
  name: 'NavigationAuth',
  components: {
    Logo,
  },
  computed: {
    helpLink() {
      return getEnv().HELP_LINK
    },
    newsLink() {
      return getEnv().NEWS_LINK
    },
  },
}
</script>

<style scoped lang="scss">
.help-button--desktop {
  top: 65px !important;
}
:deep(.v-toolbar__content) {
  overflow: visible;
}
</style>
