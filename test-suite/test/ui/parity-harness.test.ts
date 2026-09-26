import { readFileSync } from 'node:fs';

import { JOB_TEST_TIMEOUT, JOB_TIMEOUT } from '../../lib/constants';
import { expect, test } from '../../lib/fixtures';
import { AssetsPanel } from '../../lib/pages/assets';
import { EditorShell, type ProjectState } from '../../lib/pages/common';
import { fetchFile, imageDiff, normalizeAsset, parity, PARITY_TIMEOUT, spyServerWork, type ServerSpy } from '../../lib/parity';
import { waitForEditor } from '../../lib/ready';
import { uniqueName } from '../../lib/utils';
import { texture } from '../fixtures/assets';

const PNG = readFileSync(new URL('../fixtures/files/test.png', import.meta.url));

const upload = async (assets: AssetsPanel) => {
    const name = `${uniqueName('parity')}.png`;
    await assets.armAdd({ name });
    await assets.upload({ name, mimeType: 'image/png', buffer: PNG });
    const { id } = await assets.awaitAdd({ name });
    await assets.waitForTask(id, JOB_TIMEOUT);
    return id;
};

test.describe('parity harness', () => {
    let baseline: ProjectState;
    let spies: ServerSpy[];

    test.beforeEach(async ({ editorPage }) => {
        baseline = await new EditorShell(editorPage).snapshot();
        spies = [];
    });

    test.afterEach(async ({ editorPage }) => {
        await Promise.all(spies.map(spy => spy.stop())).finally(() => new EditorShell(editorPage).restore(baseline));
    });

    test('records an upload and the pipeline follow-up', async ({ editorPage }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);
        const spy = await spyServerWork(editorPage);
        spies.push(spy);
        const id = await upload(new AssetsPanel(editorPage));
        await editorPage.evaluate(id => window.editor.api.globals.assets.get(id)!.set('data.rgbm', true), id);
        await expect.poll(() => spy.pipeline()).toContainEqual({ name: 'thumbnails', data: { name: 'thumbnails', data: { target: id } } });
        await spy.stop();
        const uploads = await spy.uploads();
        expect(uploads).toHaveLength(1);
        expect(uploads[0]).toMatchObject({ method: 'POST', fields: { type: 'texture' } });
        expect(uploads[0].url).toMatch(/\/assets$/);
        expect((await spy.requests()).some(r => r.method === 'POST' && r.url === uploads[0].url)).toBe(true);
    });

    test('records realtime commands and nothing after stop', async ({ editorPage }) => {
        const assets = new AssetsPanel(editorPage);
        const first = await assets.create('createFolder', { name: uniqueName('parity') });
        const second = await assets.create('createFolder', { name: uniqueName('parity') });
        const spy = await spyServerWork(editorPage);
        const overlap = await spyServerWork(editorPage);
        spies.push(spy, overlap);
        await editorPage.evaluate(id => window.editor.call('assets:fs:delete', [window.editor.api.globals.assets.get(id)]), first.id);
        await assets.waitForRemove(first.id);
        await spy.stop();
        await editorPage.evaluate(id => window.editor.call('assets:fs:delete', [window.editor.api.globals.assets.get(id)]), second.id);
        await assets.waitForRemove(second.id);
        await overlap.stop();
        expect(await spy.frames()).toEqual(['fs']);
        expect(await overlap.frames()).toEqual(['fs', 'fs']);
        expect(await spy.pipeline()).toEqual([]);
        expect(await editorPage.evaluate(() => (window as any).__parity.size)).toBe(0);
    });

    test('fetchFile returns the stored bytes', async ({ editorPage }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);
        const id = await upload(new AssetsPanel(editorPage));
        expect((await fetchFile(editorPage, id)).equals(new Uint8Array(PNG))).toBe(true);
    });

    test('imageDiff decodes the fixtures to their pixels', async ({ editorPage }) => {
        const png = texture({ width: 6, height: 4, alpha: false, format: 'png' });
        const bmp = texture({ width: 6, height: 4, alpha: false, format: 'bmp' });
        expect(await imageDiff(editorPage, png, bmp)).toEqual({
            a: { width: 6, height: 4, alpha: false, mime: 'image/png' },
            b: { width: 6, height: 4, alpha: false, mime: 'image/bmp' },
            mad: 0,
            max: 0
        });

        const translucent = await imageDiff(editorPage, texture({ width: 6, height: 4, alpha: true, format: 'png' }), png);
        expect(translucent.a.alpha).toBe(true);
        expect(translucent.max).toBeGreaterThan(0);

        expect(await imageDiff(editorPage, texture({ width: 6, height: 4, alpha: true, format: 'png' }), texture({ width: 6, height: 4, alpha: true, format: 'bmp' }))).toEqual({
            a: { width: 6, height: 4, alpha: true, mime: 'image/png' },
            b: { width: 6, height: 4, alpha: true, mime: 'image/bmp' },
            mad: 0,
            max: 0
        });

        // jpeg only loses the ycbcr round trip
        const jpeg = await imageDiff(editorPage, texture({ width: 20, height: 9, alpha: false, format: 'jpeg' }), texture({ width: 20, height: 9, alpha: false, format: 'png', blocks: true }));
        expect(jpeg.a).toEqual({ width: 20, height: 9, alpha: false, mime: 'image/jpeg' });
        expect(jpeg.max).toBeLessThanOrEqual(3);

        const resized = await imageDiff(editorPage, png, texture({ width: 8, height: 4, alpha: false, format: 'png' }));
        expect(resized.mad).toBe(Infinity);
        expect(resized.max).toBe(Infinity);
    });

    test('isolates the two runs', async ({ editorPage }) => {
        test.setTimeout(PARITY_TIMEOUT);
        const assets = new AssetsPanel(editorPage);
        const seen: string[] = [];
        const run = async (mode: string) => {
            expect(await assets.shell.snapshot()).toEqual(baseline);
            seen.push(mode);
            const folder = await assets.create('createFolder', { name: uniqueName('parity') });
            return normalizeAsset(await editorPage.evaluate(id => window.editor.api.globals.assets.get(id)!.json(), folder.id));
        };
        const { server, client } = await parity({
            server: { page: editorPage, run: () => run('server') },
            client: { page: editorPage, run: () => run('client') }
        });
        expect(seen).toEqual(['server', 'client']);
        expect(server.name).toBe('<parity>');
        expect(client).toEqual(server);
        expect(await assets.shell.snapshot()).toEqual(baseline);
    });

    test('fails when the client result differs', async ({ editorPage }) => {
        await expect(parity({
            server: { page: editorPage, run: () => Promise.resolve({ mode: 'server' }) },
            client: { page: editorPage, run: () => Promise.resolve({ mode: 'client' }) }
        })).rejects.toThrow(/client result differs from the server's/);
    });

    test('uses each run\'s page for snapshots, spies and cleanup', async ({ editorPage }) => {
        test.setTimeout(PARITY_TIMEOUT);
        const page = await editorPage.context().newPage();
        await page.goto(editorPage.url());
        await waitForEditor(page);
        const run = async (current: typeof page, other: typeof page, spy: ServerSpy) => {
            expect(await current.evaluate(() => (window as any).__parity.size)).toBe(1);
            expect(await other.evaluate(() => (window as any).__parity?.size ?? 0)).toBe(0);
            const assets = new AssetsPanel(current);
            const folder = await assets.create('createFolder', { name: uniqueName('parity') });
            expect((await spy.requests()).length).toBeGreaterThan(0);
            return normalizeAsset(await current.evaluate(id => window.editor.api.globals.assets.get(id)!.json(), folder.id));
        };
        await parity({
            server: { page: editorPage, run: spy => run(editorPage, page, spy) },
            client: { page, run: spy => run(page, editorPage, spy) }
        }).then(async () => {
            expect(await new EditorShell(page).snapshot()).toEqual(baseline);
            expect(await page.evaluate(() => (window as any).__parity.size)).toBe(0);
        }).finally(() => page.close());
        expect(await new EditorShell(editorPage).snapshot()).toEqual(baseline);
    });

    test('restores the page and removes listeners after spy setup fails', async ({ editorPage }) => {
        const failure = new Error('spy setup failed');
        const context = editorPage.context() as any;
        const listeners = [context.listenerCount('request'), context.listenerCount('page')];
        let calls = 0;
        let ran = false;
        const page = new Proxy(editorPage, {
            get(target, key) {
                if (key === 'evaluate') {
                    return (...args: any[]) => {
                        if (++calls === 3) {
                            return Promise.reject(failure);
                        }
                        return (target.evaluate as any)(...args);
                    };
                }
                const value = Reflect.get(target, key);
                return typeof value === 'function' ? value.bind(target) : value;
            }
        });
        const run = () => {
            ran = true;
            return Promise.resolve({});
        };
        await expect(parity({
            server: { page, run },
            client: { page: editorPage, run }
        })).rejects.toBe(failure);
        expect(ran).toBe(false);
        expect(calls).toBeGreaterThan(3);
        expect([context.listenerCount('request'), context.listenerCount('page')]).toEqual(listeners);
        expect(await new EditorShell(editorPage).snapshot()).toEqual(baseline);
    });

    test('preserves the scenario error when project cleanup also fails', async ({ editorPage }) => {
        const failure = new Error('scenario failed');
        const cleanup = new Error('project cleanup failed');
        const restore = EditorShell.prototype.restore;
        EditorShell.prototype.restore = async function (state) {
            await restore.call(this, state);
            throw cleanup;
        };
        const run = () => {
            throw failure;
        };
        await expect(parity({
            server: { page: editorPage, run },
            client: { page: editorPage, run }
        })).rejects.toMatchObject({ errors: [failure, cleanup] }).finally(() => {
            EditorShell.prototype.restore = restore;
        });
        expect(await new EditorShell(editorPage).snapshot()).toEqual(baseline);
        expect(await editorPage.evaluate(() => (window as any).__parity.size)).toBe(0);
    });

    test('preserves the scenario error when spy cleanup also fails', async ({ editorPage }) => {
        const failure = new Error('scenario failed');
        const cleanup = new Error('spy cleanup failed');
        const run = (spy: ServerSpy) => {
            spies.push(spy);
            const stop = spy.stop;
            spy.stop = async () => {
                await stop();
                spy.stop = stop;
                throw cleanup;
            };
            throw failure;
        };
        await expect(parity({
            server: { page: editorPage, run },
            client: { page: editorPage, run }
        })).rejects.toMatchObject({ errors: [failure, cleanup] });
        expect(await new EditorShell(editorPage).snapshot()).toEqual(baseline);
        expect(await editorPage.evaluate(() => (window as any).__parity.size)).toBe(0);
    });

    for (const mode of ['server', 'client'] as const) {
        test(`restores project and spy after a thrown ${mode} scenario`, async ({ editorPage }) => {
            test.setTimeout(PARITY_TIMEOUT);
            const assets = new AssetsPanel(editorPage);
            const failure = new Error('scenario failed after creating a folder');
            const seen: string[] = [];
            const run = async (current: string, spy: ServerSpy) => {
                spies.push(spy);
                seen.push(current);
                await assets.create('createFolder', { name: uniqueName('parity') });
                if (current === mode) {
                    throw failure;
                }
                return {};
            };
            await expect(parity({
                server: { page: editorPage, run: spy => run('server', spy) },
                client: { page: editorPage, run: spy => run('client', spy) }
            })).rejects.toBe(failure);
            expect(seen).toEqual(mode === 'server' ? ['server'] : ['server', 'client']);
            expect(await assets.shell.snapshot()).toEqual(baseline);
            expect(await editorPage.evaluate(() => (window as any).__parity.size)).toBe(0);
            const requests = await Promise.all(spies.map(spy => spy.requests()));
            await assets.create('createFolder', { name: uniqueName('after-parity') });
            expect(await Promise.all(spies.map(spy => spy.requests()))).toEqual(requests);
        });
    }
});
