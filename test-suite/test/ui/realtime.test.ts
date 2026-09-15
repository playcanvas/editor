import type { BrowserContext, Page } from '@playwright/test';

import { arm } from '../../lib/arm';
import { HOST, editorSceneUrl } from '../../lib/config';
import { expect, test, type Project } from '../../lib/fixtures';
import { HierarchyPanel } from '../../lib/pages/hierarchy';
import { waitForEditor } from '../../lib/ready';
import { uniqueName } from '../../lib/utils';

const MARKER = '.entities-treeview-user-marker';
const WHOIS = '.control-strip.bottom-left .whoisonline-user';
const OVERLAY = '.connection-overlay';
const SKIP = 'needs a second testSuite account cookie';

// realtime reconnects 3 times, 3s apart, before it gives up, so recovery has a ~12s budget
const RECONNECT_TIMEOUT = 20_000;

// the worker project is shared by the whole run, so hand back the scene and the team we were given
let baseline: string[] = [];
let guestId: number | null = null;

/** Reads the account behind a context's cookie; a collaborator's id is never known up front. */
const identity = async (context: BrowserContext) => {
    const res = await context.request.get(`https://${HOST}/api/id`);
    const { id } = await res.json();
    const user = await context.request.get(`https://${HOST}/api/users/${id}`);
    const { username } = await user.json();
    return { id: id as number, username: username as string };
};

// the invitee field is `user`, as the editor's own picker sends it (picker-team-management.ts:310,
// 418-421); the declared ProjectCollabCreateData names it `username`, which alone answers
// 400 "user: missing value"
const grant = (page: Page, projectId: number, username: string, level: string) => {
    return page.evaluate(({ projectId, username, level }) => {
        const collab = { user: username, access_level: level } as any;
        return window.editor.api.globals.rest.projects.projectCollabCreate(projectId, collab).promisify();
    }, { projectId, username, level });
};

// a 204 carries no body and promisify() rejects parsing it, so settle on either outcome
const revoke = (page: Page, projectId: number, userId: number) => {
    return page.evaluate(({ projectId, userId }) => {
        return new Promise<void>((resolve) => {
            const req = window.editor.api.globals.rest.projects.projectCollabDelete(projectId, userId);
            req.on('load', () => resolve());
            req.on('error', () => resolve());
        });
    }, { projectId, userId });
};

/** Grants account B access, then opens the same scene in B's context so it observes A's ops. */
const join = async (host: Page, context: BrowserContext | null, project: Project, level: string) => {
    if (!context) {
        throw new Error('no collaborator context');
    }
    const who = await identity(context);
    await grant(host, project.id, who.username, level);
    guestId = who.id;
    const page = await context.newPage();
    await page.goto(editorSceneUrl(project.sceneId, { disableBubbles: true }));
    await waitForEditor(page);
    return { ...who, page };
};

// every avatar is a background image of /api/users/<id>/thumbnail, so the strip names its users
const onlineIds = (page: Page) => {
    return page.locator(WHOIS).evaluateAll((els) => {
        return els.map(el => Number(/\/users\/(\d+)\//.exec((el as HTMLElement).style.backgroundImage)?.[1]));
    });
};

test.describe('realtime', () => {
    test.beforeEach(async ({ editorPage }) => {
        baseline = await new HierarchyPanel(editorPage).ids();
    });

    test.afterEach(async ({ editorPage, project }) => {
        const hierarchy = new HierarchyPanel(editorPage);
        const ids = await hierarchy.ids();
        await hierarchy.remove(ids.filter(id => !baseline.includes(id)));
        const guest = guestId;
        guestId = null;
        if (guest !== null) {
            await revoke(editorPage, project.id, guest);
        }
    });

    test('sync entity create', async ({ editorPage, collaborator, project }) => {
        test.skip(!collaborator, SKIP);
        const guest = await join(editorPage, collaborator, project, 'write');
        const hierarchy = new HierarchyPanel(guest.page);
        const name = uniqueName('ent');

        const id = await new HierarchyPanel(editorPage).createEntity({ name });

        await expect(hierarchy.row(name)).toHaveCount(1);
        expect(await hierarchy.get(id, 'name')).toBe(name);
        expect(await hierarchy.get(id, 'parent')).toBe(await hierarchy.rootId());
    });

    test('sync entity rename', async ({ editorPage, collaborator, project }) => {
        test.skip(!collaborator, SKIP);
        const guest = await join(editorPage, collaborator, project, 'write');
        const host = new HierarchyPanel(editorPage);
        const hierarchy = new HierarchyPanel(guest.page);
        const name = uniqueName('ent');
        const renamed = uniqueName('ent');
        const id = await host.createEntity({ name });
        await expect(hierarchy.row(name)).toHaveCount(1);

        await host.rename(name, renamed);

        await expect(hierarchy.row(renamed)).toHaveCount(1);
        await expect(hierarchy.row(name)).toHaveCount(0);
        expect(await hierarchy.get(id, 'name')).toBe(renamed);
    });

    test('sync entity delete', async ({ editorPage, collaborator, project }) => {
        test.skip(!collaborator, SKIP);
        const guest = await join(editorPage, collaborator, project, 'write');
        const host = new HierarchyPanel(editorPage);
        const hierarchy = new HierarchyPanel(guest.page);
        const name = uniqueName('ent');
        const id = await host.createEntity({ name });
        await expect(hierarchy.row(name)).toHaveCount(1);

        await host.contextMenu(name, 'Delete');

        await expect(hierarchy.row(name)).toHaveCount(0);
        await expect.poll(() => hierarchy.exists(id)).toBe(false);
    });

    test('sync selection', async ({ editorPage, collaborator, project }) => {
        test.skip(!collaborator, SKIP);
        const guest = await join(editorPage, collaborator, project, 'write');
        const host = new HierarchyPanel(editorPage);
        const hierarchy = new HierarchyPanel(guest.page);
        const name = uniqueName('ent');
        await host.createEntity({ name });
        await expect(hierarchy.row(name)).toHaveCount(1);
        const marker = hierarchy.rowContents(name).locator(MARKER);

        await host.select(name);

        await expect(marker).toHaveCount(1);

        // the marker is tinted with the selecting user's colour, so an untinted one is not a real sync
        expect(await marker.evaluate(el => (el as HTMLElement).style.backgroundColor)).not.toBe('');

        await editorPage.evaluate(() => window.editor.api.globals.selection.clear());

        await expect(marker).toHaveCount(0);
    });

    test('show presence', async ({ editorPage, collaborator, project }) => {
        test.skip(!collaborator, SKIP);
        // the strip lists this account too, so a lone editor settles on one avatar; a collaborator
        // from the previous test can still be leaving the room, so wait for that before measuring
        await expect.poll(() => onlineIds(editorPage)).toHaveLength(1);
        const before = await onlineIds(editorPage);

        const guest = await join(editorPage, collaborator, project, 'write');

        expect(before).not.toContain(guest.id);
        await expect.poll(() => onlineIds(editorPage)).toContain(guest.id);
        expect(await onlineIds(editorPage)).toHaveLength(2);

        await guest.page.close();

        await expect.poll(() => onlineIds(editorPage)).not.toContain(guest.id);
        expect(await onlineIds(editorPage)).toHaveLength(1);
    });

    test('reconnect after disconnect', async ({ editorPage, collaborator, project }) => {
        test.skip(!collaborator, SKIP);

        // run this on the collaborator, whose context is not console-captured: a dropped socket goes
        // through realtime.on('error') -> log.error -> console.error and would fail the errors fixture
        const guest = await join(editorPage, collaborator, project, 'write');
        const context = guest.page.context();
        const overlay = guest.page.locator(OVERLAY);
        await expect(overlay).toBeHidden();

        await context.setOffline(true);

        await expect(overlay).toBeVisible();
        await expect(overlay.locator('.connection-icon.error')).toHaveCount(1);
        await expect(overlay.locator('.connection-content')).toContainText(/disconnected/i);
        await expect.poll(() => {
            return guest.page.evaluate(() => window.editor.api.globals.realtime.connection.connected);
        }).toBe(false);

        const reauthenticated = await arm(guest.page, () => {
            const connection = window.editor.api.globals.realtime.connection;
            if (connection.authenticated) {
                return { done: Promise.resolve() };
            }
            return { done: new Promise<void>((resolve) => {
                window.editor.once('realtime:authenticated', () => resolve());
            }) };
        }, undefined, { what: 'the guest to reauthenticate', timeout: RECONNECT_TIMEOUT });
        await context.setOffline(false);

        await expect(overlay).toBeHidden({ timeout: RECONNECT_TIMEOUT });
        await reauthenticated();
    });
});
