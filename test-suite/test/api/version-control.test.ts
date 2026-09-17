import type { BrowserContext, Page } from '@playwright/test';

import { checkCookieAccept, createProject, deleteProject } from '../../lib/common';
import { editorBlankUrl, editorUrl } from '../../lib/config';
import { JOB_TEST_TIMEOUT, JOB_TIMEOUT } from '../../lib/constants';
import { expect, test } from '../../lib/fixtures';
import { middleware } from '../../lib/middleware';
import { armBranchDeleted, armReload, branchIds, createCheckpointApi, waitReload } from '../../lib/pages/version-control';
import { waitForEditor } from '../../lib/ready';
import { uniqueName } from '../../lib/utils';

test.describe.configure({
    mode: 'serial'
});

test.describe('branch/checkpoint/diff/merge', () => {
    const projectName = uniqueName('api-vc');
    let context: BrowserContext;
    let setup: Page;
    let projectId: number;
    let materialId: number;
    let baseDiffuse: number[];

    let mainBranchId: string;
    let mainCheckpointId: string;

    let redBranchId: string;

    let greenBranchId: string;

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

    const branchFromCheckpoint = async (page: Page, name: string) => {
        await armReload(page);
        const branchId = await page.evaluate(async ({ name, sourceBranchId, sourceCheckpointId }) => {
            const branch = await window.editor.api.globals.rest.branches.branchCreate({
                name,
                projectId: window.editor.api.globals.projectId,
                sourceBranchId,
                sourceCheckpointId
            }).promisify();
            return branch.id;
        }, { name, sourceBranchId: mainBranchId, sourceCheckpointId: mainCheckpointId });

        // creating a branch checks it out, which reloads the editor
        await waitReload(page);
        expect(await page.evaluate(() => window.editor.api.globals.branchId)).toBe(branchId);
        return branchId;
    };

    const setDiffuse = (page: Page, color: number[]) => page.evaluate(({ id, color }) => {
        window.editor.api.globals.assets.get(id)!.set('data.diffuse', color);
    }, { id: materialId, color });

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

        redBranchId = await branchFromCheckpoint(page, 'red');
        expect(redBranchId).not.toBe(mainBranchId);

        // set material color RED and checkpoint it on red
        await setDiffuse(page, [1, 0, 0]);
        const checkpoint = await createCheckpointApi(page, 'RED');
        expect(checkpoint.id).not.toBe(mainCheckpointId);
    });

    test('create green branch', async ({ page }) => {
        await open(page);

        greenBranchId = await branchFromCheckpoint(page, 'green');
        expect(greenBranchId).not.toBe(redBranchId);

        // set material color GREEN and checkpoint it on green
        await setDiffuse(page, [0, 1, 0]);
        const checkpoint = await createCheckpointApi(page, 'GREEN');
        expect(checkpoint.id).not.toBe(mainCheckpointId);
    });

    test('diff between green and main branch', async ({ page }) => {
        await open(page);

        const diff = await page.evaluate(async ({ greenBranchId, mainBranchId, jobTimeout }) => {
            const { rest } = window.editor.api.globals;

            type Resolved<T extends (...args: never[]) => { promisify(): Promise<unknown> }> = Awaited<ReturnType<ReturnType<T>['promisify']>>;
            type DiffJob = Resolved<typeof rest.jobs.jobGet>;
            type DiffResult = Resolved<typeof rest.diff.diffGet>;

            // deferred for the job response
            const jobDeferred: PromiseWithResolvers<DiffJob> = Promise.withResolvers();

            // wait for diff via messenger job.update event
            const diffPromise: Promise<DiffResult> = new Promise((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error('timed out waiting for diff job.update')), jobTimeout);
                const evt = window.editor.on('messenger:job.update', async (...args: unknown[]) => {
                    const { job: jobData } = args[0] as { job: { id: number } };
                    const job = await jobDeferred.promise;
                    if (jobData.id !== job.id) {
                        return;
                    }
                    evt.unbind();
                    clearTimeout(timer);

                    // verify the job completed, then fetch the full diff from S3
                    const completedJob = await rest.jobs.jobGet({ jobId: job.id }).promisify();
                    if (completedJob.status === 'error') {
                        reject(new Error(completedJob.messages?.[0] ?? 'Diff job failed'));
                        return;
                    }
                    resolve(await rest.diff.diffGet({ id: job.data.merge_id }).promisify());
                });
            });

            // create diff
            const job = await rest.diff.diffCreate({
                srcBranchId: greenBranchId,
                dstBranchId: mainBranchId
            }).promisify();
            jobDeferred.resolve(job);

            const diff = await diffPromise;
            return { jobId: job.id, mergeId: job.data.merge_id, isDiff: diff.isDiff, numConflicts: diff.numConflicts };
        }, { greenBranchId, mainBranchId, jobTimeout: JOB_TIMEOUT });

        expect(diff.jobId).toBeTruthy();
        expect(diff.mergeId).toBeTruthy();
        expect(diff.isDiff).toBe(true);
        expect(typeof diff.numConflicts).toBe('number');
    });

    test('switch to main branch', async ({ page }) => {
        await open(page);

        await armReload(page);
        await page.evaluate((mainBranchId) => {
            return window.editor.api.globals.rest.branches.branchCheckout({ branchId: mainBranchId }).promisify();
        }, mainBranchId);

        // checkout reloads the editor onto main
        await waitReload(page);
        expect(await page.evaluate(() => window.editor.api.globals.branchId)).toBe(mainBranchId);
    });

    test('merge red branch', async ({ page }) => {
        await open(page);

        await armReload(page);
        await page.evaluate(async ({ mainBranchId, redBranchId }) => {
            const { rest } = window.editor.api.globals;

            // create merge
            let merge = await rest.merge.mergeCreate({
                srcBranchId: redBranchId,
                dstBranchId: mainBranchId,
                srcBranchClose: true
            }).promisify();

            // get details of the merge
            merge = await rest.merge.mergeGet({ mergeId: merge.id }).promisify();

            // check for conflicts
            if (merge.conflicts?.length) {
                // resolve conflicts in favour of the source branch
                await rest.conflicts.conflictsResolve({
                    mergeId: merge.id,
                    conflictIds: merge.conflicts.flatMap(group => group.data.map(conflict => conflict.id)),
                    useSrc: true
                }).promisify();

                // apply conflicts
                await rest.merge.mergeApply({ mergeId: merge.id, finalize: false }).promisify();
            }

            // create diff
            await rest.diff.diffCreate({ srcBranchId: redBranchId, dstBranchId: mainBranchId }).promisify();

            // apply merge
            await rest.merge.mergeApply({ mergeId: merge.id, finalize: true }).promisify();
        }, { mainBranchId, redBranchId });

        // completing the merge reloads the editor with red's material colour on main
        await waitReload(page);
        expect(await diffuse(page)).toStrictEqual([1, 0, 0]);
    });

    test('merge green branch', async ({ page }) => {
        await open(page);

        await armReload(page);
        const conflicts = await page.evaluate(async ({ mainBranchId, greenBranchId }) => {
            const { rest } = window.editor.api.globals;

            // create merge
            let merge = await rest.merge.mergeCreate({
                srcBranchId: greenBranchId,
                dstBranchId: mainBranchId,
                srcBranchClose: false
            }).promisify();

            // get details of the merge
            merge = await rest.merge.mergeGet({ mergeId: merge.id }).promisify();

            // check for conflicts
            const conflictIds = merge.conflicts?.flatMap(group => group.data.map(conflict => conflict.id)) ?? [];
            if (conflictIds.length) {
                // resolve conflicts in favour of the source branch
                await rest.conflicts.conflictsResolve({
                    mergeId: merge.id,
                    conflictIds,
                    useSrc: true
                }).promisify();

                // apply conflicts
                await rest.merge.mergeApply({ mergeId: merge.id, finalize: false }).promisify();
            }

            // create diff
            await rest.diff.diffCreate({ srcBranchId: greenBranchId, dstBranchId: mainBranchId }).promisify();

            // apply merge
            await rest.merge.mergeApply({ mergeId: merge.id, finalize: true }).promisify();

            return conflictIds.length;
        }, { mainBranchId, greenBranchId });

        // green's colour conflicts with the merged red change and wins the resolve
        expect(conflicts).toBeGreaterThan(0);
        await waitReload(page);
        expect(await diffuse(page)).toStrictEqual([0, 1, 0]);
    });

    test('restore checkpoint', async ({ page }) => {
        await open(page);

        await armReload(page);
        await page.evaluate(({ mainBranchId, mainCheckpointId }) => {
            return window.editor.api.globals.rest.checkpoints.checkpointRestore({
                branchId: mainBranchId,
                checkpointId: mainCheckpointId
            }).promisify();
        }, { mainBranchId, mainCheckpointId });

        // the restore job reloads the editor with the base material colour back
        await waitReload(page);
        expect(await diffuse(page)).toStrictEqual(baseDiffuse);
    });

    test('hard reset checkpoint', async ({ page }) => {
        await open(page);

        await armReload(page);
        await page.evaluate(({ mainBranchId, mainCheckpointId }) => {
            return window.editor.api.globals.rest.checkpoints.checkpointHardReset({
                branchId: mainBranchId,
                checkpointId: mainCheckpointId
            }).promisify();
        }, { mainBranchId, mainCheckpointId });

        // the hard reset job reloads the editor with base as the branch head
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
        test.setTimeout(JOB_TEST_TIMEOUT);
        await open(page);

        const deleted = await armBranchDeleted(page, redBranchId);
        await page.evaluate((redBranchId) => {
            return window.editor.api.globals.rest.branches.branchDelete({ branchId: redBranchId }).promisify();
        }, redBranchId);

        // red was closed by its merge, so it drops out of the closed list
        await deleted();
        expect(await branchIds(page, true)).not.toContain(redBranchId);
    });

    test('delete green branch', async ({ page }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);
        await open(page);

        const deleted = await armBranchDeleted(page, greenBranchId);
        await page.evaluate((greenBranchId) => {
            return window.editor.api.globals.rest.branches.branchDelete({ branchId: greenBranchId }).promisify();
        }, greenBranchId);

        await deleted();
        expect(await branchIds(page)).not.toContain(greenBranchId);
    });
});
