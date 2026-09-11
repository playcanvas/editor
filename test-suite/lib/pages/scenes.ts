import type { Locator, Page } from '@playwright/test';

import { READY_TIMEOUT } from '../constants';
import { EditorShell } from './common';

export type SceneInfo = { id: number; name: string; uniqueId: string };

const PANEL = '.picker-scene-panel';

/** The scene list the picker itself fetches, for state assertions and cleanup. */
export const sceneList = async (page: Page) => {
    const scenes = await page.evaluate(async () => {
        const res = await window.editor.api.globals.rest.projects.projectScenes().promisify() as any;
        return ((res.result ?? []) as any[]).map(s => ({
            id: Number(s.id),
            name: String(s.name),
            uniqueId: String(s.uniqueId)
        }));
    });
    return scenes as SceneInfo[];
};

export const createScene = async (page: Page, name: string) => {
    const scene = await page.evaluate(async (name) => {
        const { rest, projectId, branchId } = window.editor.api.globals;
        const res = await rest.scenes.sceneCreate({ projectId, branchId, name }).promisify() as any;
        return { id: Number(res.id), name, uniqueId: String(res.uniqueId) };
    }, name);
    return scene as SceneInfo;
};

/**
 * Drops scenes over rest, skipping ones already gone. Deleting a missing scene answers 404,
 * and the browser logs every failed request as a console error, which fails the test.
 */
export const deleteScenes = async (page: Page, ids: number[]) => {
    if (!ids.length) {
        return;
    }
    const live = new Set((await sceneList(page)).map(s => s.id));
    const targets = ids.filter(id => live.has(id));
    if (!targets.length) {
        return;
    }
    await page.evaluate(async (list) => {
        const rest = window.editor.api.globals.rest;
        await Promise.all(list.map(id => rest.scenes.sceneDelete(id).promisify()));
    }, targets);
};

export const sceneId = (page: Page) => page.evaluate(() => Number(window.config.scene.id));

/**
 * Marks the page before an in-page scene switch. `body.editor-ready` is a one-shot latch and
 * `entities:loaded` never returns to false, so a switch has to be awaited through a fresh
 * `entities:load`.
 */
export const armSceneLoad = (page: Page) => page.evaluate(() => {
    const w = window as any;
    w.__sceneLoad = false;
    w.__sceneEvt?.unbind();
    w.__sceneEvt = window.editor.on('entities:load', () => {
        w.__sceneLoad = true;
    });
});

/** Waits for the armed switch to land on a scene other than `from` and returns its id. */
export const waitForSceneSwitch = async (page: Page, from: number) => {
    await page.waitForFunction((prev) => {
        const w = window as any;
        return w.__sceneLoad === true &&
            !!window.config.scene.id &&
            Number(window.config.scene.id) !== prev &&
            window.editor.call('entities:loaded') === true &&
            !!window.editor.api.globals.entities.root;
    }, from, { timeout: READY_TIMEOUT });
    return sceneId(page);
};

export class ScenePicker {
    readonly shell: EditorShell;

    readonly root: Locator;

    readonly list: Locator;

    readonly newButton: Locator;

    /** The control-strip button that opens the picker; its text is the loaded scene name. */
    readonly stripButton: Locator;

    constructor(readonly page: Page) {
        this.shell = new EditorShell(page);
        this.root = page.locator(PANEL);
        this.list = this.root.locator('.scene-list');
        this.newButton = this.root.locator('.toolbar .pcui-button.new');
        this.stripButton = page.locator('.control-strip.top-left .control-strip-btn').last();
    }

    /** Opens the picker from the logo menu (idempotent) and waits for the rows to render. */
    async open() {
        if (!(await this.root.isVisible())) {
            await this.shell.openLogoMenu('Scenes');
        }
        await this.list.waitFor();
    }

    row(id: number) {
        return this.page.locator(`#picker-scene-${id}`);
    }

    // rows are plain `li`s, so match on the name label the row owns rather than on row text,
    // which also covers the relative date and the CURRENT badge
    rowByName(name: string) {
        return this.list.locator(`li:has(> .name:text-is("${name}"))`);
    }

    /** The row of the loaded scene; the control-strip button never gets `.active`, so use this. */
    current() {
        return this.list.locator('li.current');
    }

    async rowMenu(id: number, item: string) {
        await this.row(id).locator('.pcui-button.dropdown').click();
        await this.page.locator('.picker-scene-menu:not(.pcui-hidden)').waitFor();
        await this.shell.menuItem(item).first().click();
    }

    /** Clicks a row to load its scene in place; resolves with the loaded scene id. */
    async openRow(id: number) {
        const from = await sceneId(this.page);
        await this.open();
        await armSceneLoad(this.page);
        await this.row(id).locator('.name').click();
        return waitForSceneSwitch(this.page, from);
    }

    /** Creates a scene through the inline "New Scene" row; resolves with the new scene id. */
    async newScene(name: string) {
        const from = await sceneId(this.page);
        await this.open();
        await this.newButton.click();
        const input = this.list.locator('li.new-scene input');
        await input.waitFor();

        // the row opens focused on a prefilled "Untitled", so clear it with real keys
        await input.press('ControlOrMeta+A');
        await input.pressSequentially(name);
        await armSceneLoad(this.page);
        await input.press('Enter');
        return waitForSceneSwitch(this.page, from);
    }
}
