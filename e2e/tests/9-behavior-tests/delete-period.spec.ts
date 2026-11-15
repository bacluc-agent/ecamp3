import { expect } from '@playwright/test'
import { test } from '@/utils/etest'

test('makes deleting a period require an exact description', async ({
  createCamp,
  runId,
}) => {
  const camp = await createCamp('Keine Vorlage')
  const periods = camp.periodList
  const secondPeriod = `Second period ${runId}`
  const thirdPeriod = `Third period ${runId}`
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const in2Days = new Date()
  in2Days.setDate(in2Days.getDate() + 2)
  const start = tomorrow.toLocaleDateString('de-CH')
  const end = in2Days.toLocaleDateString('de-CH')

  await periods.goto()
  await periods.create(secondPeriod, start, end)
  const deleteDialog = await periods.openDelete(secondPeriod)
  await expect(deleteDialog.scheduleEntryWarning).toContainText('keine Zeitplaneinträge')
  await expect(deleteDialog.deleteButton).toBeDisabled()
  await deleteDialog.fillPrompt('wrong')
  await expect(deleteDialog.deleteButton).toBeDisabled()
  await deleteDialog.fillPrompt(secondPeriod)
  await expect(deleteDialog.deleteButton).toBeEnabled()
  await deleteDialog.submit()
  await periods.expectHidden(secondPeriod)

  await periods.create(thirdPeriod, start, end)
  await camp.program(thirdPeriod).goto()
  await camp.program(thirdPeriod).createActivity(`Activity one ${runId}`)
  await camp.program(thirdPeriod).createActivity(`Activity two ${runId}`)

  const populatedDeleteDialog = await periods.openDelete(thirdPeriod)
  await expect(populatedDeleteDialog.scheduleEntryWarning).toContainText(
    '2 Zeitplaneinträge'
  )
  await populatedDeleteDialog.fillPrompt(thirdPeriod)
  await populatedDeleteDialog.submit()
  await periods.expectHidden(thirdPeriod)

  await camp.delete()
})
