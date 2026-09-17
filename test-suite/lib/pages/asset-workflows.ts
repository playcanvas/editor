import type { Page } from '@playwright/test';

import { JOB_TIMEOUT } from '../constants';
import { waitForLaunch } from '../ready';
import { AssetsPanel } from './assets';
import { EditorShell } from './common';

export class AssetWorkflows {
    constructor(readonly page: Page) {}

    /** Imports through the actual file chooser and awaits the generated runtime assets. */
    async upload(file: { name: string; mimeType: string; buffer: Buffer }, types: string[]) {
        const shell = new EditorShell(this.page);
        const added = await shell.arm((wanted: string[]) => {
            const assets = window.editor.api.globals.assets;
            const before = new Set(assets.list().map((asset: any) => asset.get('id')));
            const events: any[] = [];
            return { done: new Promise<{ id: number; name: string; type: string }[]>((resolve, reject) => {
                const check = () => {
                    const failed = assets.findOne((asset: any) => !before.has(asset.get('id')) && asset.get('task') === 'failed');
                    if (failed) {
                        events.forEach(event => event.unbind());
                        reject(new Error(`Import failed: ${failed.get('name')}: ${failed.get('taskInfo') || 'pipeline task failed'}`));
                        return;
                    }
                    const found = wanted.map(type => assets.findOne((asset: any) => !before.has(asset.get('id')) && !asset.get('source') && asset.get('type') === type && !asset.get('task') && (type === 'render' || !!asset.get('file.size'))));
                    if (found.some(asset => !asset)) {
                        return;
                    }
                    events.forEach(event => event.unbind());
                    resolve(found.map((asset: any) => ({ id: Number(asset.get('id')), name: asset.get('name'), type: asset.get('type') })));
                };
                events.push(assets.on('add', (asset: any) => {
                    events.push(asset.on('*:set', check), asset.on('*:unset', check));
                    check();
                }));
            }),
            dispose: () => events.forEach(event => event.unbind()) };
        }, types, { what: `imported ${types.join(', ')} assets`, timeout: JOB_TIMEOUT });
        const chooser = this.page.waitForEvent('filechooser');
        await new AssetsPanel(this.page).newAsset('Upload');
        await (await chooser).setFiles(file);
        return added();
    }

    async launch() {
        const shell = new EditorShell(this.page);
        await shell.flushJobs();
        await shell.flushScene();
        const popup = this.page.waitForEvent('popup');
        await this.page.locator('.control-strip.top-right > .launch > .control-strip-btn').click();
        const page = await popup;
        await waitForLaunch(page);
        return page;
    }

    /** Reuploads the source and awaits the assigned container's new file revision. */
    async reimport(file: { name: string; mimeType: string; buffer: Buffer }, id: number) {
        const updated = await new EditorShell(this.page).arm((id: number) => {
            const asset = window.editor.api.globals.assets.get(id)!;
            const hash = asset.get('file.hash');
            return { done: new Promise<void>((resolve) => {
                const check = () => {
                    if (!asset.get('task') && asset.get('file.hash') && asset.get('file.hash') !== hash) {
                        events.forEach(event => event.unbind());
                        resolve();
                    }
                };
                const events = [asset.on('*:set', check), asset.on('*:unset', check)];
            }) };
        }, id, { what: 'reimported container revision', timeout: JOB_TIMEOUT });
        const chooser = this.page.waitForEvent('filechooser');
        await new AssetsPanel(this.page).newAsset('Upload');
        await (await chooser).setFiles(file);
        await updated();
    }
}
