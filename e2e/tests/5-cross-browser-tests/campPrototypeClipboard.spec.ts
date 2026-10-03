import { expect } from '@playwright/test'
import { grgrCampId } from '@/utils/constants'
import { test } from '@/utils/etest'
import { Camp } from '@/utils/fixtures/domainObjects/camp'

const copiedCampUrl = `http://localhost:3000/camps/${grgrCampId}/GRGR/dashboard`
const copiedCampUri = `/camps/${grgrCampId}`

test.describe('camp prototype clipboard', { tag: '@mature' }, () => {
  test('loads a copied camp URL from the clipboard', async ({
    page,
    clipboardStub,
    openCreateCampStep2,
    runId,
  }) => {
    await clipboardStub.readText(copiedCampUrl)
    const createCampDialogStep2 = await openCreateCampStep2()
    await createCampDialogStep2.selectOtherCampPrototype()
    await createCampDialogStep2.grantClipboardRead()
    await clipboardStub.expectReadSettled('resolved')
    await createCampDialogStep2.closeClipboardInfoDialog()

    await createCampDialogStep2.expectCopiedPrototype()

    const { campPrototype, campInfo } = await createCampDialogStep2.submit()
    const camp = new Camp(page, campInfo.campId, `camp ${runId}`, campInfo)

    await camp.delete()
    expect(campPrototype).toBe(copiedCampUri)
  })

  test('uses the manual URL when clipboard read fails', async ({
    page,
    clipboardStub,
    openCreateCampStep2,
    runId,
  }) => {
    await clipboardStub.readFailure()
    const createCampDialogStep2 = await openCreateCampStep2()
    await createCampDialogStep2.selectOtherCampPrototype()
    await createCampDialogStep2.grantClipboardRead()
    await clipboardStub.expectReadSettled('rejected')
    await createCampDialogStep2.closeClipboardInfoDialog()
    await createCampDialogStep2.fillManualPrototypeUrl(copiedCampUrl)
    await createCampDialogStep2.expectCopiedPrototype()

    const { campPrototype, campInfo } = await createCampDialogStep2.submit()
    const camp = new Camp(page, campInfo.campId, `camp ${runId}`, campInfo)

    await camp.delete()
    expect(campPrototype).toBe(copiedCampUri)
  })

  test('does not submit a pre-granted auto-loaded clipboard prototype', async ({
    page,
    clipboardStub,
    openCreateCampStep2,
    runId,
  }) => {
    await clipboardStub.readText(copiedCampUrl, 'granted')
    const createCampDialogStep2 = await openCreateCampStep2()
    await createCampDialogStep2.selectOtherCampPrototype()
    await createCampDialogStep2.pasteClipboardPrototype()
    await clipboardStub.expectReadSettled('resolved')
    await createCampDialogStep2.expectCopiedPrototype()

    await expect(page).toHaveURL(/\/camps\/create$/)

    const { campPrototype, campInfo } = await createCampDialogStep2.submit()
    const camp = new Camp(page, campInfo.campId, `camp ${runId}`, campInfo)

    await camp.delete()
    expect(campPrototype).toBe(copiedCampUri)
  })
})
