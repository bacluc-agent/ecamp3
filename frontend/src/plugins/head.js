import { createHead } from '@unhead/vue/client'
import { getEnv } from '@/environment.js'
import { TemplateParamsPlugin } from '@unhead/vue/plugins'

const env = getEnv().SENTRY_ENVIRONMENT.split('.')[0]
export const headEnvironment =
  env === 'app' || env === ''
    ? null
    : env.match('^pr[0-9]+')
      ? `[${env.toUpperCase()}]`
      : `[${env.substring(0, 1).toUpperCase() + env.substring(1)}]`

export const head = createHead({
  plugins: [TemplateParamsPlugin],
})
