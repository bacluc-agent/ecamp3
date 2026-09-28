import { expect, Page } from '@playwright/test'

export type ClipboardStubFixtureType = {
  clipboardStub: ClipboardStub
}

// noinspection JSUnusedGlobalSymbols
export const clipboardStubFixture = {
  clipboardStub: async (
    { page }: { page: Page },
    use: (a: ClipboardStub) => Promise<void>
  ) => {
    await use(new ClipboardStub(page))
  },
}

// context.grantPermissions() is not usable here. In playwright-core 1.63.0 (pinned by
// e2e/package.json and docker-compose.yml) the WebKit context's doGrantPermissions throws
// Error("Method not implemented.") and the Firefox BiDi permission map has no
// clipboard-read, so it throws Error("Unknown permission: clipboard-read"). Overriding
// navigator.clipboard and navigator.permissions in an init script is the only cross-browser
// way, so do not "fix" this back to the documented API.
export class ClipboardStub {
  constructor(private readonly _page: Page) {}

  async readText(text: string, permissionState?: PermissionState) {
    await this._stubRead(text, permissionState, 'resolved')
  }

  async readFailure() {
    await this._stubRead('', undefined, 'rejected')
  }

  // The app has no way to tell a test that a stubbed read finished; the stub writes the
  // marker, so the stub also owns the wait for it. CreateCampDialogStep2 must not depend
  // on it or it can only be used together with this fixture.
  async expectReadSettled(settlement: 'resolved' | 'rejected') {
    await expect(this._page.locator('html')).toHaveAttribute(
      'data-clipboard-read-settlement',
      settlement
    )
  }

  private async _stubRead(
    text: string,
    permissionState: PermissionState | undefined,
    settlement: 'resolved' | 'rejected'
  ) {
    await this._page.addInitScript(
      ({ clipboardText, clipboardPermissionState, clipboardSettlement }) => {
        let readSucceeded = clipboardPermissionState === 'granted'
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: {
            ...navigator.clipboard,
            readText: async () => {
              // document.documentElement is null while an init script runs, so the
              // settlement marker can only be written once the app itself calls readText.
              const root = document.documentElement
              root.dataset.clipboardReadSettlement = 'pending'
              if (clipboardSettlement === 'rejected') {
                root.dataset.clipboardReadSettlement = 'rejected'
                throw new DOMException('denied', 'NotAllowedError')
              }
              readSucceeded = true
              root.dataset.clipboardReadSettlement = clipboardSettlement
              return clipboardText
            },
            writeText: async () => {},
          },
        })

        const permissions = navigator.permissions
        Object.defineProperty(navigator, 'permissions', {
          configurable: true,
          value: {
            ...permissions,
            query: async (descriptor: { name: string }) => {
              if (descriptor.name === 'clipboard-read') {
                return {
                  state:
                    clipboardPermissionState ?? (readSucceeded ? 'granted' : 'prompt'),
                }
              }
              return permissions.query(descriptor as PermissionDescriptor)
            },
          },
        })
      },
      {
        clipboardText: text,
        clipboardPermissionState: permissionState,
        clipboardSettlement: settlement,
      }
    )
  }
}
