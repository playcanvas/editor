import type { BrowserContext, Page } from '@playwright/test';

import { arm } from '../../lib/arm';
import { HOST, editorSceneUrl } from '../../lib/config';
import { expect, test, type Project } from '../../lib/fixtures';
import { EditorShell } from '../../lib/pages/common';
import { HierarchyPanel } from '../../lib/pages/hierarchy';
import { waitForEditor } from '../../lib/ready';
import { uniqueName } from '../../lib/utils';

const ATTRIBUTES = '#layout-attributes';
const WHOIS = '.control-strip.bottom-left .whoisonline-user';
const DISABLED = /pcui-disabled/;
const SKIP = 'needs a second testSuite account cookie';

// the worker project is shared by the whole run, so hand back the team we were given
let guestId: number | null = null;
let baseline: string[] = [];

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

const update = (page: Page, projectId: number, userId: number, level: string) => {
    return page.evaluate(({ projectId, userId, level }) => {
        const collab = { id: String(userId), access_level: level };
        return window.editor.api.globals.rest.projects.projectCollabUpdate(projectId, collab).promisify();
    }, { projectId, userId, level });
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

/** Grants account B access, then opens the same scene in B's context. */
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

const canWrite = (page: Page) => page.evaluate(() => window.editor.call('permissions:write') as boolean);

const permissionIds = (page: Page, access: 'read' | 'write' | 'admin') => {
    return page.evaluate(a => window.config.project.permissions[a].map(String), access);
};

// never send `permission: null`: permissions.ts reloads the page for a private project
const setSelfPermission = (page: Page, permission: 'read' | 'write') => {
    return page.evaluate((p) => {
        (window.editor as any).emit('messenger:project.permissions', {
            user: { id: window.config.self.id, permission: p }
        });
    }, permission);
};

test.describe('permissions', () => {
    test.beforeEach(async ({ editorPage }) => {
        baseline = await new HierarchyPanel(editorPage).ids();
    });

    test.afterEach(async ({ editorPage, project, collaborator }) => {
        const guest = guestId;
        guestId = null;

        // finish guest sessions before cleanup can invalidate in-flight subscriptions
        await Promise.all((collaborator?.pages() ?? []).map(page => page.close()));
        if (guest !== null) {
            await expect(editorPage.locator(`${WHOIS}[style*="/users/${guest}/"]`)).toHaveCount(0);
        }
        const hierarchy = new HierarchyPanel(editorPage);
        await hierarchy.remove((await hierarchy.ids()).filter(id => !baseline.includes(id)));
        if (guest !== null) {
            await revoke(editorPage, project.id, guest);
        }
    });

    test('read only collaborator', async ({ editorPage, collaborator, project }) => {
        test.skip(!collaborator, SKIP);

        const guest = await join(editorPage, collaborator, project, 'read');

        await expect(guest.page.locator(ATTRIBUTES)).toHaveClass(DISABLED);
        await expect(new HierarchyPanel(guest.page).addButton()).toBeHidden();
        expect(await canWrite(guest.page)).toBe(false);
        expect(await permissionIds(guest.page, 'read')).toContain(String(guest.id));
        expect(await permissionIds(guest.page, 'write')).not.toContain(String(guest.id));
    });

    test('promote to write', async ({ editorPage, collaborator, project }) => {
        test.skip(!collaborator, SKIP);
        const guest = await join(editorPage, collaborator, project, 'read');
        const addButton = new HierarchyPanel(guest.page).addButton();
        await expect(addButton).toBeHidden();

        // a reload would drop this, which is the only thing "without a reload" can mean from outside
        await guest.page.evaluate(() => {
            (window as any).probe = 'kept';
        });

        await update(editorPage, project.id, guest.id, 'write');

        await expect(addButton).toBeVisible();
        await expect(guest.page.locator(ATTRIBUTES)).not.toHaveClass(DISABLED);
        expect(await canWrite(guest.page)).toBe(true);
        expect(await permissionIds(guest.page, 'write')).toContain(String(guest.id));
        expect(await guest.page.evaluate(() => (window as any).probe)).toBe('kept');

        const hierarchy = new HierarchyPanel(guest.page);
        await hierarchy.add('Entity');
        const { ids } = await hierarchy.selection();
        await new EditorShell(guest.page).flushScene();
        await editorPage.reload();
        await waitForEditor(editorPage);
        expect(await new HierarchyPanel(editorPage).exists(ids[0])).toBe(true);
    });

    test('downgrade an active writer and resume editing after promotion', async ({ editorPage, collaborator, project }) => {
        test.skip(!collaborator, SKIP);
        const guest = await join(editorPage, collaborator, project, 'write');
        const host = new HierarchyPanel(editorPage);
        const hierarchy = new HierarchyPanel(guest.page);
        const name = uniqueName('permission');
        const renamed = uniqueName('permitted');
        const id = await host.createEntity({ name });
        await expect(hierarchy.row(name)).toBeVisible();
        await hierarchy.select(name);

        const changed = await arm(guest.page, () => ({ done: new Promise<void>((resolve) => {
            window.editor.once('permissions:set', () => resolve());
        }) }));
        await update(editorPage, project.id, guest.id, 'read');
        await changed();
        await expect(guest.page.locator(ATTRIBUTES)).toHaveClass(DISABLED);
        await expect(hierarchy.addButton()).toBeHidden();
        expect(await canWrite(guest.page)).toBe(false);

        await guest.page.keyboard.press('Delete');
        await hierarchy.openContextMenu(name);
        await expect(hierarchy.menuItem('Delete')).toBeHidden();
        await guest.page.keyboard.press('Escape');
        expect(await hierarchy.exists(id)).toBe(true);
        expect(await host.get(id, 'name')).toBe(name);

        const promoted = await arm(guest.page, () => ({ done: new Promise<void>((resolve) => {
            window.editor.once('permissions:set', () => resolve());
        }) }));
        await update(editorPage, project.id, guest.id, 'write');
        await promoted();
        await expect(guest.page.locator(ATTRIBUTES)).not.toHaveClass(DISABLED);
        await hierarchy.rename(name, renamed);
        await expect(host.row(renamed)).toBeVisible();
        await new EditorShell(guest.page).flushScene();
        await guest.page.reload();
        await waitForEditor(guest.page);
        expect(await hierarchy.get(id, 'name')).toBe(renamed);
    });

    test('revoke an active collaborator without losing saved work', async ({ editorPage, collaborator, project, errors }) => {
        test.skip(!collaborator, SKIP);
        const guest = await join(editorPage, collaborator, project, 'write');
        const hierarchy = new HierarchyPanel(guest.page);
        await hierarchy.add('Entity');
        const { ids } = await hierarchy.selection();
        await new EditorShell(guest.page).flushScene();
        const privateProject = await guest.page.evaluate(() => window.config.project.private);

        if (privateProject) {
            errors.allow(/^Failed to load resource: the server responded with a status of 404 /);
            const denied = guest.page.waitForResponse(response => response.request().isNavigationRequest() && response.frame() === guest.page.mainFrame());
            await revoke(editorPage, project.id, guest.id);
            expect((await denied).status()).toBe(404);
            await guest.page.waitForLoadState('domcontentloaded');
            await expect(guest.page.locator('body.editor-ready')).toHaveCount(0);
        } else {
            const changed = await arm(guest.page, () => ({ done: new Promise<void>((resolve) => {
                window.editor.once('permissions:set', () => resolve());
            }) }));
            await revoke(editorPage, project.id, guest.id);
            await changed();
            await expect(guest.page.locator(ATTRIBUTES)).toHaveClass(DISABLED);
            await expect(hierarchy.addButton()).toBeHidden();
            expect(await canWrite(guest.page)).toBe(false);
        }
        guestId = null;

        await editorPage.reload();
        await waitForEditor(editorPage);
        expect(await new HierarchyPanel(editorPage).exists(ids[0])).toBe(true);
        expect(await permissionIds(editorPage, 'write')).not.toContain(String(guest.id));
    });

    test('apply permission message', async ({ editorPage }) => {
        const addButton = new HierarchyPanel(editorPage).addButton();
        const attributes = editorPage.locator(ATTRIBUTES);
        const self = String(await editorPage.evaluate(() => window.config.self.id));
        await expect(addButton).toBeVisible();
        await expect(attributes).not.toHaveClass(DISABLED);

        await setSelfPermission(editorPage, 'read');

        await expect(attributes).toHaveClass(DISABLED);
        await expect(addButton).toBeHidden();
        expect(await canWrite(editorPage)).toBe(false);
        expect(await permissionIds(editorPage, 'read')).toContain(self);
        expect(await permissionIds(editorPage, 'write')).not.toContain(self);

        await setSelfPermission(editorPage, 'write');

        await expect(attributes).not.toHaveClass(DISABLED);
        await expect(addButton).toBeVisible();
        expect(await canWrite(editorPage)).toBe(true);
        expect(await permissionIds(editorPage, 'write')).toContain(self);
        expect(await permissionIds(editorPage, 'read')).not.toContain(self);
    });
});
