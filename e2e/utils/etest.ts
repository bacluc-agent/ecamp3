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
  campPrintPageFixture,
  CampPrintPageFixtureType,
} from '@/utils/fixtures/pageObjects/camp/admin/campPrintPage'
import {
  campProgramPrintPageFixture,
  CampProgramPrintPageFixtureType,
} from '@/utils/fixtures/pageObjects/print/campProgramPrintPage'
import {
  nuxtPrintPreviewFixture,
  NuxtPrintPreviewFixtureType,
} from '@/utils/fixtures/pageObjects/print/nuxtPrintPreview'

const fixtureObject = {
  ...runIdFixture,
  ...loginPageFixture,
  ...camplistPageFixture,
  ...campFixture,
  ...campPrintPageFixture,
  ...campProgramPrintPageFixture,
  ...nuxtPrintPreviewFixture,
}

export const test = base.extend<
  LoginPageFixtureType &
    CampListPageFixtureType &
    RunIdFixtureType &
    CampFixtureType &
    CampPrintPageFixtureType &
    CampProgramPrintPageFixtureType &
    NuxtPrintPreviewFixtureType
>(fixtureObject)
