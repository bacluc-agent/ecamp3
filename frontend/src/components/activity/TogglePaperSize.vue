<template>
  <v-tooltip location="bottom">
    <template #activator="{ props }">
      <v-btn
        variant="text"
        icon
        class="ec-paper-size-toggle d-none d-md-block"
        :aria-label="
          modelValue
            ? $t('components.activity.togglePaperSize.switchToFullSize')
            : $t('components.activity.togglePaperSize.switchToPaperSize')
        "
        v-bind="{ ...props }"
        @click="$emit('update:modelValue', !modelValue)"
      >
        <v-icon v-if="modelValue" class="resize-icon" icon="$bigScreen" />
        <v-icon v-else class="resize-icon" icon="$paperSize" />
      </v-btn>
    </template>
    {{
      modelValue
        ? $t('components.activity.togglePaperSize.switchToFullSize')
        : $t('components.activity.togglePaperSize.switchToPaperSize')
    }}
  </v-tooltip>
</template>

<script>
export default {
  name: 'TogglePaperSize',
  props: {
    modelValue: { type: Boolean, default: false },
    buttonProps: { type: Object, default: () => ({}) },
  },
  emits: ['update:modelValue'],
}
</script>

<style scoped lang="scss">
.resize-icon,
.resize-icon :deep(svg) {
  width: 28px !important;
}
</style>
