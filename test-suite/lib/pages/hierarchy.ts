import type { Locator, Page } from '@playwright/test';

import { EditorShell } from './common';

export type EntityOpts = { parent?: string; name?: string; components?: Record<string, unknown> };

const ROW = '.pcui-treeview-item';
const CONTENTS = `${ROW}-contents`;
const TEXT = `${ROW}-text`;
const RENAME_INPUT = `${ROW}-rename .pcui-text-input input`;

export class HierarchyPanel {
    readonly root: Locator;

    readonly tree: Locator;

    private shell: EditorShell;

    constructor(readonly page: Page) {
        this.root = page.locator('#layout-hierarchy');
        this.tree = page.locator('.entities-treeview');
        this.shell = new EditorShell(page);
    }

    // a row element wraps its whole subtree, so filtering rows by descendant text also matches
    // every ancestor of the match; a contents element only ever holds its own label
    rowContents(name: string) {
        return this.tree.locator(CONTENTS).filter({ has: this.page.locator(`${TEXT}:text-is("${name}")`) });
    }

    row(name: string) {
        return this.rowContents(name).locator('..');
    }

    /** The same lookup restricted to the subtree of `parent`, for names the scene may reuse. */
    childRow(parent: string, name: string) {
        const contents = this.row(parent).locator(CONTENTS);
        return contents.filter({ has: this.page.locator(`${TEXT}:text-is("${name}")`) }).locator('..');
    }

    // PCUI puts the selected class on the contents element, not on the row that wraps the subtree
    selectedRows() {
        return this.tree.locator(`${CONTENTS}${ROW}-selected`);
    }

    addButton() {
        return this.root.locator('.hierarchy-controls .pcui-button').first();
    }

    renameInput() {
        return this.tree.locator(RENAME_INPUT);
    }

    // a menu item renders its shortcut as a second .pcui-label, and shortcuts like "Delete" repeat
    // the item text, so always take the first match: the text label is appended first
    private menuLabel(text: string | RegExp) {
        return this.shell.menuItem(text).first();
    }

    /** The `.pcui-menu-item` around a menu label, which is what carries `pcui-disabled`. */
    menuItem(text: string | RegExp) {
        return this.menuLabel(text).locator('../..');
    }

    /** Opens the header add menu, hovers every path segment but the last, then clicks the last. */
    async add(...path: string[]) {
        await this.addButton().click();
        for (const parent of path.slice(0, -1)) {
            await this.menuLabel(parent).hover();
        }
        await this.menuLabel(path[path.length - 1]).click();
    }

    async openContextMenu(name: string) {
        await this.rowContents(name).click({ button: 'right' });
    }

    async contextMenu(name: string, item: string | RegExp) {
        await this.openContextMenu(name);
        await this.menuLabel(item).click();
    }

    // PCUI toggles a row that is already the only selected one, so only call this on an unselected row
    async select(name: string) {
        await this.rowContents(name).click();
        await this.waitForSelected(name);
    }

    async shiftSelect(name: string) {
        await this.rowContents(name).click({ modifiers: ['Shift'] });
        await this.waitForSelected(name);
    }

    async startRename(name: string) {
        await this.rowContents(name).locator(TEXT).dblclick();
        await this.renameInput().waitFor();
    }

    async rename(oldName: string, newName: string) {
        await this.startRename(oldName);
        await this.renameInput().fill(newName);
        await this.renameInput().press('Enter');
    }

    /**
     * Drops `from` inside `to`. PCUI opens the drag from a native `dragstart` that it cancels
     * straight away and then tracks plain mouse events, so the pointer has to cross the browser
     * drag threshold before it hovers the target row.
     */
    async dragInto(from: string, to: string) {
        const src = await this.rowContents(from).boundingBox();
        const dst = await this.rowContents(to).boundingBox();
        if (!src || !dst) {
            throw new Error(`cannot drag ${from} onto ${to}: row is not visible`);
        }
        const mouse = this.page.mouse;

        // the vertical middle of a row is its "inside" drop zone
        const x = dst.x + dst.width / 2;
        const y = dst.y + dst.height / 2;
        await mouse.move(src.x + src.width / 2, src.y + src.height / 2);
        await mouse.down();
        await mouse.move(src.x + src.width / 2, src.y + src.height / 2 + 8, { steps: 4 });
        await mouse.move(x, y, { steps: 8 });
        await mouse.move(x, y);
        await mouse.up();
    }

    createEntity(opts: EntityOpts = {}) {
        return this.page.evaluate((o) => {
            const entities = window.editor.api.globals.entities;
            const data: any = { parent: o.parent ?? entities.root.get('resource_id') };
            if (o.name) {
                data.name = o.name;
            }
            if (o.components) {
                data.components = o.components;
            }
            return entities.create(data, { history: true, select: false }).get('resource_id') as string;
        }, opts);
    }

    /** Removes entities by resource id, skipping ones already gone, to give back a clean scene. */
    async remove(ids: string[]) {
        if (!ids.length) {
            return;
        }
        await this.page.evaluate(async (list) => {
            const entities = window.editor.api.globals.entities;
            const targets = list.flatMap((id) => {
                const entity = entities.get(id);
                return entity && entity !== entities.root ? [entity] : [];
            });
            if (targets.length) {
                await entities.delete(targets, { history: false });
            }
        }, ids);
    }

    ids() {
        return this.page.evaluate(() => {
            return window.editor.api.globals.entities.list().map(e => e.get('resource_id')) as string[];
        });
    }

    rootId() {
        return this.page.evaluate(() => window.editor.api.globals.entities.root.get('resource_id') as string);
    }

    rootName() {
        return this.page.evaluate(() => window.editor.api.globals.entities.root.get('name') as string);
    }

    /** Reads one observer path, or undefined when the entity is gone. */
    get(id: string, path: string) {
        return this.page.evaluate(([i, p]) => {
            const entity = window.editor.api.globals.entities.get(i);
            return entity ? entity.get(p) : undefined;
        }, [id, path]);
    }

    exists(id: string) {
        return this.page.evaluate(i => !!window.editor.api.globals.entities.get(i), id);
    }

    selection() {
        return this.page.evaluate(() => {
            const selection = window.editor.api.globals.selection;
            return {
                count: selection.count,
                ids: selection.items.map(i => i.get('resource_id')) as string[],
                names: selection.items.map(i => i.get('name')) as string[]
            };
        });
    }

    // selector:change is deferred through a setTimeout(0), so poll instead of reading once
    async waitForSelected(name: string) {
        await this.page.waitForFunction((n) => {
            return window.editor.api.globals.selection.items.some(i => i.get('name') === n);
        }, name);
    }

    /** Waits for an async editor op (delete, duplicate, paste) to land on the history stack. */
    async waitForAction(name: string) {
        await this.page.waitForFunction((n) => {
            const action = window.editor.api.globals.history.lastAction;
            return !!action && action.name === n;
        }, name);
    }
}
