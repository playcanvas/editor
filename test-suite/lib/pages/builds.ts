import { expect, type Page } from '@playwright/test';

import { JOB_TIMEOUT } from '../constants';
import { EditorShell } from './common';

type Kind = 'download' | 'publish';

// the footer action and the completed row's artifact link differ per build kind
const ACTION: Record<Kind, string> = { download: 'web-download', publish: 'publish' };
const ARTIFACT: Record<Kind, string> = { download: 'download', publish: 'open' };

/** open the builds & publish dialog from the toolbar */
export const openBuilds = async (page: Page) => {
    await page.locator('[data-toolbar-id="publish"]').click();
    await page.locator('.picker-builds-publish').waitFor({ state: 'visible' });
};

/** the newest completed build row of a kind */
export const buildRow = (page: Page, kind: Kind) => page.locator(`.build-item.${kind}.complete`).first();

/** the artifact link of the newest completed build row */
export const buildArtifact = (page: Page, kind: Kind) => buildRow(page, kind).locator(`.row-artifact.${ARTIFACT[kind]}`);

/** start a build from the builds dialog and wait for its row to complete */
export const startBuild = async (page: Page, kind: Kind) => {
    // the form gates its action button on the scene list
    const scenes = page.waitForResponse(/\/api\/projects\/\d+\/scenes/);
    await page.locator(`.builds-toolbar > .${kind}`).click();
    await scenes;
    await page.locator(`.picker-publish-new > .form-footer > .${ACTION[kind]}.pcui-button:not(.pcui-disabled)`).click();
    await buildArtifact(page, kind).waitFor({ state: 'visible', timeout: JOB_TIMEOUT });
};

/** delete the newest completed build of a kind so the next run starts empty */
export const deleteBuild = async (page: Page, kind: Kind) => {
    await buildRow(page, kind).locator('.kebab').click();
    await page.locator('.picker-builds-menu .pcui-menu-item').filter({ hasText: /^Delete$/ }).first().click();
    await new EditorShell(page).confirm.yes.click();
    await expect(page.locator(`.build-item.${kind}`)).toHaveCount(0, { timeout: JOB_TIMEOUT });
};

/** dismiss the project dialog hosting the builds panel */
export const closeBuilds = async (page: Page) => {
    await page.locator('.picker-project .close').first().click();
    await page.locator('.picker-builds-publish').waitFor({ state: 'hidden' });
};
