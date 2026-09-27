<template>
  <auth-container>
    <h1 class="text-h4 text-center mb-4">
      {{ $t('views.auth.resetPasswordRequest.title') }}
    </h1>

    <v-alert v-if="status == 'success'" type="success">
      {{ $t('views.auth.resetPasswordRequest.successMessage') }}
    </v-alert>

    <v-alert v-if="status == 'error'" type="error">
      {{ $t('views.auth.resetPasswordRequest.errorMessage') }}
    </v-alert>

    <v-form
      v-if="status == 'mounted' || status == 'sending'"
      @submit.prevent="resetPassword"
    >
      <e-text-field
        v-model="email"
        :density="$vuetify.display.xs ? 'compact' : 'default'"
        :label="$t('entity.profile.fields.email')"
        name="email"
        vee-rules="email"
        append-inner-icon="mdi-at"
        type="email"
        autocomplete="username"
        autofocus
      />
      <v-btn
        type="submit"
        :color="email ? 'blue-darken-2' : 'blue-lighten-4'"
        block
        :disabled="!email"
        :size="$vuetify.display.smAndUp && 'large'"
        height="50"
        variant="outlined"
        class="my-4 pa-2 ec-login-button"
      >
        <v-progress-circular v-if="status == 'sending'" indeterminate size="24" />
        <v-icon v-else size="large">$ecamp</v-icon>
        <v-spacer />
        <span>{{ $t('views.auth.resetPasswordRequest.send') }}</span>
        <v-spacer />
        <icon-spacer />
      </v-btn>
    </v-form>
    <p class="mt-8 mb0 text--secondary text-center">
      <router-link :to="{ name: 'login' }">
        {{ $t('global.button.login') }}
      </router-link>
    </p>
  </auth-container>
</template>

<script>
import { load } from 'recaptcha-v3'
import { getEnv } from '@/environment.js'

export default {
  name: 'ResetPasswordRequest',

  data() {
    return {
      email: '',
      status: 'mounted',
      recaptcha: null,
    }
  },

  head() {
    return {
      title: this.$t('views.auth.resetPasswordRequest.title'),
    }
  },

  mounted() {
    if (getEnv().RECAPTCHA_SITE_KEY) {
      this.recaptcha = load(getEnv().RECAPTCHA_SITE_KEY, {
        explicitRenderParameters: {
          badge: 'bottomleft',
        },
      })
    }
  },

  methods: {
    async resetPassword() {
      this.status = 'sending'

      let recaptchaToken = null
      if (this.recaptcha) {
        const recaptcha = await this.recaptcha
        recaptchaToken = await recaptcha.execute('login')
      }

      this.$auth
        .resetPasswordRequest(this.email, recaptchaToken)
        .then(() => {
          this.status = 'success'
        })
        .catch(() => {
          this.status = 'error'
        })
    },
  },
}
</script>

<style lang="scss" scoped>
/* eslint-disable-next-line vue-scoped-css/no-unused-selector */
.ec-login-button.v-btn--disabled {
  color: rgba(0, 0, 0, 0.26) !important;
  opacity: 1;
}

.ec-login-button :deep(.v-btn__overlay) {
  opacity: 0.08;
}

.ec-login-button :deep(.v-btn__content) {
  width: 100%;
}
</style>
