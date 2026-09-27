<template>
  <v-btn
    class="px-3 px-sm-4"
    variant="elevated"
    min-width="0"
    :color="color"
    v-bind="$attrs"
  >
    <v-icon :start="!hideLabel" size="150%" :icon="icon" />
    <span :class="{ 'd-sr-only': hideLabel }">
      <slot>{{ $t('global.button.add') }}</slot>
    </span>
  </v-btn>
</template>

<script>
export default {
  name: 'ButtonAdd',
  props: {
    icon: { type: String, default: 'mdi-plus' },
    hideLabel: { type: Boolean, default: false },
    color: { type: String, default: 'success' },
  },
}
</script>

<style scoped></style>
