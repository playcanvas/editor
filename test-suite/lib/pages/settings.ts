import type { Locator, Page } from '@playwright/test';

import { EditorShell } from './common';

// the builds & publish form reuses `.settings` for a card, so anchor on the inspector layout
const ROOT = '#layout-attributes .settings';
const SECTION = '.pcui-panel.settings-panel';
const RESTART_MODAL = '.rendering-settings-restart-modal';

export class SettingsDialog {
    readonly shell: EditorShell;

    readonly root: Locator;

    readonly engineVersion: Locator;

    readonly restartModal: Locator;

    constructor(readonly page: Page) {
        this.shell = new EditorShell(page);
        this.root = page.locator(ROOT);

        // the select carries the hook class itself, so it only exists once the dialog is open
        this.engineVersion = page.locator('.settings-engine-version');
        this.restartModal = page.locator(RESTART_MODAL);
    }

    /** Opens the settings inspector from the logo menu (idempotent). */
    async open() {
        if (!(await this.root.isVisible())) {
            await this.shell.openLogoMenu('Settings');
        }
        await this.root.waitFor();
    }

    section(title: string) {
        return this.root.locator(`${SECTION}:has(> .pcui-panel-header > .pcui-panel-header-title:text-is("${title}"))`);
    }

    /** Every section but ENGINE starts collapsed, and a collapsed section hides its fields. */
    async expand(title: string) {
        const panel = this.section(title);
        await panel.waitFor();
        const collapsed = panel.and(this.page.locator('.pcui-collapsed'));
        if (!(await collapsed.count())) {
            return;
        }
        await panel.locator('.pcui-panel-header-title').first().click();
        await collapsed.waitFor({ state: 'detached' });
    }

    // dependent fields (clustered lighting cells, shadow atlas, ...) stay in the dom while
    // hidden, so filter on visibility to keep the label lookup single-match
    field(section: string, label: string) {
        return this.section(section).locator(`.pcui-label-group:visible:has(> .pcui-label:text-is("${label}"))`);
    }

    /** The Scene Name field sits above the sections, outside any panel. */
    get sceneNameField() {
        return this.root.locator('.pcui-label-group:has(> .pcui-label:text-is("Scene Name"))');
    }

    async toggle(section: string, label: string) {
        await this.field(section, label).locator('.pcui-boolean-input, .pcui-boolean-input-toggle').click();
    }

    async setSceneName(name: string) {
        const input = this.sceneNameField.locator('.pcui-text-input input');
        await input.fill(name);
        await input.press('Enter');
    }

    /** Picks a select option by its visible text. */
    async selectOption(select: Locator, text: string) {
        await select.locator('.pcui-select-input-value').click();
        await select.locator('.pcui-select-input-list').getByText(text, { exact: true }).click();
    }

    /** Resizes an ArrayInput field; new rows come up with the type's default value. */
    async setArraySize(field: Locator, size: number) {
        const input = field.locator('.pcui-array-input-size input');
        await input.fill(String(size));
        await input.press('Enter');
    }

    arrayItem(field: Locator, index: number) {
        return field.locator('.pcui-array-input-item').nth(index);
    }

    async setArrayItem(field: Locator, index: number, value: string) {
        const input = this.arrayItem(field, index).locator('input');
        await input.fill(value);
        await input.press('Enter');
    }

    async removeArrayItem(field: Locator, index: number) {
        await this.arrayItem(field, index).locator('.pcui-array-input-item-delete').click();
    }

    /** `config.project.settings` is mirrored live from the project settings observer. */
    projectSetting(path: string) {
        return this.page.evaluate((p) => {
            return p.split('.').reduce<any>((o, key) => o?.[key], window.config.project.settings);
        }, path);
    }

    setProjectSetting(path: string, value: unknown) {
        return this.page.evaluate(([p, v]) => {
            (window.editor.call('settings:project') as any).set(p, v);
        }, [path, value] as [string, unknown]);
    }

    sceneSetting(path: string) {
        return this.page.evaluate(p => window.editor.api.globals.settings.scene.get(p), path);
    }

    setSceneSetting(path: string, value: unknown) {
        return this.page.evaluate(([p, v]) => {
            window.editor.api.globals.settings.scene.set(p as string, v);
        }, [path, value] as [string, unknown]);
    }

    /** Session settings are in-memory only; nothing to restore across a reload. */
    sessionSetting(path: string) {
        return this.page.evaluate(p => (window.editor.call('settings:session') as any).get(p), path);
    }

    engineVersions() {
        return this.page.evaluate(() => window.config.engineVersions);
    }

    /**
     * Waits for the project settings sharedb doc to flush, so a reload reads the change back
     * from the server instead of racing the outgoing op.
     */
    flushProjectSettings() {
        return this.page.evaluate(() => new Promise<void>((resolve) => {
            const connection = window.editor.call('realtime:connection') as any;
            const doc = connection.get('settings', window.config.project.settings.id);
            doc.whenNothingPending(resolve);
        }));
    }

    /**
     * The restart modal only offers RELOAD (`rendering.ts` `showReloadDialog`), so a test that
     * must not reload has to tear it down itself.
     */
    async dismissRestartModal() {
        await this.page.evaluate((selector) => {
            document.querySelectorAll(selector).forEach((el) => {
                const ui = (el as any).ui;
                if (ui) {
                    ui.destroy();
                } else {
                    el.remove();
                }
            });
        }, RESTART_MODAL);
        await this.restartModal.waitFor({ state: 'detached' });
    }

    /** Stamps the page so a later read proves it was never reloaded. */
    mark() {
        return this.page.evaluate(() => {
            (window as any).__noReload = true;
        });
    }

    marked() {
        return this.page.evaluate(() => (window as any).__noReload === true);
    }
}
