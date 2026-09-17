import type { Locator, Page, ViewportSize } from '@playwright/test';

import { arm, type Armed, type ArmCap } from '../arm';
import { JOB_TIMEOUT } from '../constants';
import { waitForEditor } from '../ready';

/** Ids of everything a project holds, as `snapshot()` found them. */
export type ProjectState = { entities: string[]; assets: number[] };

/** How the worker's editor page looked before any test touched it; `reset()` puts it back. */
export type Baseline = {
    url: string;
    viewport: ViewportSize | null;
    viewMode: string;
    gizmo: { type: string; coordSystem: string };
    state: ProjectState;
    dirty: boolean;
};

// a spec can leave a picker open, and its overlay swallows every click behind it. the scene
// picker is the project picker, so its closer is covered by picker:project:close
const PICKER_CLOSERS = [
    'picker:asset:close',
    'picker:color:close',
    'picker:confirm:close',
    'picker:curve:close',
    'picker:entity:close',
    'picker:node:close',
    'picker:project:close',
    'picker:project:cms:close',
    'picker:script-create:close',
    'picker:sprites:close',
    'picker:store:cms:close',
    'picker:storeitem:close'
];

export class EditorShell {
    constructor(readonly page: Page) {}

    /** `arm` bound to this page. */
    arm<T>(subscribe: (arg: any) => Armed<T>, arg?: any, cap?: ArmCap) {
        return arm(this.page, subscribe, arg, cap);
    }

    async openLogoMenu(item: string | RegExp) {
        await this.page.locator('.pcui-element.font-regular.logo').click();
        await this.page.locator('.pcui-menu:not(.pcui-hidden) span').filter({ hasText: item }).first().click();
    }

    // a pcui MenuItem content holds two labels, the text then the shortcut, and a shortcut can
    // repeat the item name (Delete), so skip the shortcut label to keep the match single; an
    // entry a menu filtered out for the current selection is still in the dom, hence :not(.pcui-hidden)
    menuItem(text: string | RegExp) {
        const re = typeof text === 'string' ? new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) : text;
        return this.page.locator('.pcui-menu:not(.pcui-hidden) .pcui-menu-item:not(.pcui-hidden) > .pcui-menu-item-content > .pcui-label:not(.pcui-menu-item-shortcut)').filter({ hasText: re });
    }

    get confirm() {
        // the asset auditor overlay reuses the .picker-confirm class for styling, so
        // match the one that owns the yes/no buttons
        const root = this.page.locator('.picker-confirm:has(.yes)');
        return { root, text: root.locator('.text'), yes: root.locator('.yes'), no: root.locator('.no') };
    }

    // a pcui LabelGroup appends its label first, then the field, so the label is the
    // group's first child; matching a child (not any descendant) avoids hitting
    // labels rendered inside the field itself
    labelGroup(scope: Locator, label: string) {
        return scope.locator(`.pcui-label-group:has(> .pcui-label:text-is("${label}"))`);
    }

    /** Everything `reset()` needs to hand this page on, read before any test has touched it. */
    async baseline(): Promise<Baseline> {
        return {
            url: this.page.url(),
            viewport: this.page.viewportSize(),
            viewMode: await this.page.evaluate(() => (window.editor.call('layout.assets') as any).viewMode as string),
            gizmo: await this.page.evaluate(() => ({
                type: window.editor.call('gizmo:type') as string,
                coordSystem: window.editor.call('gizmo:coordSystem') as string
            })),
            state: await this.snapshot(),
            dirty: false
        };
    }

    /**
     * Hands the worker's one editor page to the next test. A spec that navigated away, reloaded
     * into another scene or failed gets a fresh load; otherwise the page is put back by hand,
     * which is far cheaper, and `restore()` drops whatever the last test left in the project.
     */
    async reset(base: Baseline) {
        if (base.dirty || this.page.url() !== base.url) {
            base.dirty = false;
            await this.page.goto(base.url);
            await waitForEditor(this.page);
        }

        const size = this.page.viewportSize();
        if (base.viewport && (size?.width !== base.viewport.width || size?.height !== base.viewport.height)) {
            await this.page.setViewportSize(base.viewport);
        }

        // Escape drops menus and the pickers that bind it; the rest are closed by name
        await this.page.keyboard.press('Escape');

        // the pointer has to leave whatever the last test hovered, or that element keeps its
        // hover state for the next one
        await this.page.mouse.move(0, 0);

        await this.page.evaluate(({ closers, viewMode, gizmo }) => {
            closers.forEach(method => window.editor.call(method));

            // a tooltip whose target was removed while it was up never sees the mouseleave that
            // hides it, and it then swallows every click on the panel it covers
            (window.editor.call('layout.tooltip') as any).hidden = true;

            // selector:clear, not selection.clear(), because it also drops the settings
            // inspector, which is a selector type of its own
            window.editor.call('selector:clear');
            if (window.editor.call('viewport:expand:state')) {
                window.editor.call('viewport:expand', false);
            }

            // the gizmo mode is page state too; snap has no getter, and false is where the
            // editor starts
            window.editor.call('gizmo:type', gizmo.type);
            window.editor.call('gizmo:coordSystem', gizmo.coordSystem);
            window.editor.call('gizmo:snap', false);

            // the assets panel keeps its folder, search and view mode now that the page does
            const panel = window.editor.call('layout.assets') as any;
            panel.currentFolder = null;
            panel.viewMode = viewMode;
            panel.searchInput.value = '';
        }, { closers: PICKER_CLOSERS, viewMode: base.viewMode, gizmo: base.gizmo });

        await this.restore(base.state);
    }

    /** Baseline for `restore()`; take it before a test touches the shared worker project. */
    snapshot() {
        return this.page.evaluate(() => {
            const globals = window.editor.api.globals;
            return {
                entities: globals.entities.list().map((e: any) => e.get('resource_id') as string),
                assets: globals.assets.list().map((a: any) => Number(a.get('id')))
            };
        }) as Promise<ProjectState>;
    }

    /**
     * Deletes every entity and asset added since `state`, so the spec hands the shared worker
     * project back the way it was given. Pipeline jobs drain first, since a job still reading a
     * doc the cleanup deletes fails with "Document does not exist". Entity deletes skip history;
     * an asset delete is a fire-and-forget realtime fs op, the same one the panel sends, so the
     * registry is polled until the removals land.
     */
    async restore(state: ProjectState) {
        await this.flushJobs();
        const removed = await this.arm((before: number[]) => {
            const assets = window.editor.api.globals.assets;
            const extra = () => assets.list().some((a: any) => !before.includes(Number(a.get('id'))));
            if (!extra()) {
                return { done: Promise.resolve() };
            }
            return { done: new Promise<void>((resolve) => {
                const evt = assets.on('remove', () => {
                    if (extra()) {
                        return;
                    }
                    evt.unbind();
                    resolve();
                });
            }) };
        }, state.assets);

        await this.page.evaluate(async (before) => {
            const globals = window.editor.api.globals;
            const entities = globals.entities.list()
            .filter((e: any) => e !== globals.entities.root && !before.entities.includes(e.get('resource_id')));
            if (entities.length) {
                await globals.entities.delete(entities, { history: false });
            }

            const assets = globals.assets.list().filter((a: any) => !before.assets.includes(Number(a.get('id'))));
            if (assets.length) {
                window.editor.call('assets:fs:delete', assets);
            }
        }, state);

        await removed();
    }

    /** Waits for every backend job the editor started (script attribute defaults, imports) to report back. */
    async flushJobs() {
        const drained = await this.arm(() => {
            const jobs = window.editor.api.globals.jobs as any;
            const pending = () => Object.keys(jobs._jobsInProgress).length > 0;
            if (!pending()) {
                return { done: Promise.resolve() };
            }
            return { done: new Promise<void>((resolve) => {
                const evt = jobs.on('finish', () => {
                    if (pending()) {
                        return;
                    }
                    evt.unbind();
                    resolve();
                });
            }) };
        }, undefined, { what: 'the editor jobs to drain', timeout: JOB_TIMEOUT });
        await drained();
    }

    /** Waits for the scene sharedb doc to flush, so a reload reads back what the test wrote. */
    flushScene() {
        return this.page.evaluate(() => new Promise<void>((resolve) => {
            window.editor.api.globals.realtime.scenes.current.whenNothingPending(resolve);
        }));
    }

    history() {
        return this.page.evaluate(() => {
            const h = window.editor.api.globals.history;
            return { canUndo: h.canUndo, canRedo: h.canRedo, last: h.lastAction ? h.lastAction.name : null };
        });
    }

    async undo() {
        await this.page.keyboard.press('ControlOrMeta+Z');
    }

    async redo() {
        await this.page.keyboard.press('ControlOrMeta+Shift+Z');
    }
}
