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

// the version control picker was rewritten (#2098/#2099/#2100): a branch
// switcher dropdown, Changes/History tabs, a detail pane, an inline checkpoint
// composer, compare mode + a dedicated diff overlay, and vc-dialog dialogs.
// the merge conflict resolution still routes through the (unchanged) legacy
// `picker-conflict-manager`, so those selectors below are preserved.

// the main vc panel (`picker-version-control` is shared with the graph panel)
const VC_PANEL = '.picker-vc';

// vc operations reload the editor via an async, ~1s-delayed messenger event
// (branch.createEnded / branch.switch / merge / restore). a fixed wait races
// that reload; instead mark the document, trigger the op, then wait for a fresh
// document with the editor reloaded.
const armReload = (page: Page) => page.evaluate(() => {
    (window as any).__vcReload = true;
});
const waitReload = async (page: Page) => {
    await page.waitForFunction(() => {
        const w = window as any;
        return w.__vcReload === undefined && !!w.editor?.api?.globals?.branchId;
    }, undefined, { timeout: 90000 });
    await page.waitForLoadState('networkidle');
};

/** open the version control picker via the project logo menu (idempotent) */
const openVc = async (page: Page) => {
    if (await page.locator(VC_PANEL).isVisible().catch(() => false)) {
        return;
    }
    await page.locator('.pcui-element.font-regular.logo').click();
    await page.locator('span').filter({ hasText: /^Version Control$/ }).first().click();
    await page.locator(VC_PANEL).waitFor({ state: 'visible' });
};

/** open the branch switcher dropdown */
const openSwitcher = async (page: Page) => {
    await page.locator('.vc-branch-button').click();
    await page.locator('.vc-branch-panel').waitFor({ state: 'visible' });
};

/** change the branch list filter (Open / Favorites / Closed) */
const setBranchFilter = async (page: Page, label: 'Open' | 'Favorites' | 'Closed') => {
    await page.locator('.vc-branch-filter .pcui-select-input-value').click();
    await page.locator('.vc-branch-filter .pcui-select-input-list').getByText(label, { exact: true }).click();
};

/** run a kebab-menu action on a branch row (row actions are hover-revealed) */
const branchMenuAction = async (page: Page, branchId: string, action: RegExp) => {
    const row = page.locator(`#branch-${branchId}`);
    await row.waitFor({ state: 'visible' });
    await row.hover();
    await row.locator('.kebab').click();
    await page.locator('.pcui-menu-item').filter({ hasText: action }).first().click();
};

/** select a checkpoint in the History list and wait for its detail pane */
const selectCheckpoint = async (page: Page, checkpointId: string) => {
    const row = page.locator(`#checkpoint-${checkpointId}`);
    await row.waitFor({ state: 'visible' });
    await row.click();
    await page.locator('.vc-detail-actions').first().waitFor({ state: 'visible' });
};

/** branch from a checkpoint via the detail pane; resolves to the new branch id */
const createBranchFromCheckpoint = async (page: Page, checkpointId: string, name: string) => {
    await selectCheckpoint(page, checkpointId);
    await page.locator('.vc-detail-actions').getByText('New Branch', { exact: true }).click();
    await page.locator('.vc-dialog').waitFor({ state: 'visible' });
    await dialogInput(page).fill(name);
    await armReload(page);
    await dialogConfirm(page).click();
    // branch create switches to the new branch via the delayed reload
    await waitReload(page);
    return page.evaluate(() => window.editor.api.globals.branchId);
};

const dialogConfirm = (page: Page) => page.locator('.vc-dialog .pcui-button.confirm');
const dialogInput = (page: Page) => page.locator('.vc-dialog input');
const toggleDialogCheck = (page: Page, label: string) => {
    return page.locator('.vc-dialog-check').filter({ hasText: label }).locator('.pcui-boolean-input').click();
};

/** create a checkpoint via the inline composer and confirm it lands in history */
const createCheckpoint = async (page: Page, description: string) => {
    await page.locator('.vc-top-actions').getByText('Checkpoint', { exact: true }).click();
    const textarea = page.locator('.vc-checkpoint-form textarea');
    await textarea.waitFor({ state: 'visible' });
    // pcui's keyChange input re-gates the Create button on keyup, which fill()
    // does not emit; type the value so the button enables
    await textarea.click();
    await textarea.pressSequentially(description);
    await page.locator('.vc-create-checkpoint').click();
    // the new row lands in History via messenger; switch tabs to confirm it
    await page.locator('.vc-tab').filter({ hasText: /^History$/ }).click();
    await page.locator('.vc-history').getByText(description, { exact: true }).waitFor({ state: 'visible' });
};

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
                const createCheckpoint = async (description: string) => {
                    const jobDeferred: PromiseWithResolvers<any> = Promise.withResolvers();
                    const checkpointPromise = new Promise<any>((resolve, reject) => {
                        const handle = window.editor.api.globals.messenger.on('message', async (name: string, data: any) => {
                            const job = await jobDeferred.promise;
                            if (name !== 'job.update' || data.job.id !== job.id) {
                                return;
                            }
                            handle.unbind();
                            const completed = await window.editor.api.globals.rest.jobs.jobGet({ jobId: job.id }).promisify();
                            if (completed.status === 'error') {
                                reject(new Error(completed.messages?.[0] ?? 'Checkpoint create failed'));
                                return;
                            }
                            resolve(completed.data);
                        });
                    });

                    const job = await window.editor.api.globals.rest.checkpoints.checkpointCreate({
                        projectId: window.editor.api.globals.projectId,
                        branchId: window.editor.api.globals.branchId,
                        description
                    }).promisify();
                    jobDeferred.resolve(job);
                    return checkpointPromise;
                };

                // setup material
                const material = await window.editor.api.globals.assets.createMaterial({ name: 'TEST_MATERIAL' });

                // create checkpoint
                const checkpoint = await createCheckpoint('BASE');

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
            // open version control and branch from the base checkpoint of main
            await openVc(page);
            redBranchId = await createBranchFromCheckpoint(page, mainCheckpointId, 'red');

            // set material color RED
            await page.evaluate(async (materialId) => {
                const material = await window.editor.api.globals.assets.findOne((asset: Observer) => asset.get('id') === materialId);
                material.set('data.diffuse', [1, 0, 0]);
            }, materialId);

            // create checkpoint
            await openVc(page);
            await createCheckpoint(page, 'RED');
        })).toStrictEqual([]);
    });

    test('create green branch', async () => {
        expect(await capture('editor', page, async () => {
            // open version control (currently on the red branch)
            await openVc(page);

            // view main and branch green from its base checkpoint too
            await openSwitcher(page);
            await setBranchFilter(page, 'Open');
            await page.locator(`#branch-${mainBranchId} .name`).click();
            greenBranchId = await createBranchFromCheckpoint(page, mainCheckpointId, 'green');

            // set material color GREEN
            await page.evaluate(async (materialId) => {
                const material = await window.editor.api.globals.assets.findOne((asset: Observer) => asset.get('id') === materialId);
                material.set('data.diffuse', [0, 1, 0]);
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
        })).toStrictEqual([]);
    });

    test('diff between green and main branch', async () => {
        expect(await capture('editor', page, async () => {
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

            // wait for the diff overlay to load
            await page.locator('.vc-diff-overlay').waitFor({ state: 'visible' });
            await page.locator('.vc-diff-sidebar .vc-diff-row').first().waitFor({ state: 'visible' });

            // close diff viewer
            await page.locator('.vc-diff-close').click();
            await page.locator('.vc-diff-overlay').waitFor({ state: 'hidden' });
        })).toStrictEqual([]);
    });

    test('switch to main branch', async () => {
        expect(await capture('editor', page, async () => {
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
        })).toStrictEqual([]);
    });

    test('merge red branch', async () => {
        expect(await capture('editor', page, async () => {
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

            // clean merge -> goes straight to the apply view
            await page.waitForSelector([
                '.picker-conflict-manager.diff',
                '.content',
                '.ui-panel',
                '.content',
                '.left',
                '.content',
                '.confirm:not(.hidden)'
            ].join(' > '));
            await armReload(page);
            await page.getByText('COMPLETE MERGE').click();

            // wait for the editor to reload
            await waitReload(page);
        })).toStrictEqual([]);
    });

    test('merge green branch', async () => {
        expect(await capture('editor', page, async () => {
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
            await armReload(page);
            await page.getByText('COMPLETE MERGE').click();

            // wait for the editor to reload
            await waitReload(page);
        })).toStrictEqual([]);
    });

    test('restore checkpoint', async () => {
        expect(await capture('editor', page, async () => {
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

            // wait for the editor to reload
            await waitReload(page);
        })).toStrictEqual([]);
    });

    test('hard reset checkpoint', async () => {
        expect(await capture('editor', page, async () => {
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

            // wait for the editor to reload
            await waitReload(page);
        })).toStrictEqual([]);
    });

    test('delete red branch', async () => {
        expect(await capture('editor', page, async () => {
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

            // branch delete updates the list in place (no reload); let the job settle
            await page.locator('.vc-dialog').waitFor({ state: 'hidden' });
            await wait(2000);
        })).toStrictEqual([]);
    });

    test('delete green branch', async () => {
        expect(await capture('editor', page, async () => {
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

            // branch delete updates the list in place (no reload); let the job settle
            await page.locator('.vc-dialog').waitFor({ state: 'hidden' });
            await wait(2000);
        })).toStrictEqual([]);
    });
});
