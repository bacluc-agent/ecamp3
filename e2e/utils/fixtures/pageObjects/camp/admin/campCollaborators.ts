import { expect, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'
import { grgrCampId } from '@/utils/constants'
import { DialogCollaboratorInvite } from '@/utils/fixtures/pageObjects/camp/admin/dialogCollaboratorInvite'

export const campCollaboratorsFixture = {
  campCollaborators: async (
    { page }: { page: Page },
    use: (a: CampCollaboratorsFixtureType['campCollaborators']) => Promise<void>
  ) => {
    await use(new CampCollaborators(page, grgrCampId))
  },
}

export type CampCollaboratorsFixtureType = {
  campCollaborators: CampCollaborators
}

export class CampCollaborators {
  static readonly ROUTE = '/admin/collaborators'

  constructor(
    private readonly _page: Page,
    private readonly _campId: string,
    private readonly _inviteCta = _page.getByTestId('collaborator-invite-cta')
  ) {}

  @boxedStep
  async goto() {
    await this._page.goto(`/camps/${this._campId}${CampCollaborators.ROUTE}`)
    return this.loaded()
  }

  @boxedStep
  async loaded() {
    // The invite CTA only renders once the camp collaborations are loaded and
    // the current user turns out to be a manager, so it is the ready gate.
    await expect(this._inviteCta).toBeVisible({ timeout: 20000 })
    return this
  }

  @boxedStep
  async openInviteDialog() {
    await this._inviteCta.click()
    const dialog = new DialogCollaboratorInvite(this._page)
    await dialog.loaded()
    return dialog
  }

  get collaboratorList(): Page {
    return this._page
  }
}
