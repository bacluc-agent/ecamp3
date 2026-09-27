<template>
  <v-list-item :disabled="loading" @click.stop="generatePdf">
    <v-tooltip v-model="loading" top>
      <!-- eslint-disable-next-line vue/no-unused-vars -->
      <template #activator="_">
        <v-list-item-icon>
          <v-progress-circular
            v-if="loading"
            :value="progress"
            :rotate="270"
            size="24"
          ></v-progress-circular>
          <v-icon v-else>mdi-printer</v-icon>
        </v-list-item-icon>
      </template>
      <span>{{ state }}</span>
    </v-tooltip>
    <v-list-item-title>
      {{ $tc('components.print.printClient.downloadClientPdfListItem.label') }}
    </v-list-item-title>
  </v-list-item>
</template>

<script>
import { generatePdfMixin } from './generatePdfMixin.js'

export default {
  name: 'DownloadClientPdfListItem',
  mixins: [generatePdfMixin],
}
</script>

<style scoped></style>
