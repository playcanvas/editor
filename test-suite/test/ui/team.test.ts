import type { Locator, Page } from '@playwright/test';

import { expect, test } from '../../lib/fixtures';
import { EditorShell } from '../../lib/pages/common';

const USERNAME = process.env.PC_COLLAB_USERNAME ?? '';

test.skip(!USERNAME, 'set PC_COLLAB_USERNAME to the username of a second account');

const TEAM = '.picker-team-management';
const ROLE_MENU = '.team-role-menu';
const FETCH_TIMEOUT = 30_000;

const row = (page: Page, username: string) => {
    return page.locator(`${TEAM} .collaborator-container:has(.collaborator-name:text-is("${username}"))`);
};

/**
 * Opens the project picker on its team page and waits for the member list to settle. The
 * picker has no dedicated toolbar entry, and the rows come from two chained rest calls
 * (collaborators, then invitations) while the members label keeps its previous text, so
 * neither the label nor the invite field can gate a read of the rows.
 */
const openTeam = async (page: Page) => {
    const shell = new EditorShell(page);
    await shell.openLogoMenu('Publishing');
    const picker = page.locator('.picker-project');
    await expect(picker).toBeVisible();

    const collaborators = page.waitForResponse(r => r.url().includes('/collaborators'), { timeout: FETCH_TIMEOUT });
    const invitations = page.waitForResponse(r => r.url().includes('/api/invitations'), { timeout: FETCH_TIMEOUT });
    await picker.locator('.ui-list-item.team').click();
    const team = page.locator(TEAM);
    await expect(team).toBeVisible();
    await collaborators;
    await invitations;

    // the label is written when the collaborator list lands and every collaborator then
    // gets a row, so rows can only lag the count while the list is still rendering
    await expect.poll(async () => {
        const count = parseInt((await team.locator('.members-count').innerText()).split('/')[0], 10);
        return count > 0 && (await team.locator('.collaborator-container').count()) >= count;
    }, { timeout: FETCH_TIMEOUT }).toBe(true);

    return team;
};

const closeTeam = async (page: Page) => {
    await page.keyboard.press('Escape');
    await expect(page.locator('.picker-project')).toBeHidden();
};

const invite = async (team: Locator, username: string) => {
    const input = team.locator('.invite-input input');
    await input.click();
    await input.pressSequentially(username);
    await expect(input).toHaveValue(username);
    await team.locator('.invite-submit').click();
};

const remove = async (page: Page, username: string) => {
    const target = row(page, username);
    await target.locator('.actions-cell .team-action').last().click();
    await expect(target).toHaveCount(0);
};

test('invites a collaborator with read only access', async ({ editorPage }) => {
    const team = await openTeam(editorPage);
    const collaborator = row(editorPage, USERNAME);

    // the worker project is shared between tests, so start from a known state
    if (await collaborator.count()) {
        await remove(editorPage, USERNAME);
    }

    await invite(team, USERNAME);

    await expect(collaborator).toBeVisible();
    await expect(collaborator.locator('.role-select')).toHaveText('Read Only');
    await expect(collaborator.locator('.team-pill')).toHaveText('Member');

    await remove(editorPage, USERNAME);
    await closeTeam(editorPage);
});

test('changes a collaborator role and removes them', async ({ editorPage }) => {
    const team = await openTeam(editorPage);
    const collaborator = row(editorPage, USERNAME);

    if (!(await collaborator.count())) {
        await invite(team, USERNAME);
        await expect(collaborator).toBeVisible();
    }

    await collaborator.locator('.role-select').click();
    const menu = editorPage.locator(ROLE_MENU);
    await expect(menu).toBeVisible();
    await menu.locator('.pcui-menu-item-content > .pcui-label').filter({ hasText: /^Read & Write$/ }).first().click();
    await expect(collaborator.locator('.role-select')).toHaveText('Read & Write');

    // reopening the picker refetches the team, which proves the change was stored
    await closeTeam(editorPage);
    await openTeam(editorPage);
    await expect(collaborator.locator('.role-select')).toHaveText('Read & Write');

    await remove(editorPage, USERNAME);
    await expect(row(editorPage, USERNAME)).toHaveCount(0);
    await closeTeam(editorPage);
});
