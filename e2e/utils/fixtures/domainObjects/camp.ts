import { Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'
import { LoginPage } from '@/utils/fixtures/pageObjects/loginPage'
import { bipiUser } from '@/utils/constants'
import { CampInfo } from '@/utils/fixtures/pageObjects/camp/admin/campInfo'
import { CampActivitySettings } from '@/utils/fixtures/pageObjects/camp/admin/campActivitySettings'
import { CampListPage } from '@/utils/fixtures/pageObjects/campListPage'
import type { ClipboardStub } from '@/utils/fixtures/clipboardStub'
import type { CreateCampDialogStep2 } from '@/utils/fixtures/pageObjects/createCamp/createCampDialogStep2'

type CampPrototype = 'empty' | string

export type CampFixtureType = {
  createCamp: (prototype: CampPrototype) => Promise<Camp>
  newCamp: (campTitle?: string) => CreateCamp
}

export const campFixture = {
  createCamp: async (
    { page, runId }: { page: Page; runId: string },
    use: (a: CampFixtureType['createCamp']) => Promise<void>
  ) => {
    await use((prototype) => new CreateCamp(page, runId).create(prototype))
  },
  newCamp: async (
    { page, runId }: { page: Page; runId: string },
    use: (a: CampFixtureType['newCamp']) => Promise<void>
  ) => {
    // The builders are per test, never module state: with fullyParallel a worker runs its
    // assigned tests sequentially, so a builder left over from a finished test would make this
    // teardown delete an already deleted camp. The delete is not cosmetic either: Camps.vue puts
    // the create button last in the list, so every camp a test leaks moves it further down the
    // page for the test that runs next.
    const builders: CreateCamp[] = []
    let thrown: unknown
    try {
      await use((campTitle) => {
        const builder = new CreateCamp(page, runId, campTitle)
        builders.push(builder)
        return builder
      })
    } catch (error) {
      thrown = error
    }
    // Every builder is deleted even if an earlier one throws, and all of them run even if the
    // test already failed. They are deleted SEQUENTIALLY, on purpose: Promise.allSettled over
    // this list drove two concurrent Camp.delete() calls through one shared page, where the
    // goto, the click and the fill of one camp interleave with another's, which is not the
    // guarantee the comment above the fixture claims -- that a second newCamp() in one test
    // does not leak its camp. The per-item catch is what keeps "every builder is deleted" true
    // without letting the first failure end the loop. Not a finally block because eslint's
    // no-unsafe-finally rejects a throw from one. The test's own error wins over a delete
    // error, which is the order that keeps the diagnostic a human needs.
    let failed: unknown
    for (const builder of builders) {
      try {
        await builder.deleteCreatedCamp()
      } catch (error) {
        failed ??= error
      }
    }
    if (thrown === undefined && failed !== undefined) throw failed
    if (thrown !== undefined) throw thrown
  },
}

export class CreateCamp {
  private readonly _page: Page
  private readonly _campTitle: string
  private _step2: CreateCampDialogStep2 | undefined

  constructor(page: Page, runId: string, campTitle = `camp ${runId}`) {
    this._page = page
    this._campTitle = campTitle
  }

  @boxedStep
  async openStep2(user = bipiUser) {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const in2Days = new Date(now)
    in2Days.setDate(in2Days.getDate() + 2)

    const loginPage = await new LoginPage(this._page).open()
    const campListPage = await loginPage.loginToCampList(user)
    const createCampDialogStep1 = await campListPage.openCreateCampDialog()
    await createCampDialogStep1.fillForm(tomorrow, in2Days, this._campTitle)

    this._step2 = await createCampDialogStep1.next()
    return this._step2
  }

  // The cleanup lives here, not in the specs, so a spec never holds a camp handle. A step2 that
  // never submitted, or a submit that never reached the navigation, leaves createdCampId unset
  // and there is nothing to delete.
  @boxedStep
  async deleteCreatedCamp() {
    const campId = this._step2?.createdCampId
    if (campId) await this.campFor(campId).delete()
  }

  // The clipboard dialog sequence is load-bearing and its order is a rule that
  // CreateCampDialogStep2.grantClipboardRead() documents, so it is written once here instead of
  // being composed inline by every spec that pastes a prototype. It lives on the builder rather
  // than on the step 2 page object because expectReadSettled() is the wait for the stub that
  // wrote the settlement, and a page object depending on it could only be used together with
  // that fixture.
  @boxedStep
  async useCopiedCampPrototype(
    clipboardStub: ClipboardStub,
    settlement: 'resolved' | 'rejected'
  ) {
    // openStep2() overwrites _step2 and navigates to /login, so without this guard a caller that
    // had already opened step 2 would silently lose the form.
    const step2 = this._step2 ?? (await this.openStep2())
    await step2.selectOtherCampPrototype()
    await step2.grantClipboardRead()
    await clipboardStub.expectReadSettled(settlement)
    await step2.closeClipboardInfoDialog()
    return step2
  }

  @boxedStep
  async create(prototype: CampPrototype, user = bipiUser) {
    const createCampDialogStep2 = await this.openStep2(user)
    const { campInfo } = await createCampDialogStep2
      .selectPrototype(prototype)
      .then((value) => value.submit())

    return new Camp(this._page, campInfo.campId, this._campTitle, campInfo)
  }

  campFor(campId: string): Camp {
    return new Camp(this._page, campId, this._campTitle, new CampInfo(this._page, campId))
  }
}

export class Camp {
  constructor(
    private readonly _page: Page,
    private readonly _campId: string,
    private readonly _campTitle: string,
    private readonly _campInfo: CampInfo
  ) {}

  get campId(): string {
    return this._campId
  }

  get campTitle(): string {
    return this._campTitle
  }

  get campInfo(): CampInfo {
    return this._campInfo
  }

  get campActivitySettings() {
    return new CampActivitySettings(this._page, this._campId)
  }

  @boxedStep
  async delete() {
    const campInfo = this._campInfo
    await campInfo.goto()
    const dialog = await campInfo.openDeleteDialog()
    await dialog.fillPrompt(this._campTitle)
    await dialog.submit()

    const campListPage = await new CampListPage(this._page).goto()
    await campListPage.expectCampNotListed(this._campTitle)
  }
}
