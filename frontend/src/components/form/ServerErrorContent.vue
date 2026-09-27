<template>
  <div>
    <span v-if="errorList.length === 1">{{ errorList[0] }}</span>
    <ul v-else>
      <li v-for="(error, index) in errorList" :key="index">
        {{ error }}
      </li>
    </ul>
  </div>
</template>

<script>
import { violationsToFlatArray } from '@/helpers/serverError'
import { componentI18n } from '@/plugins/i18n/index.js'

export default {
  name: 'ServerErrorContent',
  props: {
    serverError: {
      type: [Object, String, Error],
      default: null,
    },
  },
  computed: {
    errorList() {
      return violationsToFlatArray(this.serverError, componentI18n)
    },
  },
}
</script>
