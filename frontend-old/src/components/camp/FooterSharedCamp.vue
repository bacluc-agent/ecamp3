<template>
  <v-footer v-if="isOutsider || showSharedWarning" app class="shared-camp">
    <p class="mb-0">
      <v-icon left small class="currentColor--text">mdi-earth</v-icon>
      <strong>{{ $tc(`components.camp.footerSharedCamp.${key}`) }}</strong>
      {{ $tc(`components.camp.footerSharedCamp.${key}Description`) }}
    </p>
  </v-footer>
</template>

<script>
import { campFromRoute } from '@/router.js'
import { campRoleMixin } from '@/mixins/campRoleMixin.js'

export default {
  name: 'FooterSharedCamp',
  mixins: [campRoleMixin],
  computed: {
    camp() {
      return campFromRoute(this.$route)
    },
    key() {
      return this.isOutsider ? 'outsider' : this.showSharedWarning ? 'shared' : ''
    },
    showSharedWarning() {
      // The warning is intended for people with write access to the camp,
      // so that they know that the data they enter is publicly accessible.
      return this.camp?.isShared && !this.isOutsider && !this.isGuest
    },
  },
}
</script>

<style scoped>
/* <v-footer> is transformed to <footer class="v-footer"> */
/* eslint-disable-next-line vue-scoped-css/no-unused-selector */
.v-footer.shared-camp {
  border-top: 3px solid #c8930d;
  z-index: 4;
  background: #fbf0df;
  color: #7a4f0f;
  font-size: 80%;
}

/* eslint-disable-next-line vue-scoped-css/no-unused-selector */
.v-icon {
  margin-top: -2px;
}
</style>
