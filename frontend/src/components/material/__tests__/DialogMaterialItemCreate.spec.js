import { describe, expect, it } from 'vitest'
import DialogMaterialItemCreate from '@/components/material/DialogMaterialItemCreate.vue'

describe('DialogMaterialItemCreate', () => {
  it('does not restrict the post to a subresource collection', () => {
    // the dialog only emits, the parent table posts to the writable root collection
    expect(DialogMaterialItemCreate.data().entityUri).toBeUndefined()
  })
})
