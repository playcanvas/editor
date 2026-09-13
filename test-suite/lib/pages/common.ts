import type { Locator, Page } from '@playwright/test';

/** Ids of everything a project holds, as `snapshot()` found them. */
export type ProjectState = { entities: string[]; assets: number[] };

export class EditorShell {
    constructor(readonly page: Page) {}

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
     * project back the way it was given. Entity deletes skip history; an asset delete is a
     * fire-and-forget realtime fs op, the same one the panel sends, so the registry is polled
     * until the removals land.
     */
    async restore(state: ProjectState) {
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

        await this.page.waitForFunction((before) => {
            return window.editor.api.globals.assets.list().every((a: any) => before.includes(Number(a.get('id'))));
        }, state.assets);
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
