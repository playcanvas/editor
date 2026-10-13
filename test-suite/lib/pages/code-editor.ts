import type { Locator, Page } from '@playwright/test';

import { waitForParser } from '../common';
import { EditorShell } from './common';

const ROW = '.pcui-treeview-item';
const CONTENTS = `${ROW}-contents`;
const TEXT = `${ROW}-text`;

const escape = (text: string) => text.replace(/["\\]/g, '\\$&');
const exact = (text: string) => new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);

export class CodeEditor {
    readonly shell: EditorShell;

    readonly tree: Locator;

    readonly tabs: Locator;

    readonly monaco: Locator;

    readonly status: Locator;

    readonly renameInput: Locator;

    readonly renameError: Locator;

    readonly createInput: Locator;

    constructor(readonly page: Page) {
        this.shell = new EditorShell(page);
        this.tree = page.locator('#ui-left');
        this.tabs = page.locator('#ui-tabs');
        this.monaco = page.locator('#ui-code .monaco-editor textarea.inputarea');
        this.status = page.locator('#ui-bottom .status');
        this.renameInput = this.tree.locator('.files-rename-input input');
        this.renameError = page.locator('.files-rename-error-popup');
        this.createInput = page.locator('.picker-script-create input');
    }

    // a row element wraps its whole subtree, so filtering rows by descendant text also matches the
    // root folder; the contents element only ever holds its own label
    treeItem(name: string) {
        return this.tree.locator(`${ROW}:has(> ${CONTENTS} > ${TEXT}:text-is("${escape(name)}"))`);
    }

    treeContents(name: string) {
        return this.treeItem(name).locator(`> ${CONTENTS}`);
    }

    // a tab holds a .name container around a .name label, so match the label element itself
    tab(name: string) {
        return this.tabs.locator(`.tab:has(.pcui-label:text-is("${escape(name)}"))`);
    }

    /** Clicks the tree item and waits for the document and its monaco view to be ready. */
    async open(name: string, id: number) {
        const opened = await this.armDoc(id);
        await this.treeContents(name).click();
        await opened();
    }

    async openMenu(menu: string, ...path: string[]) {
        await this.page.locator('#ui-top .pcui-button').filter({ hasText: exact(menu) }).click();
        for (const parent of path.slice(0, -1)) {
            await this.shell.menuItem(parent).first().hover();
        }
        await this.shell.menuItem(path[path.length - 1]).first().click();
    }

    async contextMenu(name: string, item: string) {
        await this.treeContents(name).click({ button: 'right' });
        await this.shell.menuItem(item).first().click();
    }

    // pcui inputs report changes on keyup or the native change event, so every field has to be
    // typed into rather than filled
    async retype(field: Locator, value: string) {
        await field.click();
        await field.press('ControlOrMeta+A');
        await field.pressSequentially(value);
        await field.press('Enter');
    }

    async typeAtEnd(text: string) {
        await this.monaco.focus();

        // monaco binds the document end to ctrl+end on windows/linux only, so place the caret
        // through its api and leave the edit itself to real keystrokes
        await this.page.evaluate(() => {
            const editor = window.editor.call('editor:monaco') as any;
            const model = editor.getModel();
            const line = model.getLineCount();
            editor.setPosition({ lineNumber: line, column: model.getLineMaxColumn(line) });
        });
        await this.page.keyboard.type(text);
    }

    /** Saves the focused document with the code editor hotkey, which monaco owns. */
    async save() {
        const id = await this.focusedId();
        const saved = await this.shell.arm((docId: string | null) => {
            const clean = () => !window.editor.call('documents:isDirty', docId);
            if (clean()) {
                return { done: Promise.resolve() };
            }
            return { done: new Promise<void>((resolve) => {
                const evt = window.editor.on('documents:dirty', () => {
                    if (!clean()) {
                        return;
                    }
                    evt.unbind();
                    resolve();
                });
            }) };
        }, id);
        await this.monaco.focus();
        await this.page.keyboard.press('ControlOrMeta+S');
        await saved();
    }

    content() {
        return this.page.evaluate(() => (window.editor.call('editor:monaco') as any).getValue() as string);
    }

    tabIds() {
        return this.page.evaluate(() => (window.editor.call('tabs:list') as { id: string }[]).map(t => t.id));
    }

    focusedId() {
        return this.page.evaluate(() => {
            const tab = window.editor.call('tabs:focused') as { id: string } | null;
            return tab ? tab.id : null;
        });
    }

    isDirty(id: number) {
        return this.page.evaluate(i => window.editor.call('documents:isDirty', i) as boolean, String(id));
    }

    isTemp(id: number) {
        return this.page.evaluate(i => !!window.editor.call('tabs:isTemp', i), String(id));
    }

    /** Reads one path off the code editor's own asset observer, or undefined when the asset is gone. */
    asset(id: number, path: string) {
        return this.page.evaluate(([i, p]) => {
            const asset = window.editor.call('assets:get', i) as { get(path: string): unknown } | null;
            return asset ? asset.get(p) : undefined;
        }, [String(id), path]);
    }

    /** The tree renames optimistically; await the asset observer's confirmed value. */
    armAssetField(id: number, path: string, value: unknown) {
        return this.shell.arm(({ id: i, path: p, value: expected }) => {
            const asset = window.editor.call('assets:get', String(i)) as any;
            const hit = () => JSON.stringify(asset.get(p)) === JSON.stringify(expected);
            if (hit()) {
                return { done: Promise.resolve() };
            }
            return { done: new Promise<void>((resolve) => {
                const evt = asset.on('*:set', () => {
                    if (hit()) {
                        evt.unbind();
                        resolve();
                    }
                });
            }) };
        }, { id, path, value });
    }

    assetNames() {
        return this.page.evaluate(() => {
            return (window.editor.call('assets:list') as { get(path: string): unknown }[]).map(a => a.get('name') as string);
        });
    }

    assetId(name: string) {
        return this.page.evaluate((n) => {
            const list = window.editor.call('assets:list') as { get(path: string): unknown }[];
            const asset = list.find(a => a.get('name') === n);
            return asset ? Number(asset.get('id')) : null;
        }, name);
    }

    /** The file as the server has it, refetched whenever the asset hash changed. */
    fileContents(id: number) {
        return this.page.evaluate((i) => {
            return new Promise<string>((resolve, reject) => {
                const asset = window.editor.call('assets:get', i);
                window.editor.call('assets:contents:get', asset, (err: unknown, contents: string) => {
                    return err ? reject(new Error(String(err))) : resolve(contents);
                });
            });
        }, String(id));
    }

    /** Arms the load of a document and its monaco view; await the thunk after the click. */
    armDoc(id: number) {
        return this.shell.arm((docId: string) => {
            const ready = () => {
                return !!window.editor.call('documents:get', docId) &&
                    !window.editor.call('documents:isLoading', docId) &&
                    !!window.editor.call('views:get', docId);
            };
            if (ready()) {
                return { done: Promise.resolve() };
            }

            // the document lands on documents:load and its view on views:new, in that order
            return { done: new Promise<void>((resolve) => {
                const evts = ['documents:load', 'views:new'].map(name => window.editor.on(name, () => {
                    if (!ready()) {
                        return;
                    }
                    evts.forEach(e => e.unbind());
                    resolve();
                }));
            }) };
        }, String(id));
    }

    async waitForDoc(id: number) {
        await (await this.armDoc(id))();
    }

    async waitForParser() {
        await waitForParser(this.page);
    }

    /** Arms the next `event` off the editor, so the action that fires it cannot outrun the wait. */
    armEvent(event: string) {
        return this.shell.arm((name: string) => ({ done: new Promise<void>((resolve) => {
            const evt = window.editor.on(name, () => {
                evt.unbind();
                resolve();
            });
        }) }), event);
    }
}
