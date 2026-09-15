import type { Page } from '@playwright/test';

import { arm } from '../../lib/arm';
import { READY_TIMEOUT } from '../../lib/constants';
import { expect, test } from '../../lib/fixtures';
import { uniqueName } from '../../lib/utils';

type State = { name: string; enabled: boolean; pos: number[]; script: boolean | null } | null;

const created: string[] = [];
let guid: string;
let launch: Page;

const addBox = async (page: Page) => {
    const name = uniqueName('ent');
    const id = await page.evaluate((n) => {
        const entity = window.editor.api.globals.entities.create({
            name: n,
            components: { render: { type: 'box' } }
        } as any);
        return entity.get('resource_id') as string;
    }, name);
    created.push(id);
    return { id, name };
};

const state = (page: Page, id: string): Promise<State> => page.evaluate((g) => {
    const entity = (window as any).pc.app.root.findByGuid(g);
    if (!entity) {
        return null;
    }
    const p = entity.getLocalPosition();
    return {
        name: entity.name as string,
        enabled: entity.enabled as boolean,
        pos: [p.x, p.y, p.z] as number[],
        script: entity.script ? entity.script.enabled as boolean : null
    };
}, id);

// observer events precede engine application; inspect the resulting graph on engine updates
const armLaunch = (page: Page, id: string, expected: Partial<NonNullable<State>> | null = {}) => arm(page, ({ id, expected }) => {
    const app = (window as any).pc.app;
    let check: () => void;
    const done = new Promise<void>((resolve) => {
        check = () => {
            const entity = app.root.findByGuid(id);
            if (expected === null ? !!entity : !entity) return;
            if (entity) {
                const p = entity.getLocalPosition();
                const current = { name: entity.name, enabled: entity.enabled, pos: [p.x, p.y, p.z], script: entity.script?.enabled ?? null };
                if (Object.entries(expected).some(([key, value]) => JSON.stringify(current[key as keyof typeof current]) !== JSON.stringify(value))) return;
            }
            app.off('frameend', check);
            resolve();
        };
        app.on('frameend', check);
        check();
    });
    return { done, dispose: () => app.off('frameend', check) };
}, { id, expected }, { what: 'Launch to apply the realtime entity state', timeout: READY_TIMEOUT });

test.describe('hot-reload', { tag: '@gate' }, () => {
    test.beforeEach(async ({ editorPage, project, openLaunch }) => {
        guid = (await addBox(editorPage)).id;
        launch = await openLaunch(project.sceneId);
        await (await armLaunch(launch, guid))();
    });

    test.afterEach(async ({ editorPage }) => {
        const ids = created.splice(0);
        await editorPage.evaluate(async (list) => {
            const entities = window.editor.api.globals.entities;
            const targets = list.flatMap((id) => {
                const entity = entities.get(id);
                return entity ? [entity] : [];
            });
            if (targets.length) {
                await entities.delete(targets, { history: false });
            }
        }, ids);
    });

    test('sync position', async ({ editorPage }) => {
        const updated = await armLaunch(launch, guid, { pos: [1, 2, 3] });
        await editorPage.evaluate((g) => {
            window.editor.api.globals.entities.get(g)!.set('position', [1, 2, 3]);
        }, guid);

        await updated();

        expect((await state(launch, guid))?.pos).toEqual([1, 2, 3]);
    });

    test('sync entity create', async ({ editorPage }) => {
        const added = await addBox(editorPage);

        await (await armLaunch(launch, added.id))();

        const live = await state(launch, added.id);
        expect(live).not.toBeNull();
        expect(live?.name).toBe(added.name);
    });

    test('sync entity delete', async ({ editorPage }) => {
        const removed = await armLaunch(launch, guid, null);
        await editorPage.evaluate(async (g) => {
            const entities = window.editor.api.globals.entities;
            await entities.delete([entities.get(g)!]);
        }, guid);

        await removed();

        expect(await state(launch, guid)).toBeNull();
    });

    test('sync entity enabled', async ({ editorPage }) => {
        const set = (value: boolean) => editorPage.evaluate(({ g, value }) => {
            window.editor.api.globals.entities.get(g)!.set('enabled', value);
        }, { g: guid, value });

        const disabled = await armLaunch(launch, guid, { enabled: false });
        await set(false);
        await disabled();
        expect((await state(launch, guid))?.enabled).toBe(false);

        const enabled = await armLaunch(launch, guid, { enabled: true });
        await set(true);
        await enabled();
        expect((await state(launch, guid))?.enabled).toBe(true);
    });

    test('sync entity name', async ({ editorPage }) => {
        const renamed = uniqueName('renamed');
        const named = await armLaunch(launch, guid, { name: renamed });
        await editorPage.evaluate(({ g, renamed }) => {
            window.editor.api.globals.entities.get(g)!.set('name', renamed);
        }, { g: guid, renamed });

        await named();

        expect((await state(launch, guid))?.name).toBe(renamed);
    });

    test('sync script enabled', async ({ editorPage }) => {
        const added = await armLaunch(launch, guid, { script: true });
        await editorPage.evaluate((g) => {
            window.editor.api.globals.entities.get(g)!.addComponent('script');
        }, guid);

        await added();
        expect((await state(launch, guid))?.script).toBe(true);

        const disabled = await armLaunch(launch, guid, { script: false });
        await editorPage.evaluate((g) => {
            window.editor.api.globals.entities.get(g)!.set('components.script.enabled', false);
        }, guid);

        await disabled();
        expect((await state(launch, guid))?.script).toBe(false);
    });
});
