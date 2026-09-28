import { expect } from '@playwright/test'
import { grgrCampId } from '@/utils/constants'
import { test } from '@/utils/etest'
import { Camp } from '@/utils/fixtures/domainObjects/camp'

const copiedCampUrl = `http://localhost:3000/camps/${grgrCampId}/GRGR/dashboard`
const copiedCampUri = `/camps/${grgrCampId}`

test.describe('camp prototype clipboard', { tag: '@mature' }, () => {
  test.describe.configure({ timeout: 180_000 })

  // Camps.vue puts the create button last in the list, so every camp this spec leaves behind
  // moves it further down the page for the test that runs next.
  let createdCamp: Camp | undefined

  test.afterEach(async () => {
    await createdCamp?.delete()
  })

  test('loads a copied camp URL from the clipboard', async ({
    runId,
    clipboardStub,
    newCreateCamp,
  }) => {
    await clipboardStub.readText(copiedCampUrl)
    const campTitle = `clipboard prototype ${runId}`
    const createCamp = newCreateCamp(campTitle)
    const step2 = await createCamp.openStep2()

    await step2.selectOtherCampPrototype()
    await step2.requestClipboardPaste('resolved')
    await step2.expectCopiedPrototype()

    const body = await step2.submitCapturingCreateCampRequest()
    createdCamp = createCamp.createdCamp(step2.campIdFromUrl())
    expect(body.campPrototype).toBe(copiedCampUri)
  })

  test('uses the manual URL when clipboard read fails', async ({
    runId,
    clipboardStub,
    newCreateCamp,
  }) => {
    await clipboardStub.readFailure()
    const campTitle = `manual prototype ${runId}`
    const createCamp = newCreateCamp(campTitle)
    const step2 = await createCamp.openStep2()

    await step2.selectOtherCampPrototype()
    await step2.requestClipboardPaste('rejected')
    await step2.fillManualPrototypeUrl(copiedCampUrl)
    await step2.expectCopiedPrototype()

    const body = await step2.submitCapturingCreateCampRequest()
    createdCamp = createCamp.createdCamp(step2.campIdFromUrl())
    expect(body.campPrototype).toBe(copiedCampUri)
  })

  test('does not submit a pre-granted auto-loaded clipboard prototype', async ({
    runId,
    clipboardStub,
    newCreateCamp,
  }) => {
    await clipboardStub.readText(copiedCampUrl, 'granted')
    const campTitle = `auto-loaded prototype ${runId}`
    const createCamp = newCreateCamp(campTitle)
    const step2 = await createCamp.openStep2()

    // The select shows the auto-loaded camp while the pre-flush watchEffect still has to clear
    // the campPrototype the mounted hook set. toBeHidden tolerates the transient preview, so it
    // cannot flake, and it makes the submitted null explainable by app state instead of a race.
    await step2.expectSelectedPrototype('GRGR')
    await step2.expectNoPrototypePreview()

    const body = await step2.submitCapturingCreateCampRequest()
    createdCamp = createCamp.createdCamp(step2.campIdFromUrl())
    expect(body.campPrototype).toBeNull()
  })
})
