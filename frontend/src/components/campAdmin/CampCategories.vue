<template>
  <content-group
    :title="$t('components.campAdmin.campCategories.title')"
    icon="mdi-shape"
  >
    <template #title-actions>
      <DialogCategoryCreate v-if="!disabled" :camp="camp">
        <template #activator="{ props }">
          <ButtonAdd
            v-bind="props"
            color="blue-grey-darken-2"
            variant="text"
            :hide-label="$vuetify.display.xs"
            class="my-n2"
          >
            {{ $t('components.campAdmin.campCategories.create') }}
          </ButtonAdd>
        </template>
      </DialogCategoryCreate>
    </template>
    <v-skeleton-loader
      v-if="camp.categories()._meta.loading"
      type="list-item@3"
      class="mx-n4"
    />
    <v-list class="mx-n2">
      <v-list-item
        v-for="category in categories.items"
        :key="category._meta.self"
        class="px-2 py-2 rounded"
        :to="categoryRoute(camp, category)"
      >
        <template #title>
          <CategoryChip :category="category" class="pointer-events-none">
            (1.{{ category.numberingStyle }}) {{ category.short }}: {{ category.name }}
          </CategoryChip>
        </template>

        <template #append>
          <v-item-group v-if="!disabled">
            <ButtonEdit color="primary" variant="tonal" class="my-n1 v-btn--has-bg" />
          </v-item-group>
        </template>
      </v-list-item>
    </v-list>
  </content-group>
</template>

<script>
import { categoryRoute } from '@/router.js'
import ButtonAdd from '@/components/buttons/ButtonAdd.vue'
import ButtonEdit from '@/components/buttons/ButtonEdit.vue'
import ContentGroup from '@/components/layout/ContentGroup.vue'
import CategoryChip from '@/components/generic/CategoryChip.vue'
import DialogCategoryCreate from './DialogCategoryCreate.vue'
import { dateHelperUTCFormatted } from '@/mixins/dateHelperUTCFormatted.js'

export default {
  name: 'CampCategories',
  components: {
    ButtonAdd,
    ButtonEdit,
    ContentGroup,
    CategoryChip,
    DialogCategoryCreate,
  },
  mixins: [dateHelperUTCFormatted],
  props: {
    camp: { type: Object, required: true },
    disabled: { type: Boolean, default: false },
  },
  data() {
    return {}
  },
  computed: {
    categories() {
      return this.camp.categories()
    },
  },
  methods: {
    categoryRoute,
  },
}
</script>
