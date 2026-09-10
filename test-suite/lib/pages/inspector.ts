import type { Locator, Page } from '@playwright/test';

import { EditorShell } from './common';

const AXES = ['X', 'Y', 'Z', 'W'];

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
        const field = this.field(scope, label);
        for (let i = 0; i < values.length; i++) {
            // pcui puts the axis placeholder on the input wrapper, not on the input itself
            await this.commit(field.locator(`.pcui-numeric-input[placeholder="${AXES[i]}"] input`), values[i]);
        }
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

    async componentMenu(name: string, item: string) {
        // the header holds the help button first and the "..." menu button last
        const buttons = this.page.locator(`.${name}-component-inspector > .pcui-panel-header > .component-header-btn`);
        await buttons.last().click();
        await this.shell.menuItem(item).click();
    }

    /** opens the color picker of a colour field and waits for it to be interactive */
    async openColorPicker(scope: Locator, label: string) {
        await this.field(scope, label).locator('.pcui-color-input').click();
        await this.colorPicker.waitFor();

        // the picker focuses its hex field twice, the second time 100ms later with the
        // text selected, so wait for that before typing into another field
        await this.page.waitForFunction(() => {
            const el = document.activeElement as HTMLInputElement | null;
            return !!el && el.selectionStart === 0 && el.selectionEnd === el.value.length && el.value.length > 0;
        });
    }

    /** sets one 0-255 channel of the open color picker */
    async setColorChannel(channel: 'r' | 'g' | 'b' | 'a', value: number) {
        await this.commit(this.colorPicker.locator(`.field-${channel} input`), value);
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
