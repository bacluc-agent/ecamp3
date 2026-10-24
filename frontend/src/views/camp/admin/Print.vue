<!--
Basic layout for print preview
-->

<template>
  <content-card :title="$t('views.camp.admin.print.title')" toolbar>
    <v-alert type="info" variant="tonal" class="ma-4">
      {{ $t('views.camp.admin.print.layoutRemoved') }}
      <a href="https://ecamp3.ch/contact" target="_blank" rel="noopener noreferrer">
        {{ $t('views.camp.admin.print.contactSupport') }}
      </a>
    </v-alert>
    <template #title-actions>
      <v-btn variant="text" @click="$refs.printConfigurator?.resetConfig()">
        <v-icon v-if="$vuetify.display.smAndUp" start>mdi-file-restore-outline</v-icon>
        {{ $t('global.button.reset') }}
      </v-btn>
    </template>
    <print-configurator ref="printConfigurator" :camp="camp" />
  </content-card>
</template>

<script>
import ContentCard from '@/components/layout/ContentCard.vue'
import PrintConfigurator from '@/components/print/PrintConfigurator.vue'

export default {
  name: 'CampAdminPrint',
  components: {
    ContentCard,
    PrintConfigurator,
  },
  props: {
    camp: { type: Object, required: true },
  },
  data() {
    return {}
  },
  head() {
    return {
      title: this.$t('views.camp.admin.print.title'),
    }
  },
}
</script>

<style scoped>
:deep(.v-toolbar-title .v-spacer) {
  flex-grow: 0;
}
</style>
