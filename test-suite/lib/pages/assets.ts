import type { Locator, Page } from '@playwright/test';

import { EditorShell } from './common';

// asset panel view modes, as persisted by the panel itself
export const VIEW_LARGE_GRID = 'lgrid';
export const VIEW_SMALL_GRID = 'sgrid';
export const VIEW_DETAILS = 'details';

const VIEW_MODES = [VIEW_LARGE_GRID, VIEW_SMALL_GRID, VIEW_DETAILS];

const escape = (text: string) => text.replace(/["\\]/g, '\\$&');

export type AddedAsset = { id: number; name: string };
export type AddMatch = { name?: string; type?: string };

const addKey = (match: AddMatch) => `${match.name ?? ''}|${match.type ?? ''}`;

export class AssetsPanel {
    readonly root: Locator;

    readonly shell: EditorShell;

    readonly controls: Locator;

    readonly newButton: Locator;

    readonly deleteButton: Locator;

    readonly backButton: Locator;

    readonly search: Locator;

    readonly clearSearch: Locator;

    readonly typeDropdown: Locator;

    readonly inspector: Locator;

    readonly renameError: Locator;

    readonly nameField: Locator;

    constructor(readonly page: Page) {
        this.shell = new EditorShell(page);
        this.root = page.locator('#layout-assets');
        this.controls = this.root.locator('.pcui-asset-panel-controls');

        // new/delete/back are the only direct btn-small children of the controls
        // container, in that order (the view-mode buttons live in their own
        // container), so index is the only stable handle the panel exposes
        const small = this.controls.locator('> .pcui-asset-panel-btn-small');
        this.newButton = small.nth(0);
        this.deleteButton = small.nth(1);
        this.backButton = small.nth(2);

        // the type dropdown embeds its own text input, so bind to the search
        // field that sits directly in the controls container
        this.search = this.controls.locator('> .pcui-text-input input');
        this.clearSearch = this.controls.locator('.pcui-asset-panel-btn-clear-search');
        this.typeDropdown = this.controls.locator('.pcui-select-input');
        this.inspector = page.locator('#layout-attributes .asset-inspector');

        // typed sub-inspectors carry their own "Name" fields, so use the class the
        // asset inspector puts on its own name group rather than the label text
        const renameGroup = this.inspector.locator('.asset-rename-error-group');
        this.nameField = renameGroup.locator('.pcui-text-input input');
        this.renameError = renameGroup.locator('.asset-rename-error');
    }

    // pcui text inputs report changes on keyup or the native change event, so
    // every field has to be typed into rather than filled
    async retype(field: Locator, value: string) {
        await field.click();
        await field.press('ControlOrMeta+A');
        if (value) {
            await field.pressSequentially(value);
        } else {
            await field.press('Backspace');
        }
        await field.press('Enter');
    }

    async typeSearch(value: string) {
        await this.retype(this.search, value);
    }

    /** Renames the selected asset through the inspector's Name field. */
    async rename(value: string) {
        await this.retype(this.nameField, value);
    }

    /** Clicks an asset unless it is already selected, since a click toggles it off. */
    async select(name: string) {
        const item = this.gridItem(name);
        if (!await item.evaluate(el => el.classList.contains('pcui-gridview-item-selected'))) {
            await item.click();
        }
    }

    async addToSelection(name: string) {
        await this.gridItem(name).click({ modifiers: ['ControlOrMeta'] });
    }

    gridItem(name: string) {
        return this.root.locator(`.pcui-asset-grid-view-item:has(> .pcui-gridview-item-text:text-is("${escape(name)}"))`);
    }

    detailsRow(name: string) {
        return this.root.locator(`.pcui-table-row:has(> .pcui-asset-panel-details-name > .pcui-label:text-is("${escape(name)}"))`);
    }

    folderTreeItem(name: string) {
        return this.root.locator(`.pcui-asset-panel-folders .pcui-treeview-item:has(> .pcui-treeview-item-contents > .pcui-treeview-item-text:text-is("${escape(name)}"))`);
    }

    get visibleGridItems() {
        return this.root.locator('.pcui-asset-grid-view-item').filter({ visible: true });
    }

    /** Opens the "+" menu and picks one of its create entries. */
    async newAsset(item: string) {
        await this.newButton.click();
        await this.shell.menuItem(item).click();
    }

    /** Right-clicks an asset by name and picks a top-level context menu entry. */
    async contextMenu(name: string, item: string | RegExp) {
        await this.gridItem(name).click({ button: 'right' });
        await this.shell.menuItem(item).click();
    }

    viewMode() {
        return this.page.evaluate(() => (window.editor.call('layout.assets') as any).viewMode as string);
    }

    async setViewMode(mode: string) {
        const index = VIEW_MODES.indexOf(mode);
        if (index === -1) {
            throw new Error(`unknown view mode: ${mode}`);
        }

        // the three view-mode buttons are the only children of the view button
        // container, ordered large grid / small grid / details
        await this.controls.locator('.pcui-asset-panel-btn-container > .pcui-asset-panel-btn-small').nth(index).click();
    }

    /** Picks an entry from the type filter dropdown by its asset type value. */
    async filterType(type: string) {
        await this.typeDropdown.locator('.pcui-select-input-value').click();
        await this.typeDropdown.locator(`.pcui-select-input-list > [id="${escape(type)}"]`).click();
    }

    currentFolderId() {
        return this.page.evaluate(() => {
            const folder = (window.editor.call('layout.assets') as any).currentFolder;
            return folder ? parseInt(folder.get('id'), 10) : null;
        });
    }

    /** Names of the assets the panel currently shows, from panel state. */
    visibleNames() {
        return this.page.evaluate(() => {
            const panel = window.editor.call('layout.assets') as any;
            return panel.visibleAssets.map((asset: any) => asset.get('name') as string);
        });
    }

    selectedIds() {
        return this.page.evaluate(() => {
            const items = window.editor.call('selector:items') as any[];
            return window.editor.call('selector:type') === 'asset' ? items.map(item => parseInt(item.get('id'), 10)) : [];
        });
    }

    /**
     * Installs an assets 'add' listener in the page, matching on name and/or
     * type. Call before the action that creates the asset, then `awaitAdd` with
     * the same match, so the listener always exists before the asset lands.
     */
    async armAdd(match: AddMatch = {}) {
        await this.page.evaluate(([key, expected]) => {
            const store = ((window as any).__e2eAdds ??= new Map<string, Promise<AddedAsset>>());
            const matches = (asset: any) => {
                return (!expected.name || asset.get('name') === expected.name) &&
                    (!expected.type || asset.get('type') === expected.type);
            };
            store.set(key as string, new Promise((resolve) => {
                // only a name identifies an asset that may already be here; a type
                // on its own would match something created long before this call
                const existing = expected.name ? window.editor.api.globals.assets.findOne(matches) : null;
                if (existing) {
                    resolve({ id: existing.get('id'), name: existing.get('name') });
                    return;
                }
                const handle = window.editor.api.globals.assets.on('add', (asset: any) => {
                    if (!matches(asset)) {
                        return;
                    }
                    handle.unbind();
                    resolve({ id: asset.get('id'), name: asset.get('name') });
                });
            }));
        }, [addKey(match), match] as const);
    }

    awaitAdd(match: AddMatch = {}) {
        return this.page.evaluate((key) => {
            const store = (window as any).__e2eAdds as Map<string, Promise<AddedAsset>>;
            const pending = store?.get(key);
            if (!pending) {
                throw new Error(`no armed add listener for "${key}"`);
            }
            return pending;
        }, addKey(match)) as Promise<AddedAsset>;
    }

    async waitForAdd(name: string) {
        await this.armAdd({ name });
        return (await this.awaitAdd({ name })).id;
    }

    /** Waits for a delete or any other change that drops the asset from the registry. */
    async waitForRemove(id: number) {
        await this.page.waitForFunction(assetId => !window.editor.api.globals.assets.get(assetId), id);
    }

    /** Waits for a realtime move to land on the asset observer. */
    async waitForParent(id: number, parentId: number | null) {
        await this.page.waitForFunction(([assetId, expected]) => {
            const asset = window.editor.api.globals.assets.get(assetId as number);
            if (!asset) {
                return false;
            }
            const path = asset.get('path') as number[];
            return (path.length ? path[path.length - 1] : null) === expected;
        }, [id, parentId]);
    }

    /** Waits for an asset's pipeline task to finish and its file to land. */
    async waitForTask(id: number, timeout: number) {
        await this.page.waitForFunction((assetId) => {
            const asset = window.editor.api.globals.assets.get(assetId);
            return !!asset && !asset.get('task') && !!asset.get('file.size');
        }, id, { timeout });
    }

    /** A field of an asset, read straight from the registry. */
    field(id: number, path: string) {
        return this.page.evaluate(([assetId, key]) => {
            const asset = window.editor.api.globals.assets.get(assetId as number);
            return asset ? asset.get(key as string) : null;
        }, [id, path]);
    }

    exists(id: number) {
        return this.page.evaluate(assetId => !!window.editor.api.globals.assets.get(assetId), id);
    }

    idByName(name: string) {
        return this.page.evaluate((assetName) => {
            const asset = window.editor.api.globals.assets.findOne((a: any) => a.get('name') === assetName);
            return asset ? (asset.get('id') as number) : null;
        }, name);
    }

    /** Assets whose immediate parent is the given folder, or the root when null. */
    childrenOf(folderId: number | null) {
        return this.page.evaluate((parentId) => {
            return window.editor.api.globals.assets
            .filter((a: any) => {
                const path = a.get('path');
                return (path.length ? path[path.length - 1] : null) === parentId;
            })
            .map((a: any) => ({ id: a.get('id') as number, name: a.get('name') as string, type: a.get('type') as string }));
        }, folderId);
    }

    clipboardAssetIds() {
        return this.page.evaluate(() => {
            const clipboard = window.editor.call('clipboard:get') as any;
            return clipboard && clipboard.type === 'asset' ? (clipboard.assets as number[]) : null;
        });
    }

    /** How many runtime assets of a type sit directly in a folder, root by default. */
    countOfType(type: string, folderId: number | null = null) {
        return this.page.evaluate(([assetType, parentId]) => {
            return window.editor.api.globals.assets.filter((a: any) => {
                if (a.get('type') !== assetType || a.get('source')) {
                    return false;
                }
                const path = a.get('path');
                return (path.length ? path[path.length - 1] : null) === parentId;
            }).length;
        }, [type, folderId] as const);
    }

    /** Creates an asset through the editor-api and resolves once it is registered. */
    create(method: string, options: Record<string, unknown> = {}, folderId?: number) {
        return this.page.evaluate(async ([fn, opts, parentId]) => {
            const assets = window.editor.api.globals.assets as any;
            const args: Record<string, unknown> = { ...(opts as Record<string, unknown>) };
            if (parentId !== undefined && parentId !== null) {
                args.folder = assets.get(parentId as number);
            }
            const asset = await assets[fn as string](args);
            return { id: asset.get('id') as number, name: asset.get('name') as string };
        }, [method, options, folderId ?? null] as const) as Promise<AddedAsset>;
    }

    /** Adds a tag the same way the inspector does, via an observer insert. */
    async addTag(id: number, tag: string) {
        await this.page.evaluate(([assetId, value]) => {
            const asset = window.editor.api.globals.assets.get(assetId as number);
            if (!asset) {
                throw new Error(`asset ${assetId} not found`);
            }
            asset.insert('tags', value, undefined);
        }, [id, tag]);
    }

    /**
     * Uploads a file through `assets:upload:files`. A File cannot cross the
     * evaluate boundary, so the payload is staged on a throwaway file input.
     */
    async upload(file: { name: string; mimeType: string; buffer: Buffer }) {
        const input = this.page.locator('#e2e-upload');
        await this.page.evaluate(() => {
            const el = document.createElement('input');
            el.type = 'file';
            el.id = 'e2e-upload';
            el.style.display = 'none';
            document.body.appendChild(el);
        });
        await input.setInputFiles(file);
        await this.page.evaluate(() => {
            const el = document.getElementById('e2e-upload') as HTMLInputElement;
            window.editor.call('assets:upload:files', el.files);
            el.remove();
        });
    }

    /**
     * Drags an asset onto a folder tree item. The panel arms its drop manager on
     * a native dragstart and then completes the gesture with plain mouse events,
     * so drive both: dispatch the dragstart, then move and release for real.
     */
    async dragToFolder(name: string, folderName: string) {
        const item = this.gridItem(name);
        const folder = this.folderTreeItem(folderName).locator('> .pcui-treeview-item-contents');

        const from = await item.boundingBox();
        const to = await folder.boundingBox();
        if (!from || !to) {
            throw new Error(`cannot drag "${name}" onto "${folderName}": missing bounding box`);
        }

        await this.page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
        await this.page.mouse.down();
        await item.dispatchEvent('dragstart');
        await this.page.waitForFunction(() => (window.editor.call('layout.assets') as any).dropManager.active);
        await this.page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });

        // the panel only moves assets onto the folder it considers hovered, so
        // release once that highlight is on
        await this.folderTreeItem(folderName).and(this.page.locator('.pcui-asset-panel-highlighted-asset')).waitFor();
        await this.page.mouse.up();
    }
}
