import type { Locator, Page } from '@playwright/test';

import { arm } from '../../lib/arm';
import { EMAILS, HOST } from '../../lib/config';
import { expect, test } from '../../lib/fixtures';
import { EditorShell } from '../../lib/pages/common';

test.skip(EMAILS.length < 2, 'set PC_EMAILS and PC_COOKIE_VALUE to matching lists of dedicated accounts');

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
    const rendered = await arm(page, (selector) => {
        const panel = document.querySelector(selector)!;
        const complete = () => {
            const count = parseInt(panel.querySelector('.members-count')!.textContent!.split('/')[0], 10);
            return count > 0 && panel.querySelectorAll('.collaborator-container').length >= count;
        };
        return { done: new Promise<void>((resolve) => {
            const observer = new MutationObserver(() => {
                if (complete()) {
                    observer.disconnect();
                    resolve();
                }
            });
            observer.observe(panel, { childList: true, subtree: true, characterData: true });
            if (complete()) {
                observer.disconnect();
                resolve();
            }
        }) };
    }, TEAM, { what: 'team members to render', timeout: FETCH_TIMEOUT });
    await rendered();

    return team;
};

const closeTeam = async (page: Page) => {
    await page.keyboard.press('Escape');
    await expect(page.locator('.picker-project')).toBeHidden();
};

const invite = async (team: Locator, email: string) => {
    const input = team.locator('.invite-input input');
    await input.click();
    await input.pressSequentially(email);
    await expect(input).toHaveValue(email);
    const response = team.page().waitForResponse(response => response.request().method() === 'POST' &&
        /\/api\/projects\/\d+\/collaborators$/.test(new URL(response.url()).pathname), { timeout: FETCH_TIMEOUT });
    await team.locator('.invite-submit').click();
    expect((await response).ok(), 'team invitation request succeeded').toBe(true);
};

const remove = async (page: Page, username: string) => {
    const target = row(page, username);
    await target.locator('.actions-cell .team-action').last().click();
    await expect(target).toHaveCount(0);
};

test.describe('team', () => {
    test('invite collaborator', async ({ editorPage, collaborator: context }, info) => {
        const identity = await (await context!.request.get(`https://${HOST}/api/id`)).json();
        const { username } = await (await context!.request.get(`https://${HOST}/api/users/${identity.id}`)).json();
        const email = EMAILS[(info.parallelIndex + 1) % EMAILS.length];
        const team = await openTeam(editorPage);
        const collaborator = row(editorPage, username);

        // the worker project is shared between tests, so start from a known state
        if (await collaborator.count()) {
            await remove(editorPage, username);
        }

        await invite(team, email);

        await expect(collaborator).toBeVisible();
        await expect(collaborator.locator('.role-select')).toHaveText('Read Only');
        await expect(collaborator.locator('.team-pill')).toHaveText('Member');

        await remove(editorPage, username);
        await closeTeam(editorPage);
    });

    test('change role and remove', async ({ editorPage, collaborator: context }, info) => {
        const identity = await (await context!.request.get(`https://${HOST}/api/id`)).json();
        const { username } = await (await context!.request.get(`https://${HOST}/api/users/${identity.id}`)).json();
        const email = EMAILS[(info.parallelIndex + 1) % EMAILS.length];
        const team = await openTeam(editorPage);
        const collaborator = row(editorPage, username);

        if (!(await collaborator.count())) {
            await invite(team, email);
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

        await remove(editorPage, username);
        await expect(row(editorPage, username)).toHaveCount(0);
        await closeTeam(editorPage);
    });
});
