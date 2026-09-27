<!--
Critical operations on camp
-->

<template>
  <v-expansion-panel
    :color="active ? 'red-lighten-5' : null"
    :bg-color="active ? 'red-lighten-5' : null"
  >
    <v-expansion-panel-title :class="active ? 'text-red-darken-4' : ''">
      <h2 class="text-subtitle-1 font-weight-bold">
        <v-icon start icon="mdi-alert" />
        {{ $t('components.campAdmin.campDangerZone.title') }}
      </h2>
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <v-skeleton-loader v-if="camp._meta.loading" type="article" />
      <div v-else>
        <v-list lines="two" class="py-0 bg-transparent" color="transparent">
          <v-list-item class="px-0">
            <v-list-item-title>
              {{ $t('components.campAdmin.campDangerZone.deleteCamp.title') }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ $t('components.campAdmin.campDangerZone.deleteCamp.description') }}
            </v-list-item-subtitle>
            <template #append>
              <v-list-item-action>
                <dialog-entity-delete
                  :entity="camp"
                  :submit-enabled="promptText === camp.title"
                  icon="mdi-bomb"
                  @submit="$router.push({ name: 'camps' })"
                >
                  <template #activator="{ props }">
                    <button-delete
                      icon="mdi-bomb"
                      :text="false"
                      dark
                      border="sm"
                      variant="tonal"
                      color="blue-grey"
                      @click.prevent="props.onClick"
                    >
                      {{ $t('global.button.delete') }}
                    </button-delete>
                  </template>
                  <p class="text-body-1">
                    {{
                      $t(
                        'components.campAdmin.campDangerZone.deleteCamp.explanation',
                        { campTitle: camp.title },
                        0
                      )
                    }}
                  </p>
                  <label>
                    {{
                      $t(
                        'components.campAdmin.campDangerZone.deleteCamp.label',
                        { campTitle: camp.title },
                        0
                      )
                    }}
                    <e-text-field v-model="promptText" path="promptText" />
                  </label>
                </dialog-entity-delete>
              </v-list-item-action>
            </template>
          </v-list-item>
        </v-list>
      </div>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script>
import ButtonDelete from '@/components/buttons/ButtonDelete.vue'
import DialogEntityDelete from '@/components/dialog/DialogEntityDelete.vue'
import ETextField from '@/components/form/base/ETextField.vue'

export default {
  name: 'CampDangerZone',
  components: {
    ETextField,
    DialogEntityDelete,
    ButtonDelete,
  },
  props: {
    active: {
      type: Boolean,
      default: false,
    },
    camp: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      promptText: '',
    }
  },
}
</script>

<style scoped></style>
