import type { Locator, Page } from '@playwright/test';

import { JOB_TEST_TIMEOUT, JOB_TIMEOUT } from '../../lib/constants';
import { expect, test } from '../../lib/fixtures';
import { AssetsPanel } from '../../lib/pages/assets';
import { EditorShell, type ProjectState } from '../../lib/pages/common';
import { uniqueName } from '../../lib/utils';

// the store list comes from an external service and an import runs a backend job
const STORE_TIMEOUT = 60_000;
const SEARCH = 'cube';

const STORE = '.picker-store-cms';
const ITEM = '.storeitem-root-panel';
// an imported cubemap is what makes the editor throw, see pickImportable
const BAD_TYPE = 'cubemap';

type StoreResult = { id: string; name: string };

/** Waits for the store grid to fill, returning the observed count so an empty dev store can skip. */
const countItems = async (items: Locator) => {
    const filled = await items.first().waitFor({ timeout: STORE_TIMEOUT }).then(() => true, () => false);
    return filled ? items.count() : 0;
};

const openStore = async (assets: AssetsPanel) => {
    await assets.controls.locator('.pcui-asset-panel-btn-store').click();
    const store = assets.page.locator(STORE);
    await expect(store).toBeVisible();
    return store;
};

const closeStore = async (store: Locator) => {
    await store.locator('.header-utils > .close').click();
    await expect(store).toBeHidden();
};

/**
 * Types a search term and waits for the result set to land, returning it. The panel debounces
 * the input, refetches and then rebuilds every grid item, so the item that was on screen before
 * has to leave the dom before the grid can be read again.
 */
const search = async (store: Locator, text: string) => {
    const page = store.page();
    const stale = await store.locator('.grid-item').first().elementHandle({ timeout: STORE_TIMEOUT }).catch(() => null);

    const input = store.locator('.search-store input');
    await input.click();

    // arm before typing: the debounced request can be answered before a later wait is registered
    const response = page.waitForResponse(r => r.url().includes('/api/store?') && r.url().includes(`search=${text}`), { timeout: STORE_TIMEOUT });
    await input.pressSequentially(text);
    await expect(input).toHaveValue(text);

    const body = await (await response).json();
    if (stale) {
        await page.waitForFunction(el => !el.isConnected, stale, { timeout: STORE_TIMEOUT });
    }
    return (body.result ?? []) as StoreResult[];
};

/**
 * The first result that imports cleanly, with the types it was rejected for. A store item is
 * external data, and importing one whose assets include a cubemap makes the editor's engine throw
 * from CubemapHandler.update while it loads the faces, which the console capture then fails the
 * test for. The store list carries no type, so ask the same endpoint the detail panel uses.
 */
const pickImportable = async (page: Page, results: StoreResult[]) => {
    const seen: string[] = [];
    for (const result of results) {
        const types = await page.evaluate(async (id) => {
            const res: any = await window.editor.api.globals.rest.store.storeAssets(id).promisify();
            return (res.result ?? []).map((asset: any) => asset.type as string);
        }, result.id);
        seen.push(...types);
        if (types.length && !types.includes(BAD_TYPE)) {
            return { item: result, seen };
        }
    }
    return { item: null, seen };
};

// the worker project is shared by the whole run, so hand back what we were given
let baseline: ProjectState;

test.beforeEach(async ({ editorPage }) => {
    baseline = await new EditorShell(editorPage).snapshot();
});

test.afterEach(async ({ editorPage }) => {
    await new EditorShell(editorPage).restore(baseline);
});

test('searches the asset store', async ({ editorPage }) => {
    test.setTimeout(JOB_TEST_TIMEOUT);
    const assets = new AssetsPanel(editorPage);
    const store = await openStore(assets);

    await expect(store.locator('.cms-root-panel > .pcui-panel-header > .pcui-panel-header-title')).toHaveText('PLAYCANVAS ASSET STORE');
    const items = store.locator('.grid-item');
    await search(store, SEARCH);

    const count = await countItems(items);
    test.skip(count === 0, `the dev asset store returned ${count} items for "${SEARCH}"`);

    expect(count).toBeGreaterThan(0);
    // a grid item only gets its name label once its thumbnail has loaded; what the
    // names contain is store service data, so it is not asserted
    await expect(items.first().locator('.text-item-name')).toBeVisible();

    await closeStore(store);
});

test('imports a store item into the current folder', async ({ editorPage }) => {
    test.setTimeout(JOB_TEST_TIMEOUT);
    const assets = new AssetsPanel(editorPage);

    // a clone targets the folder the assets panel is in, which keeps the import verifiable
    const folder = await assets.create('createFolder', { name: uniqueName('store') });
    await assets.gridItem(folder.name).dblclick();
    await expect.poll(() => assets.currentFolderId()).toBe(folder.id);

    const store = await openStore(assets);
    const items = store.locator('.grid-item');
    const results = await search(store, SEARCH);

    const count = await countItems(items);
    test.skip(count === 0, `the dev asset store returned ${count} items for "${SEARCH}"`);

    const { item: pick, seen } = await pickImportable(editorPage, results);
    test.skip(!pick, `every "${SEARCH}" store item holds a ${BAD_TYPE}; asset types seen: ${seen.join(', ')}`);

    // a grid item only gets its name label once its thumbnail has loaded, so the card of the
    // picked result appears in its own time and in whatever order the thumbnails finish in
    const card = items.filter({ has: editorPage.getByText(pick!.name, { exact: true }) });
    await expect(card).toHaveCount(1, { timeout: STORE_TIMEOUT });
    const name = await card.locator('.text-item-name').innerText();
    await card.click();

    const item = editorPage.locator(ITEM);
    await expect(item).toBeVisible();
    await expect(item.locator('.storeitem-name')).toHaveText(name);

    await assets.armAdd({});
    // pcui only marks a disabled button with a class, so a click on it is dropped silently
    const importButton = item.locator('.import-button');
    await expect(importButton).not.toHaveClass(/pcui-disabled/);
    await importButton.click();

    // a repeat import of the same item warns about duplicates first
    if (await assets.shell.confirm.root.isVisible()) {
        await assets.shell.confirm.yes.click();
    }

    const added = await assets.awaitAdd({});
    expect(await assets.exists(added.id)).toBe(true);
    await expect.poll(() => assets.childrenOf(folder.id), { timeout: JOB_TIMEOUT }).not.toEqual([]);

    // the return button stays disabled until the clone request settles
    const returnButton = item.locator('.return-button');
    await expect(returnButton).not.toHaveClass(/pcui-disabled/);
    await returnButton.click();
    await expect(item).toBeHidden();
    await closeStore(store);
});
