import { expect } from '@playwright/test'
import { grgrCampId } from '@/utils/constants'
import { test } from '@/utils/etest'
import { CreateCampDialogStep2 } from '@/utils/fixtures/pageObjects/createCamp/createCampDialogStep2'
import { Camp } from '@/utils/fixtures/domainObjects/camp'

const copiedCampUrl = `http://localhost:3000/camps/${grgrCampId}/GRGR/dashboard`
const copiedCampUri = `/camps/${grgrCampId}`

test.describe('camp prototype clipboard', { tag: '@mature' }, () => {
  test.describe.configure({ timeout: 210_000 })

  let createCampDialogStep2: CreateCampDialogStep2
  let camp: Camp

  test.beforeEach(async ({ openCreateCampStep2, clipboardStub }) => {
    await clipboardStub.readText(copiedCampUrl)
    createCampDialogStep2 = await openCreateCampStep2()
  })

  test.afterEach(async ({}) => {
    await camp?.delete()
  })

  test('loads a copied camp URL from the clipboard', async ({ page, clipboardStub }) => {
    await createCampDialogStep2.selectOtherCampPrototype()
    await createCampDialogStep2.grantClipboardRead()
    await clipboardStub.expectReadSettled('resolved')
    await createCampDialogStep2.closeClipboardInfoDialog()

    await createCampDialogStep2.expectCopiedPrototype()

    const { campPrototype, campInfo } = await createCampDialogStep2.submit()
    camp = new Camp(page, campInfo.campId, '', campInfo)

    expect(campPrototype).toBe(copiedCampUri)
  })

  /* eslint-disable playwright/expect-expect, @typescript-eslint/no-unused-vars */
  test('uses the manual URL when clipboard read fails', async ({
    clipboardStub,
    runId,
  }) => {
    // TODO
  })

  test('does not submit a pre-granted auto-loaded clipboard prototype', async ({
    clipboardStub,
    runId,
  }) => {
    // TODO
  })

  test('falls back to the focused manual URL field when clipboard access is unqueryable', async ({
    clipboardStub,
    runId,
  }) => {
    // TODO
  })
  /* eslint-enable playwright/expect-expect, @typescript-eslint/no-unused-vars */
})
