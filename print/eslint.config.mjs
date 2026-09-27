import { includeIgnoreFile } from '@eslint/compat'
import localRules from 'eslint-plugin-local-rules'
import vueEslint from 'eslint-plugin-vue'
import vueScopedCssEslint from 'eslint-plugin-vue-scoped-css'
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'
import prettierRecommended from 'eslint-plugin-prettier/recommended'
import globals from 'globals'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const gitignorePath = path.resolve(__dirname, '.gitignore')

const vueRecommendedFlatConfigs = vueEslint.configs['flat/recommended']
const allVueRecommendedRules = {}
for (const config of vueRecommendedFlatConfigs) {
  if (config.rules) {
    Object.assign(allVueRecommendedRules, config.rules)
  }
}

export default createConfigForNuxt().append([
  {
    files: ['**/*.ts'],
  },
  {
    rules: {
      ...allVueRecommendedRules,
    },
  },
  ...vueScopedCssEslint.configs['flat/recommended'],
  js.configs.recommended,
  prettierRecommended,
  {
    ignores: ['common/**/*', '.nuxt/', '.output/', 'coverage/'],
  },

  includeIgnoreFile(gitignorePath),

  {
    plugins: {
      'local-rules': localRules,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },

    rules: {
      'import/first': 'off',
      'no-undef': 'off',
      'no-console': 'off',
      'prettier/prettier': 'error',
      'prefer-const': 'error',
      'vue/multi-word-component-names': 'off',

      'local-rules/matchingTranslationKeys': [
        'error',
        {
          ignoreKeysRegex:
            '^(global|entity|contentNode\\.[a-z][a-zA-Z]+|print\\.(global|activity|cover|picasso|program|config|story|safetyConsiderations|toc|activityList))\\..+',
          translationKeyPropRegex: '[a-zA-Z0-9]-i18n-key$',
        },
      ],
    },
  },
])
