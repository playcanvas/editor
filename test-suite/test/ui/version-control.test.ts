import type { BrowserContext, Page } from '@playwright/test';

import { checkCookieAccept, createProject, deleteProject } from '../../lib/common';
import { editorBlankUrl, editorUrl } from '../../lib/config';
import { JOB_TIMEOUT } from '../../lib/constants';
import { expect, test } from '../../lib/fixtures';
import { middleware } from '../../lib/middleware';
import {
    armReload,
    branchIds,
    branchMenuAction,
    completeMerge,
    createBranchFromCheckpoint,
    createCheckpoint,
    createCheckpointApi,
    dialogConfirm,
    dialogInput,
    diffOverlay,
    mergeOverlay,
    openSwitcher,
    openVc,
    selectCheckpoint,
    setBranchFilter,
    toggleDialogCheck,
    waitReload
} from '../../lib/pages/version-control';
import { waitForEditor } from '../../lib/ready';
import { uniqueName } from '../../lib/utils';

test.describe.configure({
    mode: 'serial'
});

test.describe('branch/checkpoint/diff/merge', () => {
    const projectName = uniqueName('ui-vc');
    let context: BrowserContext;
    let setup: Page;
    let projectId: number;
    let materialId: number;
    let baseDiffuse: number[];

    let mainBranchId: string;
    let mainCheckpointId: string;

    let redBranchId: string;

    let greenBranchId: string;
    let greenCheckpointId: string;

    // the vc flow mutates branches and hard resets history, so it owns its project
    test.beforeAll(async ({ browser, authState }) => {
        context = await browser.newContext({ storageState: authState });
        await middleware(context);
        setup = await context.newPage();
        await setup.goto(editorBlankUrl());
        await setup.locator('.picker-project-cms').waitFor();
        await checkCookieAccept(setup);
        projectId = await createProject(setup, projectName);
    });

    test.afterAll(async () => {
        await deleteProject(setup, projectId);
        await context.close();
    });

    const open = async (page: Page) => {
        await page.goto(editorUrl(projectId, { disableBubbles: true }));
        await waitForEditor(page);
    };

    const diffuse = (page: Page) => page.evaluate((id) => {
        return window.editor.api.globals.assets.get(id)?.get('data.diffuse') as number[];
    }, materialId);

    test('create base checkpoint', async ({ page }) => {
        await open(page);

        materialId = await page.evaluate(async () => {
            const material = await window.editor.api.globals.assets.createMaterial({ name: 'TEST_MATERIAL' });
            return material.get('id') as number;
        });
        baseDiffuse = await diffuse(page);

        const checkpoint = await createCheckpointApi(page, 'BASE');
        mainCheckpointId = checkpoint.id;
        mainBranchId = await page.evaluate(() => window.editor.api.globals.branchId);

        expect(materialId).toBeGreaterThan(0);
        expect(mainCheckpointId).toMatch(/^[0-9a-f-]{36}$/);
    });

    test('create red branch', async ({ page }) => {
        await open(page);

        // open version control and branch from the base checkpoint of main
        await openVc(page);
        redBranchId = await createBranchFromCheckpoint(page, mainCheckpointId, 'red');
        expect(redBranchId).not.toBe(mainBranchId);

        // set material color RED
        await page.evaluate((materialId) => {
            window.editor.api.globals.assets.get(materialId)!.set('data.diffuse', [1, 0, 0]);
        }, materialId);

        // create checkpoint
        await openVc(page);
        await createCheckpoint(page, 'RED');

        expect(await page.evaluate(() => window.editor.api.globals.branchId)).toBe(redBranchId);
    });

    test('create green branch', async ({ page }) => {
        await open(page);

        // open version control (currently on the red branch)
        await openVc(page);

        // view main and branch green from its base checkpoint too
        await openSwitcher(page);
        await setBranchFilter(page, 'Open');
        await page.locator(`#branch-${mainBranchId} .name`).click();
        greenBranchId = await createBranchFromCheckpoint(page, mainCheckpointId, 'green');
        expect(greenBranchId).not.toBe(redBranchId);

        // set material color GREEN
        await page.evaluate((materialId) => {
            window.editor.api.globals.assets.get(materialId)!.set('data.diffuse', [0, 1, 0]);
        }, materialId);

        // create checkpoint
        await openVc(page);
        await createCheckpoint(page, 'GREEN');

        // capture green checkpoint id
        greenCheckpointId = await page.evaluate(async () => {
            const checkpoints = await window.editor.api.globals.rest.branches.branchCheckpoints({
                branchId: window.editor.api.globals.branchId,
                limit: 1
            }).promisify();
            return checkpoints.result[0].id;
        });
        expect(greenCheckpointId).not.toBe(mainCheckpointId);
    });

    test('diff between green and main branch', async ({ page }) => {
        await open(page);

        // open version control (currently on the green branch)
        await openVc(page);

        // enter compare mode and pick the green checkpoint (slot A)
        await page.locator('.vc-top-actions').getByText('Compare', { exact: true }).click();
        await page.locator(`#checkpoint-${greenCheckpointId}`).click();

        // view main and pick its base checkpoint (slot B)
        await openSwitcher(page);
        await setBranchFilter(page, 'Open');
        await page.locator(`#branch-${mainBranchId} .name`).click();
        await page.locator(`#checkpoint-${mainCheckpointId}`).waitFor({ state: 'visible' });
        await page.locator(`#checkpoint-${mainCheckpointId}`).click();

        // compare
        await page.locator('.vc-compare-bar .pcui-button:not(.pcui-disabled)').click();

        // the diff lists the material changed on green
        const overlay = diffOverlay(page);
        await overlay.waitFor({ state: 'visible' });
        await expect(overlay.locator('.vc-diff-sidebar .vc-diff-row').first()).toBeVisible();

        // close diff viewer
        await overlay.locator('.vc-diff-close').click();
        await expect(overlay).toBeHidden();
    });

    test('switch to main branch', async ({ page }) => {
        await open(page);

        // open version control (currently on the green branch)
        await openVc(page);

        // switch to main via the branch row action
        await openSwitcher(page);
        await setBranchFilter(page, 'Open');
        const mainRow = page.locator(`#branch-${mainBranchId}`);
        await mainRow.waitFor({ state: 'visible' });
        await mainRow.hover();
        await armReload(page);
        await mainRow.locator('.switch').click();

        // wait for the editor to reload onto main
        await waitReload(page);
        expect(await page.evaluate(() => window.editor.api.globals.branchId)).toBe(mainBranchId);
    });

    test('merge red branch', async ({ page }) => {
        await open(page);

        // open version control (currently on the main branch)
        await openVc(page);

        // start merge of red into main
        await openSwitcher(page);
        await setBranchFilter(page, 'Open');
        await branchMenuAction(page, redBranchId, /^Merge Into Current Branch$/);

        // skip pre-merge checkpoints and close the source branch after merging
        await page.locator('.vc-dialog').waitFor({ state: 'visible' });
        await toggleDialogCheck(page, 'Take a checkpoint of red');
        await toggleDialogCheck(page, 'Take a checkpoint of main');
        await toggleDialogCheck(page, 'Close red after merging');
        await dialogConfirm(page).click();

        await completeMerge(page);

        // wait for the editor to reload with red's material color on main
        await waitReload(page);
        expect(await diffuse(page)).toStrictEqual([1, 0, 0]);
    });

    test('merge green branch', async ({ page }) => {
        await open(page);

        // open version control (currently on the main branch)
        await openVc(page);

        // start merge of green into main
        await openSwitcher(page);
        await setBranchFilter(page, 'Open');
        await branchMenuAction(page, greenBranchId, /^Merge Into Current Branch$/);

        // skip pre-merge checkpoints
        await page.locator('.vc-dialog').waitFor({ state: 'visible' });
        await toggleDialogCheck(page, 'Take a checkpoint of green');
        await toggleDialogCheck(page, 'Take a checkpoint of main');
        await dialogConfirm(page).click();

        // review conflicts (material color conflicts with the merged red change)
        await mergeOverlay(page).waitFor({ state: 'visible' });
        await mergeOverlay(page).getByRole('radio', { name: /Source/ }).click();
        await mergeOverlay(page).locator('.vc-merge-resolve .pcui-button:not(.pcui-disabled)').filter({ hasText: /^Resolve$/ }).click();
        await completeMerge(page);

        // the resolved conflict takes green's material color
        await waitReload(page);
        expect(await diffuse(page)).toStrictEqual([0, 1, 0]);
    });

    test('restore checkpoint', async ({ page }) => {
        await open(page);

        // open version control (currently on the main branch)
        await openVc(page);

        // start restore of the base checkpoint
        await selectCheckpoint(page, mainCheckpointId);
        await page.locator('.vc-detail-actions').getByText('Restore', { exact: true }).click();

        // skip the pre-restore checkpoint and restore
        await page.locator('.vc-dialog').waitFor({ state: 'visible' });
        await toggleDialogCheck(page, 'Take a checkpoint of the current state first');
        await armReload(page);
        await dialogConfirm(page).click();

        // wait for the editor to reload with the base material color back
        await waitReload(page);
        expect(await diffuse(page)).toStrictEqual(baseDiffuse);
    });

    test('hard reset checkpoint', async ({ page }) => {
        await open(page);

        // open version control (currently on the main branch)
        await openVc(page);

        // start hard reset of the base checkpoint
        await selectCheckpoint(page, mainCheckpointId);
        await page.locator('.vc-detail-actions').getByText('Hard Reset', { exact: false }).click();

        // confirm by typing the checkpoint id (first 7 chars), then hard reset
        await page.locator('.vc-dialog').waitFor({ state: 'visible' });
        await dialogInput(page).fill(mainCheckpointId.substring(0, 7));
        await armReload(page);
        await dialogConfirm(page).click();

        // wait for the editor to reload with base as the branch head
        await waitReload(page);
        const head = await page.evaluate(async () => {
            const checkpoints = await window.editor.api.globals.rest.branches.branchCheckpoints({
                branchId: window.editor.api.globals.branchId,
                limit: 1
            }).promisify();
            return checkpoints.result[0].id;
        });
        expect(head).toBe(mainCheckpointId);
    });

    test('delete red branch', async ({ page }) => {
        await open(page);

        // open version control (currently on the main branch)
        await openVc(page);

        // red was closed during merge -> find it under the Closed filter
        await openSwitcher(page);
        await setBranchFilter(page, 'Closed');
        await branchMenuAction(page, redBranchId, /^Delete This Branch$/);

        // confirm by typing the branch name, then delete
        await page.locator('.vc-dialog').waitFor({ state: 'visible' });
        await dialogInput(page).fill('red');
        await dialogConfirm(page).click();

        // branch delete updates the list in place (no reload); poll until the job lands
        await expect(page.locator('.vc-dialog')).toBeHidden();
        await expect.poll(() => branchIds(page, true), { timeout: JOB_TIMEOUT }).not.toContain(redBranchId);
    });

    test('delete green branch', async ({ page }) => {
        await open(page);

        // open version control (currently on the main branch)
        await openVc(page);

        // green is still open -> find it under the Open filter
        await openSwitcher(page);
        await setBranchFilter(page, 'Open');
        await branchMenuAction(page, greenBranchId, /^Delete This Branch$/);

        // confirm by typing the branch name, then delete
        await page.locator('.vc-dialog').waitFor({ state: 'visible' });
        await dialogInput(page).fill('green');
        await dialogConfirm(page).click();

        // branch delete updates the list in place (no reload); poll until the job lands
        await expect(page.locator('.vc-dialog')).toBeHidden();
        await expect.poll(() => branchIds(page), { timeout: JOB_TIMEOUT }).not.toContain(greenBranchId);
    });
});
