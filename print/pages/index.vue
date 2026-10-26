<template>
  <div>
    <div>
      <!-- Empathetic hint: non-technical users — Print Layout 1 removed -->
      <div class="print-layout-1-hint" style="padding:1rem;border:2px dashed #c0392b;border-radius:8px;margin-bottom:1rem;color:#c0392b;font-family:sans-serif;">
        <strong>We removed Print Layout 1.</strong>
        <p style="margin:0.25rem 0 0;">If you need help choosing a print layout, please <a href="https://ecamp3.ch/en/contact" target="_blank" style="color:#2980b9;text-decoration:underline;">contact support</a>.</p>
      </div>
      <div>
        <generic-error-message v-if="error" :error="error" />
        <div v-for="(content, idx) in config.contents" v-else :key="idx">
        <component
          :is="'Config' + content.type"
          :options="content.options"
          :camp="camp"
          :config="config"
          :page-size="pageSize"
          :index="idx"
        />
      </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { toDayjsLocale } from '@/common/helpers/dayjs.js'
import toLower from 'lodash-es/toLower.js'

// parse query config
const route = useRoute()
const query = route.query
const config = JSON.parse(query.config || '{}')

// set locale
const { setLocale, fallbackLocale } = useI18n()
const { $date } = useNuxtApp()
const locale = config.language || fallbackLocale.value
await setLocale(locale) // i18n

// page size
const pageSize = toLower(config.options?.pageSize ?? 'A4')

//dayjs
$date.locale(toDayjsLocale(locale))

// load camp
const { $api } = useNuxtApp()
const { data: camp, error } = await useAsyncData(
  'camp',
  () => $api.get(config.camp)._meta.load
)
</script>

<!-- these styles should be global, thus we don't want the vue-scoped-css/enforce-style-type warning here -->
<!-- eslint-disable-next-line -->
<style>
:root {
  --tw-prose-body: #000 !important;
}

body {
  color: #000;
  font-family:
    'InterDisplay',
    Helvetica Neue,
    Helvetica,
    Arial,
    sans-serif;
  font-size: 10pt;
}

.tw-prose ol {
  padding-left: 16px;
}

.tw-prose li ::marker {
  color: #000;
}
</style>
