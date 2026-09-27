import { inject } from 'vue'

export const apiPropsMixin = {
  inheritAttrs: false,
  inject: {
    apiUri: { default: null },
  },
  props: {
    /* value is not required; by default value is read directly from api */
    modelValue: { required: false, default: null },

    /* field path and URI for saving back to API */
    path: { type: String, required: true },

    /* load default value from apiObject (via ApiForm injection) */
    uri: {
      type: String,
      required: false,
      default() {
        const apiUri = inject('apiUri')
        if (apiUri === null) {
          throw new Error(
            'ApiWrapper: `uri` not set on component; no ApiForm component found as parent for fallback'
          )
        }
        return apiUri
      },
    },

    /* overrideDirty=true will reset the input if 'value' changes, even if the input is dirty. Use with caution. */
    overrideDirty: { type: Boolean, default: false, required: false },

    /* enable/disable edit mode */
    readonly: { type: Boolean, required: false, default: false }, // vuetify readonly: same look and feel as normal, but no changes possible
    disabled: { type: Boolean, required: false, default: false }, // vuetify disabled: input greyed out, not focusable

    /* enable/disable auto save */
    autoSave: { type: Boolean, default: true, required: false },
    autoSaveDelay: { type: Number, default: 800, required: false },

    variant: {
      type: String,
      default: 'outlined',
      required: false,
    },
    density: {
      type: [null, String],
      default: 'default',
      required: false,
    },
  },
}
