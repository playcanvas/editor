import type { Page } from '@playwright/test';

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

const waitInLaunch = (page: Page, id: string) => page.waitForFunction(
    g => !!(window as any).pc.app.root.findByGuid(g),
    id
);

test.beforeEach(async ({ editorPage, project, openLaunch }) => {
    guid = (await addBox(editorPage)).id;
    launch = await openLaunch(project.sceneId);
    await waitInLaunch(launch, guid);
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

test('setting a position in the editor moves the launched entity', async ({ editorPage }) => {
    await editorPage.evaluate((g) => {
        window.editor.api.globals.entities.get(g)!.set('position', [1, 2, 3]);
    }, guid);

    await launch.waitForFunction((g) => {
        const p = (window as any).pc.app.root.findByGuid(g)?.getLocalPosition();
        return !!p && p.x === 1 && p.y === 2 && p.z === 3;
    }, guid);

    expect((await state(launch, guid))?.pos).toEqual([1, 2, 3]);
});

test('creating an entity in the editor adds it to the launched app', async ({ editorPage }) => {
    const added = await addBox(editorPage);

    await waitInLaunch(launch, added.id);

    const live = await state(launch, added.id);
    expect(live).not.toBeNull();
    expect(live?.name).toBe(added.name);
});

test('deleting an entity in the editor removes it from the launched app', async ({ editorPage }) => {
    await editorPage.evaluate(async (g) => {
        const entities = window.editor.api.globals.entities;
        await entities.delete([entities.get(g)!]);
    }, guid);

    await launch.waitForFunction(g => !(window as any).pc.app.root.findByGuid(g), guid);

    expect(await state(launch, guid)).toBeNull();
});

test('toggling enabled in the editor mirrors onto the launched entity', async ({ editorPage }) => {
    const set = (value: boolean) => editorPage.evaluate(({ g, value }) => {
        window.editor.api.globals.entities.get(g)!.set('enabled', value);
    }, { g: guid, value });

    await set(false);
    await launch.waitForFunction(g => (window as any).pc.app.root.findByGuid(g)?.enabled === false, guid);
    expect((await state(launch, guid))?.enabled).toBe(false);

    await set(true);
    await launch.waitForFunction(g => (window as any).pc.app.root.findByGuid(g)?.enabled === true, guid);
    expect((await state(launch, guid))?.enabled).toBe(true);
});

test('renaming in the editor mirrors onto the launched entity', async ({ editorPage }) => {
    const renamed = uniqueName('renamed');
    await editorPage.evaluate(({ g, renamed }) => {
        window.editor.api.globals.entities.get(g)!.set('name', renamed);
    }, { g: guid, renamed });

    await launch.waitForFunction(
        ({ g, renamed }) => (window as any).pc.app.root.findByGuid(g)?.name === renamed,
        { g: guid, renamed }
    );

    expect((await state(launch, guid))?.name).toBe(renamed);
});

test('toggling the script component enabled flag mirrors onto the launched entity', async ({ editorPage }) => {
    await editorPage.evaluate((g) => {
        window.editor.api.globals.entities.get(g)!.addComponent('script');
    }, guid);

    await launch.waitForFunction(g => !!(window as any).pc.app.root.findByGuid(g)?.script, guid);
    expect((await state(launch, guid))?.script).toBe(true);

    await editorPage.evaluate((g) => {
        window.editor.api.globals.entities.get(g)!.set('components.script.enabled', false);
    }, guid);

    await launch.waitForFunction(
        g => (window as any).pc.app.root.findByGuid(g)?.script?.enabled === false,
        guid
    );
    expect((await state(launch, guid))?.script).toBe(false);
});
