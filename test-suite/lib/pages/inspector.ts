import type { Locator, Page } from '@playwright/test';

import { EditorShell } from './common';

const ASSET_PICKER = '.picker-asset';
const ASSET_GRID_ITEM = '#layout-assets .pcui-asset-grid-view-item';
const PICK_MODE = '#layout-hierarchy.entity-picker-mode';
const TREE_ROW = '#layout-hierarchy .pcui-treeview-item-contents';

export class Inspector {
    readonly shell: EditorShell;

    readonly root: Locator;

    readonly header: Locator;

    readonly entity: Locator;

    /** the entity's own fields, excluding the ones inside component panels */
    readonly entityFields: Locator;

    readonly addComponentButton: Locator;

    readonly asset: Locator;

    readonly colorPicker: Locator;

    constructor(readonly page: Page) {
        this.shell = new EditorShell(page);
        this.root = page.locator('#layout-attributes');
        this.header = this.root.locator('.pcui-panel-header-title').first();
        this.entity = page.locator('.entity-inspector');
        this.entityFields = page.locator('.entity-inspector > .pcui-inspector');
        this.addComponentButton = page.locator('button.entity-inspector-add-component');
        this.asset = page.locator('.asset-inspector');
        this.colorPicker = page.locator('.picker-color');
    }

    component(name: string) {
        return this.page.locator(`.${name}-component-inspector`);
    }

    /** the ON / OFF label group in a component panel header */
    componentEnabled(name: string) {
        return this.page.locator(`.${name}-component-inspector > .pcui-panel-header > .component-inspector-enabled`);
    }

    // one inspector is built per asset type key, so texture and textureatlas both leave an
    // .asset-texture-inspector in the dom and only the linked one is shown
    assetType(type: string) {
        return this.page.locator(`.asset-${type}-inspector:not(.pcui-hidden)`);
    }

    /** a nested panel identified by its header text, e.g. DIFFUSE on a material */
    panel(scope: Locator, title: string) {
        return scope.locator(`.pcui-panel:has(> .pcui-panel-header > .pcui-panel-header-title:text-is("${title}"))`);
    }

    field(scope: Locator, label: string) {
        return this.shell.labelGroup(scope, label);
    }

    // an asset slot carries its own label instead of sitting in a pcui LabelGroup
    assetSlot(scope: Locator, label: string) {
        return scope.locator(`.pcui-asset-input:has(> .pcui-asset-input-label:text-is("${label}"))`);
    }

    /** False while a component hides the field for the current type or mode. */
    fieldVisible(scope: Locator, label: string) {
        return this.field(scope, label).or(this.assetSlot(scope, label)).isVisible();
    }

    async expand(panel: Locator) {
        await panel.waitFor();
        const collapsed = panel.and(this.page.locator('.pcui-collapsed'));
        if (!(await collapsed.count())) {
            return;
        }

        // only the header container and its title toggle the panel
        await panel.locator('.pcui-panel-header-title').first().click();
        await collapsed.waitFor({ state: 'detached' });
    }

    async setNumber(scope: Locator, label: string, value: number) {
        await this.commit(this.field(scope, label).locator('.pcui-numeric-input input').first(), value);
    }

    async setVector(scope: Locator, label: string, values: number[]) {
        // pcui renders one numeric input per axis in order, and the placeholders are not always
        // X / Y / Z (a zone is W / H / D, a screen resolution Width / Height), so go by index
        const inputs = this.field(scope, label).locator('.pcui-numeric-input input');
        for (let i = 0; i < values.length; i++) {
            await this.commit(inputs.nth(i), values[i]);
        }
    }

    /** Sets a slider through its numeric input; dragging the handle cannot hit an exact value. */
    async setSlider(scope: Locator, label: string, value: number) {
        await this.commit(this.field(scope, label).locator('.pcui-slider .pcui-numeric-input input'), value);
    }

    /** Picks a dropdown entry by its visible option text. */
    async setSelect(scope: Locator, label: string, option: string) {
        const select = this.field(scope, label).locator('.pcui-select-input');
        await select.locator('.pcui-select-input-value').click();
        await select.locator(`.pcui-select-input-list > .pcui-label:text-is("${option}")`).click();
    }

    async setText(scope: Locator, label: string, value: string) {
        // pcui text inputs report on the native change event, which Enter fires by blurring
        const input = this.field(scope, label).locator('input, textarea').first();
        await input.click();
        await input.press('ControlOrMeta+A');
        await input.pressSequentially(value);
        await input.press('Enter');
    }

    /**
     * Assigns an asset through the editor's asset picker rather than a drag: the picker reuses
     * the assets panel grid, so the gesture is a click on a row the panel already filtered.
     */
    async assignAsset(scope: Locator, label: string, assetName: string) {
        await this.assetSlot(scope, label).locator('.pcui-asset-input-edit').click();
        const picker = this.page.locator(ASSET_PICKER);
        await picker.waitFor();
        await this.page.locator(`${ASSET_GRID_ITEM}:has(> .pcui-gridview-item-text:text-is("${assetName}"))`).click();
        await picker.waitFor({ state: 'hidden' });
    }

    async clearAsset(scope: Locator, label: string) {
        await this.assetSlot(scope, label).locator('.pcui-asset-input-remove').click();
    }

    /** Clicking an entity field puts the hierarchy into pick mode, where a row click is the choice. */
    async pickEntity(scope: Locator, label: string, entityName: string) {
        await this.field(scope, label).locator('.pcui-entity-input').click();
        const mode = this.page.locator(PICK_MODE);
        await mode.waitFor();
        await this.page.locator(`${TREE_ROW}:has(> .pcui-treeview-item-text:text-is("${entityName}"))`).click();
        await mode.waitFor({ state: 'detached' });
    }

    /** One observer path of an entity, or undefined when the entity is gone. */
    read(id: string, path: string) {
        return this.page.evaluate(([i, p]) => {
            return window.editor.api.globals.entities.get(i)?.get(p);
        }, [id, path]);
    }

    // a removed component still reads back as null through get(), so absence needs has()
    has(id: string, path: string) {
        return this.page.evaluate(([i, p]) => {
            return !!window.editor.api.globals.entities.get(i)?.has(p);
        }, [id, path]);
    }

    async toggle(scope: Locator, label: string) {
        // toggle style booleans carry pcui-boolean-input-toggle instead of pcui-boolean-input
        await this.field(scope, label).locator('.pcui-boolean-input, .pcui-boolean-input-toggle').click();
    }

    async toggleComponent(name: string) {
        await this.componentEnabled(name).locator('.pcui-boolean-input-toggle').click();
    }

    async addComponent(path: string[]) {
        await this.addComponentButton.click();
        for (let i = 0; i < path.length; i++) {
            const item = this.shell.menuItem(path[i]);

            // submenus are only revealed while their parent item is hovered
            if (i < path.length - 1) {
                await item.hover();
            } else {
                await item.click();
            }
        }
    }

    /** The "..." menu beside ADD COMPONENT, which owns the paste and remove-all entries. */
    async entityMenu(item: string) {
        await this.page.locator('.entity-inspector .pcui-container:has(> button.entity-inspector-add-component) > button:not(.entity-inspector-add-component)').click();
        await this.shell.menuItem(item).click();
    }

    async componentMenu(name: string, item: string) {
        // the header holds the help button first and the "..." menu button last
        const buttons = this.page.locator(`.${name}-component-inspector > .pcui-panel-header > .component-header-btn`);
        await buttons.last().click();
        await this.shell.menuItem(item).click();
    }

    /** opens the color picker of a colour field and waits for it to be interactive */
    async openColorPicker(scope: Locator, label: string) {
        // picker-color.ts refocuses its hex field with select() 100ms after opening, which
        // steals focus from a channel input mid-fill and drops the edit, so hold until it lands
        const refocused = await this.page.evaluateHandle(() => {
            const hex = document.querySelector<HTMLInputElement>('.picker-color .field-hex input')!;
            const select = hex.select;
            return { done: new Promise<void>((resolve) => {
                hex.select = () => {
                    hex.select = select;
                    select.call(hex);
                    resolve();
                };
            }) };
        });
        await this.field(scope, label).locator('.pcui-color-input').click();
        await this.colorPicker.waitFor();
        await this.page.evaluate(h => h.done, refocused);
        await refocused.dispose();
    }

    /** sets one 0-255 channel of the open color picker and waits for the colour input to receive it */
    async setColorChannel(channel: 'r' | 'g' | 'b' | 'a', value: number) {
        // picker-color.ts hands the edit to the colour input on a 16ms timer; closing the picker
        // before it fires unbinds the input and drops the edit
        const delivered = await this.page.evaluateHandle(() => {
            let resolve: () => void;
            const evt = window.editor.on('picker:color', () => {
                evt.unbind();
                resolve();
            });
            return { done: new Promise<void>((r) => {
                resolve = r;
            }) };
        });
        await this.commit(this.colorPicker.locator(`.field-${channel} input`), value);
        await this.page.evaluate(h => h.done, delivered);
        await delivered.dispose();
    }

    /** the picker overlay swallows clicks on the inspector behind it until it is dismissed */
    async closeColorPicker() {
        await this.page.keyboard.press('Escape');
        await this.colorPicker.waitFor({ state: 'hidden' });
    }

    /**
     * Starts recording the history actions pushed from now on. Combined edits (colour and
     * slider drags) reuse the current action, so they only ever count once.
     */
    async recordHistory() {
        await this.page.evaluate(() => {
            const store = window as unknown as { pcActions?: string[]; pcActionsEvt?: { unbind(): void } };
            const history = window.editor.api.globals.history;
            store.pcActionsEvt?.unbind();
            store.pcActions = [];
            let current: unknown = history.currentAction;
            store.pcActionsEvt = history.on('add', (name: string) => {
                if (history.currentAction === current) {
                    return;
                }
                current = history.currentAction;
                store.pcActions!.push(name);
            });
        });
    }

    historyActions() {
        return this.page.evaluate(() => (window as unknown as { pcActions?: string[] }).pcActions ?? []);
    }

    private async commit(input: Locator, value: number) {
        // fill focuses without hit testing: the placeholder and mixed value overlays are
        // drawn as pseudo elements of the wrapper and swallow a real click
        await input.fill(String(value));

        // number fields commit on change, which pcui fires when Enter blurs the input
        await input.press('Enter');
    }
}
