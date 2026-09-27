import { config } from '@vue/test-utils'
import Vuetify from '@/plugins/vuetify.js'

export function setupVuetify() {
  config.global.plugins = [Vuetify]
}
