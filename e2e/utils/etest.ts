import { test as base } from '@playwright/test'
import { runIdFixture, RunIdFixtureType } from '@/utils/fixtures/runId'
import {
  loginPageFixture,
  LoginPageFixtureType,
} from '@/utils/fixtures/pageObjects/loginPage'
import {
  camplistPageFixture,
  CampListPageFixtureType,
} from '@/utils/fixtures/pageObjects/campListPage'
import {
  profilePageFixture,
  ProfilePageFixtureType,
} from '@/utils/fixtures/pageObjects/profilePage'
import {
  userMenuFixture,
  UserMenuFixtureType,
} from '@/utils/fixtures/pageObjects/userMenu'
import { campFixture, CampFixtureType } from '@/utils/fixtures/domainObjects/camp'

const fixtureObject = {
  ...runIdFixture,
  ...loginPageFixture,
  ...camplistPageFixture,
  ...profilePageFixture,
  ...userMenuFixture,
  ...campFixture,
}

export const test = base.extend<
  LoginPageFixtureType &
    CampListPageFixtureType &
    ProfilePageFixtureType &
    UserMenuFixtureType &
    RunIdFixtureType &
    CampFixtureType
>(fixtureObject)
