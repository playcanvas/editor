import type { Locator, Page } from '@playwright/test';

import { JOB_TIMEOUT } from '../constants';
import { AssetsPanel } from './assets';
import { EditorShell } from './common';
import { HierarchyPanel } from './hierarchy';

const ROOT = '.template-entity-inspector';
const BUTTONS = `${ROOT}-container-middle`;
const PICKER = '.picker-asset';

/** The TEMPLATE INSTANCE block of the entity inspector, plus the two hierarchy menu actions. */
export class Templates {
    readonly root: Locator;

    readonly header: Locator;

    readonly assetName: Locator;

    readonly overrides: Locator;

    private shell: EditorShell;

    private hierarchy: HierarchyPanel;

    private assets: AssetsPanel;

    constructor(readonly page: Page) {
        this.shell = new EditorShell(page);
        this.hierarchy = new HierarchyPanel(page);
        this.assets = new AssetsPanel(page);
        this.root = page.locator(ROOT);
        this.header = page.locator(`${ROOT}-header`);
        this.assetName = page.locator(`${ROOT}-root`);
        this.overrides = page.locator(`${ROOT}-overrides`);
    }

    /** VIEW DIFF, REVERT ALL or APPLY ALL; the three carry no class of their own. */
    button(text: string) {
        return this.page.locator(`${BUTTONS} > button.pcui-button`).filter({ hasText: text });
    }

    // the Template entry is a submenu, so it has to be hovered before its leaf exists
    private async openMenu(entityName: string, item: string) {
        await this.hierarchy.openContextMenu(entityName);
        await this.shell.menuItem('Template').first().hover();
        await this.shell.menuItem(item).first().click();
    }

    unlink(entityName: string) {
        return this.openMenu(entityName, 'Unlink From Template');
    }

    /**
     * Templates an entity from the hierarchy context menu. New Template needs the entity to be
     * the only selection, and it names the asset after the entity.
     */
    async create(entityName: string) {
        await this.hierarchy.select(entityName);
        const [id] = (await this.hierarchy.selection()).ids;
        await this.assets.armAdd({ name: entityName, type: 'template' });
        await this.openMenu(entityName, 'New Template');
        const asset = await this.assets.awaitAdd({ name: entityName, type: 'template' });
        await (await this.hierarchy.armField(id, 'template_id', asset.id))();
        return asset;
    }

    /**
     * Adds an instance under `parentName`. Add Instance opens the asset picker, which reuses the
     * assets panel grid, and the instantiation itself runs as a backend pipeline job.
     */
    async addInstance(parentName: string, assetName: string) {
        await this.hierarchy.select(parentName);
        const [id] = (await this.hierarchy.selection()).ids;
        const added = await this.shell.arm((parent: string) => {
            const entity = window.editor.api.globals.entities.get(parent);
            if (!entity) {
                throw new Error(`template parent ${parent} is missing`);
            }
            const before = [...entity.get('children')] as string[];
            return { done: new Promise<string>((resolve) => {
                const check = () => {
                    const child = (entity.get('children') as string[]).find(id => !before.includes(id));
                    if (child) {
                        evts.forEach(e => e.unbind());
                        resolve(child);
                    }
                };
                const evts = ['children:insert', 'children:set'].map(event => entity.on(event, check));
            }) };
        }, id, { what: 'the template instance to be added', timeout: JOB_TIMEOUT });
        await this.openMenu(parentName, 'Add Instance');

        const picker = this.page.locator(PICKER);
        await picker.waitFor();
        await this.assets.gridItem(assetName).click();
        await picker.waitFor({ state: 'hidden' });
        return added();
    }
}
