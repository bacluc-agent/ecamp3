import { Page } from '@playwright/test'

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

export class ClipboardStub {
  constructor(private readonly _page: Page) {}

  async readText(text: string, permissionState?: PermissionState) {
    await this._stubRead(text, permissionState, 'resolved')
  }

  async readFailure() {
    await this._stubRead('', undefined, 'rejected')
  }

  private async _stubRead(
    text: string,
    permissionState: PermissionState | 'unaccessible' | undefined,
    settlement: 'resolved' | 'rejected'
  ) {
    await this._page.addInitScript(
      ({ clipboardText, clipboardPermissionState, clipboardSettlement }) => {
        let readSucceeded = clipboardPermissionState === 'granted'
        const clipboard = navigator.clipboard
        Object.defineProperty(clipboard, 'readText', {
          configurable: true,
          value: async () => {
            if (clipboardSettlement === 'rejected') {
              throw new DOMException('denied', 'NotAllowedError')
            }
            readSucceeded = true
            return clipboardText
          },
        })
        Object.defineProperty(clipboard, 'writeText', {
          configurable: true,
          value: async () => {},
        })

        const permissions = navigator.permissions
        const realQuery = permissions.query.bind(permissions)
        Object.defineProperty(permissions, 'query', {
          configurable: true,
          value: async (descriptor: { name: string }) => {
            if (descriptor.name === 'clipboard-read') {
              if (clipboardPermissionState === 'unaccessible') {
                throw new TypeError(
                  "'clipboard-read' (value of 'name' member of PermissionDescriptor) is not a valid value for enumeration PermissionName."
                )
              }
              return {
                state: clipboardPermissionState ?? (readSucceeded ? 'granted' : 'prompt'),
              }
            }
            return realQuery(descriptor as PermissionDescriptor)
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
