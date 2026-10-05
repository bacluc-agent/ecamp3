import { expect } from '@playwright/test'
import { test } from '@/utils/etest'
import { bipiUser, skilagerCampId } from '@/utils/constants'
import { loginAndSetCookie } from '@/utils/helpers'
import { CommentsPage } from '@/utils/fixtures/pageObjects/commentsPage'

test(
  'writes, reads and deletes an own comment',
  { tag: '@mature' },
  async ({ page, request, runId }) => {
    const text = `Kommentar ${runId}`

    await loginAndSetCookie(page, request, bipiUser)
    await page.goto(`/camps/${skilagerCampId}/Skilager/program`)
    await page.locator('a[href*="/program/activity/"]').first().click()
    await expect(page.getByTestId('comments-toggle')).toBeVisible()

    await page.getByTestId('comments-toggle').click()
    const commentsPage = new CommentsPage(page)
    await expect(commentsPage.panel).toBeVisible()
    const comment = await commentsPage.addComment(text)
    await expect(comment).toBeVisible()

    await page.reload()
    await page.getByTestId('comments-toggle').click()
    await expect(comment).toBeVisible()

    await commentsPage.deleteComment(comment)
  }
)

test(
  'submits with ctrl+enter without inserting a line break',
  { tag: '@mature' },
  async ({ page, request, runId }) => {
    const text = `Tastatur ${runId}`

    await loginAndSetCookie(page, request, bipiUser)
    await page.goto(`/camps/${skilagerCampId}/Skilager/program`)
    await page.locator('a[href*="/program/activity/"]').first().click()
    await page.getByTestId('comments-toggle').click()

    const commentsPage = new CommentsPage(page)
    const comment = await commentsPage.addComment(text, true)
    await expect(comment).toBeVisible()

    await expect(comment.locator('.ProseMirror')).toHaveText(text)
    expect(await comment.locator('.ProseMirror').innerHTML()).not.toContain('<br')

    await commentsPage.deleteComment(comment)
  }
)
