<template>
  <v-tooltip
    v-if="showIcon"
    v-model="showTooltip"
    color="#333"
    location="bottom"
    max-width="300px"
  >
    <template #activator="{ props }">
      <v-btn
        :icon="icon"
        class="tooltip-activator"
        v-bind="props"
        @click="click"
        @mouseenter="mouseenter"
        @mouseleave="mouseleave"
      />
    </template>
    <slot>
      {{ text }}
      <i18n-t v-if="tooltipI18nKey" :keypath="tooltipI18nKey" scope="global">
        <template #br><br class="linebreak" /></template>
      </i18n-t>
    </slot>
  </v-tooltip>
</template>

<script>
export default {
  name: 'IconWithTooltip',
  components: {},
  inheritAttrs: false,
  props: {
    icon: { type: String, required: false, default: 'mdi-information-outline' },
    text: { type: String, required: false, default: undefined },
    tooltipI18nKey: { type: String, required: false, default: undefined },
  },
  data() {
    return {
      showTooltip: false,
    }
  },
  computed: {
    showIcon() {
      return (
        this.text ||
        'default' in this.$slots ||
        this.$t(this.tooltipI18nKey) != this.tooltipI18nKey
      )
    },
  },
  methods: {
    click() {
      if (this.$vuetify.display.xs) {
        this.showTooltip = !this.showTooltip
      }
    },
    mouseenter() {
      if (!this.$vuetify.display.xs) {
        this.showTooltip = true
      }
    },
    mouseleave() {
      this.showTooltip = false
    },
  },
}
</script>

<style scoped>
br.linebreak {
  display: block;
  content: '';
  margin-top: 8px;
}
</style>
