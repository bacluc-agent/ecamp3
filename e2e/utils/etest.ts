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
import { campFixture, CampFixtureType } from '@/utils/fixtures/domainObjects/camp'
import {
  campCollaboratorsFixture,
  CampCollaboratorsFixtureType,
} from '@/utils/fixtures/pageObjects/camp/admin/campCollaborators'

const fixtureObject = {
  ...runIdFixture,
  ...loginPageFixture,
  ...camplistPageFixture,
  ...campFixture,
  ...campCollaboratorsFixture,
}

export const test = base.extend<
  LoginPageFixtureType &
    CampListPageFixtureType &
    RunIdFixtureType &
    CampFixtureType &
    CampCollaboratorsFixtureType
>(fixtureObject)
