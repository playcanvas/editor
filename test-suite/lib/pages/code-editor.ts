import type { Locator, Page } from '@playwright/test';

import { EditorShell } from './common';

const ROW = '.pcui-treeview-item';
const CONTENTS = `${ROW}-contents`;
const TEXT = `${ROW}-text`;
const FIND_IN_FILES = 'Find in Files';
// pcui puts the placeholder on the field wrapper, not on the native input
const QUERY_FIELD = '[placeholder="Find in files"]';

const escape = (text: string) => text.replace(/["\\]/g, '\\$&');
const exact = (text: string) => new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);

export class CodeEditor {
    readonly shell: EditorShell;

    readonly tree: Locator;

    readonly tabs: Locator;

    readonly monaco: Locator;

    readonly status: Locator;

    readonly search: Locator;

    readonly searchInput: Locator;

    readonly renameInput: Locator;

    readonly renameError: Locator;

    readonly createInput: Locator;

    readonly prefs: Locator;

    constructor(readonly page: Page) {
        this.shell = new EditorShell(page);
        this.tree = page.locator('#ui-left');
        this.tabs = page.locator('#ui-tabs');
        this.monaco = page.locator('#ui-code .monaco-editor textarea.inputarea');
        this.status = page.locator('#ui-bottom .status');

        // the include/exclude row reuses the picker-search class, so pin the panel that owns the query field
        this.search = page.locator(`.picker-search:has(${QUERY_FIELD})`);
        this.searchInput = this.search.locator(`${QUERY_FIELD} input`);
        this.renameInput = this.tree.locator('.files-rename-input input');
        this.renameError = page.locator('.files-rename-error-popup');
        this.createInput = page.locator('.picker-script-create input');
        this.prefs = page.locator('#ui-right');
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

    get resultsTab() {
        return this.tab(FIND_IN_FILES);
    }

    /** Clicks the tree item and waits for the document and its monaco view to be ready. */
    async open(name: string, id: number) {
        await this.treeContents(name).click();
        await this.waitForDoc(id);
    }

    /** Double-click pins the temporary tab so the next selection opens its own tab. */
    async pin(name: string) {
        await this.treeContents(name).dblclick();
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
        await this.monaco.focus();
        await this.page.keyboard.press('ControlOrMeta+S');
        await this.page.waitForFunction(i => !window.editor.call('documents:isDirty', i), id);
    }

    content() {
        return this.page.evaluate(() => (window.editor.call('editor:monaco') as any).getValue() as string);
    }

    /** A monaco constructor option, e.g. `fontSize`. */
    option(name: string) {
        return this.page.evaluate(n => (window.editor.call('editor:monaco') as any).getRawOptions()[n], name);
    }

    cursorLine() {
        return this.page.evaluate(() => (window.editor.call('editor:monaco') as any).getPosition().lineNumber as number);
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

    setting(path: string) {
        return this.page.evaluate(p => (window.editor.call('editor:settings') as any).get(p), path);
    }

    setSetting(path: string, value: unknown) {
        return this.page.evaluate(([p, v]) => {
            (window.editor.call('editor:settings') as any).set(p, v);
        }, [path, value] as [string, unknown]);
    }

    async waitForDoc(id: number) {
        await this.page.waitForFunction((i) => {
            return !!window.editor.call('documents:get', i) &&
                !window.editor.call('documents:isLoading', i) &&
                !!window.editor.call('views:get', i);
        }, String(id));
    }

    // the esm parse step of a new script is registered only once the script worker has booted, and
    // a call to a missing method is dropped silently, so creating before then never opens a tab
    async waitForParser() {
        await this.page.waitForFunction(() => {
            return (window.editor as any).methods.has('scripts:handleParse') as boolean;
        });
    }

    /** Sets a page flag when `event` next fires, so a later wait cannot miss it. */
    async arm(event: string) {
        await this.page.evaluate((e) => {
            const w = window as any;
            w.e2eArmed?.unbind();
            w.e2eFired = false;
            w.e2eArmed = window.editor.on(e, () => {
                w.e2eFired = true;
            });
        }, event);
    }

    async waitArmed() {
        await this.page.waitForFunction(() => (window as any).e2eFired === true);
    }

    /** Opens Find in Files from monaco, runs `query` and waits for the search to finish. */
    async findInFiles(query: string) {
        await this.monaco.focus();
        await this.page.keyboard.press('ControlOrMeta+Shift+F');
        await this.searchInput.waitFor();
        await this.arm('editor:search:files:end');
        await this.searchInput.pressSequentially(query);
        await this.searchInput.press('Enter');
        await this.waitArmed();
    }

    /** Double-clicks the results line holding `text`, which jumps to the match. */
    async jumpToResult(text: string) {
        await this.page.locator('#ui-code .view-line', { hasText: text }).first().dblclick({ position: { x: 4, y: 4 } });
    }
}
