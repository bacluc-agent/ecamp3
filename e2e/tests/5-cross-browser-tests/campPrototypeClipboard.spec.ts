import { expect } from '@playwright/test'
import { grgrCampId } from '@/utils/constants'
import { test } from '@/utils/etest'

const copiedCampUrl = `http://localhost:3000/camps/${grgrCampId}/GRGR/dashboard`
const copiedCampUri = `/camps/${grgrCampId}`

test.describe('camp prototype clipboard', { tag: '@mature' }, () => {
  // The budget has to cover the teardown, not only the test body: Playwright hands a fixture
  // the runnable's own slot, so the newCamp teardown's delete runs inside this number. The
  // measured worst teardown is 14.4 s, so 180 s left the delete with no room at all, and a late
  // failure surfaced as a bare "Test timeout of 180000ms exceeded" with the delete stranded
  // inside it -- which is how one slow read becomes a leaked camp. 210 s is 180 s plus 30 s for
  // that teardown. It is deliberately NOT a bound on the coherent worst case of about 264 s
  // (submit()'s 30 s toPass + 30 s response poll + 30 s waitForURL + 45 s CampInfo.loaded,
  // expectCopiedPrototype()'s 70 s and next()'s 45 s): a test that really takes that long
  // should still fail.
  test.describe.configure({ timeout: 210_000 })

  test('loads a copied camp URL from the clipboard', async ({
    clipboardStub,
    newCamp,
    runId,
  }) => {
    await clipboardStub.readText(copiedCampUrl)
    const createCamp = newCamp(`clipboard prototype ${runId}`)

    const step2 = await createCamp.useCopiedCampPrototype(clipboardStub, 'resolved')
    await step2.expectCopiedPrototype()

    const { campPrototype } = await step2.submit()
    expect(campPrototype).toBe(copiedCampUri)
  })

  test('uses the manual URL when clipboard read fails', async ({
    clipboardStub,
    newCamp,
    runId,
  }) => {
    await clipboardStub.readFailure()
    const createCamp = newCamp(`manual prototype ${runId}`)

    const step2 = await createCamp.useCopiedCampPrototype(clipboardStub, 'rejected')
    await step2.fillManualPrototypeUrl(copiedCampUrl)
    await step2.expectCopiedPrototype()

    const { campPrototype } = await step2.submit()
    expect(campPrototype).toBe(copiedCampUri)
  })

  test('does not submit a pre-granted auto-loaded clipboard prototype', async ({
    clipboardStub,
    newCamp,
    runId,
  }) => {
    await clipboardStub.readText(copiedCampUrl, 'granted')
    const createCamp = newCamp(`auto-loaded prototype ${runId}`)
    const step2 = await createCamp.openStep2()

    // The select shows the auto-loaded camp while the pre-flush watchEffect has set the
    // campPrototype the mounted hook's .then still has to clear (CampCreateStep2.vue:232-236
    // sets it, :350-352 clears it). expectNoPrototypePreview is a terminal check: it
    // proves no preview is on screen at the moment the test submits, and it makes the submitted
    // null explainable by app state instead of a race. It does not prove the transient preview
    // never appeared: toBeHidden also passes when nothing has rendered yet.
    await step2.expectSelectedPrototype('GRGR')
    await step2.expectNoPrototypePreview()

    const { campPrototype } = await step2.submit()
    expect(campPrototype).toBeNull()
  })
})
