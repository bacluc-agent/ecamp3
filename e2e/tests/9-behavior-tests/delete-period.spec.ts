import { expect } from '@playwright/test'
import { test } from '@/utils/etest'

// The camp is created with a period for tomorrow, so use later dates to avoid an overlap error.
const daysFromNow = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

test('makes deleting a period require an exact description', async ({
  createCamp,
  runId,
}) => {
  const camp = await createCamp('Keine Vorlage')
  const periods = camp.periodList
  const secondPeriod = `Second period ${runId}`
  const thirdPeriod = `Third period ${runId}`

  await periods.goto()
  await periods.create(secondPeriod, daysFromNow(10), daysFromNow(12))
  const deleteDialog = await periods.openDelete(secondPeriod)
  await expect(deleteDialog.scheduleEntryWarning).toContainText('keine Zeitplaneinträge')
  await expect(deleteDialog.deleteButton).toBeDisabled()
  await deleteDialog.fillPrompt('wrong')
  await expect(deleteDialog.deleteButton).toBeDisabled()
  await deleteDialog.fillPrompt(secondPeriod)
  await expect(deleteDialog.deleteButton).toBeEnabled()
  await deleteDialog.submit()
  await periods.expectHidden(secondPeriod)

  await periods.create(thirdPeriod, daysFromNow(20), daysFromNow(22))
  // Activities need a category, so create one before adding them
  const activitySettings = camp.campActivitySettings
  await activitySettings.goTo()
  const categoryDialog = await activitySettings.openCreateCategoryDialog()
  await categoryDialog.fillForm('AC', `Category ${runId}`)
  await categoryDialog.submit()
  await camp.program(thirdPeriod).goto()
  await camp.program(thirdPeriod).createActivity(`Activity one ${runId}`)
  await camp.program(thirdPeriod).createActivity(`Activity two ${runId}`)

  await periods.goto()
  const populatedDeleteDialog = await periods.openDelete(thirdPeriod)
  await expect(populatedDeleteDialog.scheduleEntryWarning).toContainText(
    '2 Zeitplaneinträge'
  )
  await expect(populatedDeleteDialog.deleteButton).toBeDisabled()
  await populatedDeleteDialog.fillPrompt('wrong')
  await expect(populatedDeleteDialog.deleteButton).toBeDisabled()
  await populatedDeleteDialog.fillPrompt(thirdPeriod)
  await expect(populatedDeleteDialog.deleteButton).toBeEnabled()
  await populatedDeleteDialog.submit()
  await periods.expectHidden(thirdPeriod)

  await camp.delete()
})
