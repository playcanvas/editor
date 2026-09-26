// client-side texture import: the worker does pipeline.texture.convert's work and the result is
// uploaded with noConvert and noThumbnails, and with plan 02's meta (noMeta) where the editor can
// compute it. the editor makes the thumbnails (plan 03, assets:thumbnails:texture)

import type { Observer } from '@playcanvas/observer';

import { WorkerClient } from '@/core/worker/worker-client';
import { compressJob, importTexture, isTarget, keepsFilename, queue } from '@/editor/assets/texture-import';
import type { ImportDeps } from '@/editor/assets/texture-import';
import { config } from '@/editor/config';

// how long to wait for an uploaded asset (and its new file and meta) to arrive over realtime
const ASSET_ADD_TIMEOUT = 30000;

// a worker script that never runs (an empty or blocked response) never says ready
const READY_TIMEOUT = 15000;

const STARTUP_FAILED = 'the texture converter could not be loaded';

// a 4k resize holds ~0.7gb of float buffers, so a bulk drop converts a couple of files at a time
const MAX_WORKERS = 2;

editor.once('load', () => {
    const settings = editor.call('settings:projectUser');
    let jobs = 0;
    const pool = queue(MAX_WORKERS);

    // one worker per request; msg is 'import' (Converted) or 'meta' (TextureMeta | null)
    const spawn = (msg: string, buffer: ArrayBuffer, rest: unknown[]) =>
        new Promise<any>((resolve, reject) => {
            const client = new WorkerClient(`${config.url.frontend}js/texture-convert.worker.js`);
            const job = `texture-convert:${++jobs}`;
            editor.call('status:job', job, 0);
            let settled = false;
            const settle = (err: string | null, res?: unknown) => {
                if (settled) {
                    return;
                }
                settled = true;
                clearTimeout(timer);
                client.stop();
                editor.call('status:job', job);
                return err ? reject(new Error(err)) : resolve(res);
            };
            let ready = false;
            const timer = setTimeout(() => settle(STARTUP_FAILED), READY_TIMEOUT);
            client.once('error', (err) => settle(err ?? (ready ? 'texture conversion failed' : STARTUP_FAILED)));
            client.once('ready', () => {
                ready = true;
                clearTimeout(timer);
                client.once(msg, (res) => settle(null, res));
                client.with([buffer]).send(msg, config.url.frontend, buffer, ...rest);
            });
            client.start().catch((err) => settle(`${STARTUP_FAILED} (${err?.message ?? err})`));
        });
    const run = (msg: string, buffer: ArrayBuffer, ...rest: unknown[]) => pool(() => spawn(msg, buffer, rest));

    // resolves once `ok` holds for the asset, re-checked on every change
    const until = (asset: Observer, ok: () => boolean, what: string) =>
        new Promise<void>((resolve, reject) => {
            if (ok()) {
                resolve();
                return;
            }
            const timer = setTimeout(() => {
                evt.unbind();
                reject(new Error(`asset ${asset.get('id')} never received ${what}`));
            }, ASSET_ADD_TIMEOUT);
            const evt = asset.on('*:set', () => {
                if (ok()) {
                    clearTimeout(timer);
                    evt.unbind();
                    resolve();
                }
            });
        });

    const deps: ImportDeps = {
        sourceMeta: async (file) => run('meta', await file.arrayBuffer(), file.name),
        meta: (file, name) => editor.call('assets:meta:texture', file, name),
        thumbnails: (asset, source, rgbm) => editor.call('assets:thumbnails:texture', asset, source, rgbm),
        convert: (buffer, meta, options) => run('import', buffer, meta, options),
        upload: (args) =>
            new Promise((resolve, reject) => {
                editor.call('assets:uploadFile', args, (err: string | null, res?: { id: number }) =>
                    err ? reject(new Error(err)) : resolve(res.id)
                );
            }),
        observer: (id) =>
            new Promise((resolve, reject) => {
                const asset = editor.call('assets:get', id);
                if (asset) {
                    resolve(asset);
                    return;
                }
                const timer = setTimeout(() => {
                    evt.unbind();
                    reject(new Error(`asset ${id} was created but never arrived`));
                }, ASSET_ADD_TIMEOUT);
                const evt = editor.once(`assets:add[${id}]`, (a: Observer) => {
                    clearTimeout(timer);
                    resolve(a);
                });
            }),
        settle: (asset: Observer, size, dims) =>
            until(
                asset,
                () =>
                    asset.get('file.size') === size &&
                    asset.get('meta.width') === dims.width &&
                    asset.get('meta.height') === dims.height,
                'its converted file'
            ),
        findTarget: (src, name, related) => {
            const hit = editor.call('assets:find', (a: Observer) => isTarget(a, src, name, related))[0];
            return hit ? hit[1] : null;
        },
        get: (id) => editor.call('assets:get', id),

        // sent the way the compress button sends its own
        compress: (asset: Observer, source, size) =>
            editor.call('realtime:send', 'pipeline', {
                name: 'compress',
                data: compressJob(asset, editor.call('assets:get', source), size)
            })
    };

    const preload = () => settings.get('editor.pipeline.defaultAssetPreload');

    // resolves false when the server pipeline should run instead; format, size and worker failures are
    // importTexture's own fallbacks, so write permission is the only gate here
    editor.method('textures:import', (args) => {
        if (!editor.call('permissions:write')) {
            return Promise.resolve(false);
        }
        const opts = editor.call('assets:pipeline:options');
        return importTexture(deps, {
            ...args,
            pow2: !!opts.pow2,
            related: !!opts.searchRelatedAssets,
            preload: preload()
        }).catch((err) => {
            editor.call('status:error', `Texture import failed: ${err.message}`);
            return true;
        });
    });

    // the server re-derives a target from its source (or an in-place texture from itself); a source of
    // another type (a scene's embedded texture, a font's atlas) makes it in place
    editor.method('textures:reimport', async (id: number, overrides = {}) => {
        const asset = editor.call('assets:get', id);
        if (!editor.call('permissions:write') || !asset) {
            return false;
        }
        const linked = asset.get('source_asset_id') && editor.call('assets:get', asset.get('source_asset_id'));
        const source = linked && linked.get('type') === asset.get('type') ? linked : asset;
        if (!source.get('file') || (!asset.get('source') && !keepsFilename(asset))) {
            return false;
        }
        const res = await fetch(`/api/assets/${source.get('id')}/download?branchId=${config.self.branch.id}`).catch(
            () => null
        );
        if (!res?.ok) {
            return false;
        }

        // named like the stored file, which the server reads the format and the target name from
        const file = new File([await res.blob()], source.get('file.filename') ?? source.get('name'));
        const opts = editor.call('assets:pipeline:options', overrides);
        return importTexture(deps, {
            file,
            type: source.get('type'),
            parent: null,
            existing: source,
            target: source === asset ? null : asset,
            skipSource: true,
            pow2: !!opts.pow2,
            related: !!opts.searchRelatedAssets,
            preload: preload()
        });
    });
});
