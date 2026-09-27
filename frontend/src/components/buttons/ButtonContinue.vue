<template>
  <v-btn color="primary" variant="elevated" v-bind="$attrs" type="submit">
    {{ $t('global.button.continue') }}
  </v-btn>
</template>

<script>
export default {
  name: 'ButtonContinue',
}
</script>
