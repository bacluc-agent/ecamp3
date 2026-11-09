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
  programPageFixture,
  ProgramPageFixtureType,
} from '@/utils/fixtures/pageObjects/camp/program/programPage'
import { campFixture, CampFixtureType } from '@/utils/fixtures/domainObjects/camp'

const fixtureObject = {
  ...runIdFixture,
  ...loginPageFixture,
  ...camplistPageFixture,
  ...programPageFixture,
  ...campFixture,
}

export const test = base.extend<
  LoginPageFixtureType &
    CampListPageFixtureType &
    ProgramPageFixtureType &
    RunIdFixtureType &
    CampFixtureType
>(fixtureObject)
