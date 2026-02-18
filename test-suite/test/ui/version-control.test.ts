import type { Observer } from '@playcanvas/observer';
import { expect, test, type Page } from '@playwright/test';

import { capture } from '../../lib/capture';
import {
    checkCookieAccept,
    createProject,
    deleteProject
} from '../../lib/common';
import { editorBlankUrl, editorUrl } from '../../lib/config';
import { middleware } from '../../lib/middleware';
import { uniqueName, wait } from '../../lib/utils';

test.describe.configure({
    mode: 'serial'
});

test.describe('branch/checkpoint/diff/merge', () => {
    const projectName = uniqueName('ui-vc');
    let projectId: number;
    let page: Page;
    let materialId: number;

    let mainBranchId: string;
    let mainCheckpointId: string;

    let redBranchId: string;

    let greenBranchId: string;
    let greenCheckpointId: string;

    test.describe.configure({
        mode: 'serial'
    });

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await middleware(page.context());

        // create a temporary project
        await page.goto(editorBlankUrl(), { waitUntil: 'networkidle' });
        await checkCookieAccept(page);
        projectId = await createProject(page, projectName);
    });

    test.afterAll(async () => {
        // delete temporary project
        await page.goto(editorBlankUrl(), { waitUntil: 'networkidle' });
        await deleteProject(page, projectId);

        await page.close();
    });

    test('create base checkpoint', async () => {
        expect(await capture('editor', page, async () => {
            await page.goto(editorUrl(projectId), { waitUntil: 'networkidle' });

            [materialId, mainBranchId, mainCheckpointId] = await page.evaluate(async () => {
                // setup material
                const material = await window.editor.api.globals.assets.createMaterial({ name: 'TEST_MATERIAL' });

                // create checkpoint
                const checkpoint = await window.editor.api.globals.rest.checkpoints.checkpointCreate({
                    projectId: window.editor.api.globals.projectId,
                    branchId: window.editor.api.globals.branchId,
                    description: 'BASE'
                }).promisify();

                return [
                    material.get('id'),
                    window.editor.api.globals.branchId,
                    checkpoint.id
                ];
            });
        })).toStrictEqual([]);
    });

    test('create red branch', async () => {
        expect(await capture('editor', page, async () => {
            // open version control dialog
            await page.locator('.pcui-element.font-regular.logo').click();
            await page.locator('span').filter({ hasText: /^Version Control$/ }).click();

            // create red branch
            await page.locator(`#checkpoint-${mainCheckpointId}`).locator('.pcui-button.dropdown').click();
            await page.locator('.pcui-menu-item').filter({ hasText: /^New Branch$/ }).first().click();
            await page.getByRole('textbox').nth(3).fill('red');
            await page.getByText('Create New Branch').click();

            // wait for page to reload
            await wait(5000);
            await page.waitForLoadState('networkidle');
            redBranchId = await page.evaluate(() => window.editor.api.globals.branchId);

            // set material color RED
            await page.evaluate(async (materialId) => {
                const material = await window.editor.api.globals.assets.findOne((asset: Observer) => asset.get('id') === materialId);
                material.set('data.diffuse', [1, 0, 0]);
            }, materialId);

            // open version control dialog
            await page.locator('.pcui-element.font-regular.logo').click();
            await page.locator('span').filter({ hasText: /^Version Control$/ }).first().click();

            // create checkpoint
            await page.getByText('Checkpoint', { exact: true }).click();
            await page.getByRole('textbox').nth(3).fill('RED');
            await page.getByText('Create Checkpoint', { exact: true }).click();
            await page.getByText('RED', { exact: true }).waitFor({ state: 'visible' });
        })).toStrictEqual([]);
    });

    test('create green branch', async () => {
        expect(await capture('editor', page, async () => {
            // select main branch
            await page.getByText('main', { exact: true }).click();

            // create green branch
            await page.locator(`#checkpoint-${mainCheckpointId}`).locator('.pcui-button.dropdown').click();
            await page.locator('.pcui-menu-item').filter({ hasText: /^New Branch$/ }).first().click();
            await page.getByRole('textbox').nth(3).fill('green');
            await page.getByText('Create New Branch').click();

            // wait for page to reload
            await wait(5000);
            await page.waitForLoadState('networkidle');
            greenBranchId = await page.evaluate(() => window.editor.api.globals.branchId);

            // set material color GREEN
            await page.evaluate(async (materialId) => {
                const material = await window.editor.api.globals.assets.findOne((asset: Observer) => asset.get('id') === materialId);
                material.set('data.diffuse', [0, 1, 0]);
            }, materialId);

            // open version control dialog
            await page.locator('.pcui-element.font-regular.logo').click();
            await page.locator('span').filter({ hasText: /^Version Control$/ }).first().click();

            // create checkpoint
            await page.getByText('Checkpoint', { exact: true }).click();
            await page.getByRole('textbox').nth(3).fill('GREEN');
            await page.getByText('Create Checkpoint', { exact: true }).click();
            await page.getByText('GREEN', { exact: true }).waitFor({ state: 'visible' });

            // capture green checkpoint id
            greenCheckpointId = await page.evaluate(async () => {
                const checkpoints = await window.editor.api.globals.rest.branches.branchCheckpoints({
                    branchId: window.editor.api.globals.branchId,
                    limit: 1
                }).promisify();
                return checkpoints.result[0].id;
            });
        })).toStrictEqual([]);
    });

    test('diff between green and main branch', async () => {
        expect(await capture('editor', page, async () => {
            // open version control dialog
            await page.locator('.pcui-element.font-regular.logo').click();
            await page.locator('span').filter({ hasText: /^Version Control$/ }).first().click();

            // click view diff
            await page.locator('.branch-actions').getByText('View Diff').click();

            // select green checkpoint (left) via diff-mode checkbox
            await page.locator(`#checkpoint-${greenCheckpointId} .ui-checkbox.tick`).click();

            // switch to main branch and wait for its checkpoints to load
            await page.getByText('main', { exact: true }).click();
            await page.locator(`#checkpoint-${mainCheckpointId}`).waitFor({ state: 'visible' });

            // select main checkpoint (right) via diff-mode checkbox
            await page.locator(`#checkpoint-${mainCheckpointId} .ui-checkbox.tick`).click();

            // compare
            await page.locator('.ui-button.compare:not(.disabled)').click();

            // wait for diff to load
            await page.waitForSelector('.picker-conflict-manager.diff');

            // close diff viewer
            await page.locator('.picker-conflict-manager .close').click();
        })).toStrictEqual([]);
    });

    test('switch to main branch', async () => {
        expect(await capture('editor', page, async () => {
            // select main branch and open its dropdown
            await page.locator(`#branch-${mainBranchId}`).click();
            await page.locator(`#branch-${mainBranchId}`).locator('.pcui-button.dropdown').click();
            await page.getByText('Switch To This Branch').click();

            // wait for page to reload
            await wait(5000);
            await page.waitForLoadState('networkidle');
        })).toStrictEqual([]);
    });

    test('merge red branch', async () => {
        expect(await capture('editor', page, async () => {
            // open version control dialog
            await page.locator('.pcui-element.font-regular.logo').click();
            await page.locator('span').filter({ hasText: /^Version Control$/ }).click();

            // start merge
            await page.locator('li').filter({ hasText: redBranchId }).locator('.pcui-button.dropdown').click();
            await page.getByText('Merge Into Current Branch').click();

            // uncheck checkpoint create
            await page.locator('div:nth-child(3) > div > div:nth-child(2) > .content > .ui-checkbox').click();

            // check close branch
            await page.locator('div:nth-child(3) > .content > .ui-checkbox').first().click();

            // create merge
            await page.getByText('START MERGE').click();

            // apply merge
            await page.waitForSelector([
                '.picker-conflict-manager.diff',
                '.content',
                '.ui-panel',
                '.content',
                '.left',
                '.content',
                '.confirm:not(.hidden)'
            ].join(' > '));
            await page.getByText('COMPLETE MERGE').click();

            // wait for page to reload
            await wait(5000);
            await page.waitForLoadState('networkidle');
        })).toStrictEqual([]);
    });

    test('merge green branch', async () => {
        expect(await capture('editor', page, async () => {
            // open version control dialog
            await page.locator('.pcui-element.font-regular.logo').click();
            await page.locator('span').filter({ hasText: /^Version Control$/ }).click();

            // start merge
            await page.locator('li').filter({ hasText: greenBranchId }).locator('.pcui-button.dropdown').click();
            await page.getByText('Merge Into Current Branch').click();

            // uncheck checkpoint create
            await page.locator('div:nth-child(3) > div > div:nth-child(2) > .content > .ui-checkbox').click();

            // create merge
            await page.getByText('START MERGE').click();

            // review conflicts
            await page.waitForSelector([
                '.picker-conflict-manager',
                '.content',
                '.ui-panel',
                '.content',
                '.right',
                '.content',
                '.bottom',
                '.content',
                '.theirs',
                '.content',
                '.ui-button:not(.disabled)'
            ].join(' > '));
            await page.getByText('USE ALL FROM THIS BRANCH').nth(1).click();
            await page.waitForSelector([
                '.picker-conflict-manager',
                '.content',
                '.ui-panel',
                '.content',
                '.left',
                '.content',
                '.ui-button:not(.disabled)'
            ].join(' > '));
            await page.getByText('REVIEW MERGE').click();

            // apply merge
            await page.waitForSelector([
                '.picker-conflict-manager.diff',
                '.content',
                '.ui-panel',
                '.content',
                '.left',
                '.content',
                '.confirm:not(.hidden)'
            ].join(' > '));
            await page.getByText('COMPLETE MERGE').click();

            // wait for page to reload
            await wait(5000);
            await page.waitForLoadState('networkidle');
        })).toStrictEqual([]);
    });

    test('restore checkpoint', async () => {
        expect(await capture('editor', page, async () => {
            // open version control dialog
            await page.locator('.pcui-element.font-regular.logo').click();
            await page.locator('span').filter({ hasText: /^Version Control$/ }).click();

            // start restore checkpoint
            await page.locator(`#checkpoint-${mainCheckpointId}`).locator('.pcui-button.dropdown').click();
            await page.locator('.pcui-menu-item').filter({ hasText: /^Restore$/ }).first().click();

            // uncheck checkpoint create
            await page.locator('.content > div:nth-child(2) > .content > .ui-checkbox').first().click();

            // restore checkpoint
            await page.getByText('Restore Checkpoint', { exact: true }).click();

            // wait for page to reload
            await wait(5000);
            await page.waitForLoadState('networkidle');
        })).toStrictEqual([]);
    });

    test('hard reset checkpoint', async () => {
        expect(await capture('editor', page, async () => {
            // open version control dialog
            await page.locator('.pcui-element.font-regular.logo').click();
            await page.locator('span').filter({ hasText: /^Version Control$/ }).click();

            // start hard reset
            await page.locator(`#checkpoint-${mainCheckpointId}`).locator('.pcui-button.dropdown').click();
            await page.locator('.pcui-menu-item').filter({ hasText: /^Hard Reset$/ }).first().click();

            // confirm hard reset
            await page.locator('div').filter({ hasText: /^ARE YOU SURE\?Type "hard reset" to confirm$/ })
            .getByRole('textbox').fill('hard reset');

            // hard reset
            await page.getByText('Hard Reset To Checkpoint', { exact: true }).click();

            // wait for page to reload
            await wait(5000);
            await page.waitForLoadState('networkidle');
        })).toStrictEqual([]);
    });

    test('delete red branch', async () => {
        expect(await capture('editor', page, async () => {
            // open version control dialog
            await page.locator('.pcui-element.font-regular.logo').click();
            await page.locator('span').filter({ hasText: /^Version Control$/ }).click();

            // change filter to closed branches
            await page.locator('.pcui-select-input-value').filter({ hasText: 'Favorite Branches' }).click();
            await page.getByText('Closed Branches').click();

            // start delete red branch
            await page.locator(`#branch-${redBranchId}`).locator('.pcui-button.dropdown').click();
            await page.locator('div').filter({ hasText: 'Delete This Branch' }).nth(4).click();

            // confirm delete
            await page.getByRole('textbox').nth(3).fill('red');

            // delete branch
            await page.getByText('Delete Branch', { exact: true }).click();

            // reload page
            // FIXME: branch list currently not updated on delete
            await page.reload({ waitUntil: 'networkidle' });
        })).toStrictEqual([]);
    });

    test('delete green branch', async () => {
        expect(await capture('editor', page, async () => {
            // open version control dialog
            await page.locator('.pcui-element.font-regular.logo').click();
            await page.locator('span').filter({ hasText: /^Version Control$/ }).click();

            // start delete green branch
            await page.locator(`#branch-${greenBranchId}`).locator('.pcui-button.dropdown').click();
            await page.locator('div').filter({ hasText: 'Delete This Branch' }).nth(4).click();

            // confirm delete
            await page.getByRole('textbox').nth(3).fill('green');

            // delete branch
            await page.getByText('Delete Branch', { exact: true }).click();
        })).toStrictEqual([]);
    });
});
