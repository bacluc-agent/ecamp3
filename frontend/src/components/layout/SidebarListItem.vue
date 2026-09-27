<template>
  <v-list-item link :to="to" :href="href" v-bind="$attrs" class="py-3">
    <template v-if="!hideAvatar" #prepend>
      <slot name="pre">
        <v-icon v-if="icon">{{ icon }}</v-icon>
      </slot>
    </template>
    <v-list-item-title :class="{ 'whitespace-normal': titleMultiline }">{{
      title
    }}</v-list-item-title>
    <v-list-item-subtitle v-if="subtitle">{{ subtitle }}</v-list-item-subtitle>
    <template v-if="!hideChevron" #append>
      <v-icon style="opacity: 0.6">mdi-chevron-right</v-icon>
    </template>
  </v-list-item>
</template>

<script>
export default {
  name: 'SidebarListItem',
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, required: false, default: '' },
    icon: { type: String, required: false, default: '' },
    hideAvatar: { type: Boolean, default: false },
    hideChevron: { type: Boolean, default: false },
    to: { type: [String, Object], default: null },
    href: { type: [String, Object], default: null },
    titleMultiline: { type: Boolean, default: false },
  },
}
</script>

<style scoped></style>
