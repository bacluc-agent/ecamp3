<template>
  <IconButton
    :hide-label="hideLabel || $vuetify.display.xs"
    class="px-3 px-sm-4 ec-edit-button"
    color="primary"
    :icon="icon"
    v-bind="$attrs"
  >
    <slot>{{ $t('global.button.edit') }}</slot>
  </IconButton>
</template>

<script>
import IconButton from '@/components/buttons/IconButton.vue'

export default {
  name: 'ButtonEdit',
  components: { IconButton },
  props: {
    icon: { type: String, default: 'mdi-pencil' },
    hideLabel: { type: Boolean, default: false },
  },
}
</script>

<style scoped>
.ec-edit-button:not(:hover):not(:focus) :deep(.v-btn__underlay) {
  background-color: #f6f6f6;
  opacity: 1;
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.6, 1);
}
.ec-edit-button :deep(.v-btn__content) {
  z-index: 1;
}
</style>
