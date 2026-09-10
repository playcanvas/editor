import type { Page } from '@playwright/test';

import { JOB_TIMEOUT, READY_TIMEOUT } from '../constants';
import { waitForEditor } from '../ready';
import { EditorShell } from './common';

// the version control picker was rewritten (#2098/#2099/#2100): a branch
// switcher dropdown, Changes/History tabs, a detail pane, an inline checkpoint
// composer, compare mode + dedicated diff/merge overlays, and vc-dialog dialogs.

// the main vc panel (`picker-version-control` is shared with the graph panel)
const VC_PANEL = '.picker-vc';

// vc operations reload the editor via an async, ~1s-delayed messenger event
// (branch.createEnded / branch.switch / merge / restore). a fixed wait races
// that reload; instead mark the document, trigger the op, then wait for a fresh
// document with the editor reloaded.
export const armReload = (page: Page) => page.evaluate(() => {
    (window as any).__vcReload = true;
});

export const waitReload = async (page: Page) => {
    await page.waitForFunction(() => {
        const w = window as any;
        return w.__vcReload === undefined && !!w.editor?.api?.globals?.branchId;
    }, undefined, { timeout: READY_TIMEOUT });
    await waitForEditor(page);
};

/** open the version control picker via the project logo menu (idempotent) */
export const openVc = async (page: Page) => {
    if (await page.locator(VC_PANEL).isVisible().catch(() => false)) {
        return;
    }
    await new EditorShell(page).openLogoMenu('Version Control');
    await page.locator(VC_PANEL).waitFor({ state: 'visible' });
};

/** open the branch switcher dropdown */
export const openSwitcher = async (page: Page) => {
    await page.locator('.vc-branch-button').click();
    await page.locator('.vc-branch-panel').waitFor({ state: 'visible' });
};

/** change the branch list filter (Open / Favorites / Closed) */
export const setBranchFilter = async (page: Page, label: 'Open' | 'Favorites' | 'Closed') => {
    await page.locator('.vc-branch-filter .pcui-select-input-value').click();
    await page.locator('.vc-branch-filter .pcui-select-input-list').getByText(label, { exact: true }).click();
};

/** run a kebab-menu action on a branch row (row actions are hover-revealed) */
export const branchMenuAction = async (page: Page, branchId: string, action: RegExp) => {
    const row = page.locator(`#branch-${branchId}`);
    await row.waitFor({ state: 'visible' });
    await row.hover();
    await row.locator('.kebab').click();
    await page.locator('.pcui-menu-item').filter({ hasText: action }).first().click();
};

/** select a checkpoint in the History list and wait for its detail pane */
export const selectCheckpoint = async (page: Page, checkpointId: string) => {
    const row = page.locator(`#checkpoint-${checkpointId}`);
    await row.waitFor({ state: 'visible' });
    await row.click();
    await page.locator('.vc-detail-actions').first().waitFor({ state: 'visible' });
};

export const dialogConfirm = (page: Page) => page.locator('.vc-dialog .pcui-button.confirm');
export const dialogInput = (page: Page) => page.locator('.vc-dialog input');
export const toggleDialogCheck = (page: Page, label: string) => page.locator('.vc-dialog').getByLabel(label).click();
export const diffOverlay = (page: Page) => page.locator('.vc-diff-overlay:not(.vc-merge)');
export const mergeOverlay = (page: Page) => page.locator('.vc-diff-overlay.vc-merge');

/** branch from a checkpoint via the detail pane; resolves to the new branch id */
export const createBranchFromCheckpoint = async (page: Page, checkpointId: string, name: string) => {
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

const mergeDiffOverlay = (page: Page) => page.locator('.vc-diff-overlay.vc-merge.diff');
const mergeFooterButton = (page: Page, text: RegExp) => mergeOverlay(page).locator('.vc-diff-sidebar-foot .pcui-button:not(.pcui-disabled)').filter({ hasText: text });

export const completeMerge = async (page: Page) => {
    await mergeOverlay(page).waitFor({ state: 'visible' });
    const step = await Promise.race([
        mergeDiffOverlay(page).waitFor({ state: 'visible' }).then(() => 'complete'),
        mergeFooterButton(page, /^Review merge$/).waitFor({ state: 'visible' }).then(() => 'review')
    ]);
    if (step === 'review') {
        await mergeFooterButton(page, /^Review merge$/).click();
    }
    await mergeDiffOverlay(page).waitFor({ state: 'visible' });
    await armReload(page);
    await mergeFooterButton(page, /^Complete merge$/).click();
};

/** create a checkpoint via the inline composer and confirm it lands in history */
export const createCheckpoint = async (page: Page, description: string) => {
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

/** create a checkpoint over rest and resolve with it once its job completes */
export const createCheckpointApi = (page: Page, description: string) => page.evaluate(async ({ description, jobTimeout }) => {
    const { rest, messenger, projectId, branchId } = window.editor.api.globals;
    const jobDeferred: PromiseWithResolvers<any> = Promise.withResolvers();
    const done = new Promise<any>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timed out waiting for checkpoint job.update')), jobTimeout);
        const handle = messenger.on('message', async (name: string, data: any) => {
            const job = await jobDeferred.promise;
            if (name !== 'job.update' || data.job.id !== job.id) {
                return;
            }
            handle.unbind();
            clearTimeout(timer);
            const completed = await rest.jobs.jobGet({ jobId: job.id }).promisify();
            if (completed.status === 'error') {
                reject(new Error(completed.messages?.[0] ?? 'Checkpoint create failed'));
                return;
            }
            resolve(completed.data);
        });
    });

    const job = await rest.checkpoints.checkpointCreate({ projectId, branchId, description }).promisify();
    jobDeferred.resolve(job);
    return done;
}, { description, jobTimeout: JOB_TIMEOUT });

/** ids of the project's branches, so branch state can be polled without the UI */
export const branchIds = (page: Page, closed = false) => page.evaluate(async (closed) => {
    const res: any = await window.editor.api.globals.rest.projects.projectBranches({ limit: 100, closed }).promisify();
    return (res.result ?? []).map((branch: any) => branch.id as string);
}, closed);
