import { metaWrites } from '@/common/asset-meta/kind';
import { WorkerClient } from '@/core/worker/worker-client';
import { config } from '@/editor/config';

// a stuck worker must not hold an upload; past this the server computes the meta
const TIMEOUT = 30000;

// a worker script that never runs (an empty or blocked response) never says ready
const READY_TIMEOUT = 15000;

const KINDS = ['texture', 'model', 'animation', 'gsplat'];

type Fillable = {
    get: (path: string) => any;
    set: (path: string, value: unknown) => void;
    history?: { enabled?: boolean };
};

type Syncable = Fillable & { sync?: { enabled: boolean } };

editor.once('load', () => {
    const pending = new Map<number, (meta: object | null) => void>();
    let worker: Promise<WorkerClient | null> | null = null;
    let restart: (() => void) | null = null;
    let next = 0;

    const settle = (id: number, meta: object | null) => {
        const done = pending.get(id);
        pending.delete(id);
        done?.(meta);
    };

    // one long-lived worker; when it fails or stalls, what it holds falls back and the next call restarts it
    const start = () => {
        if (worker) {
            return worker;
        }
        const client = new WorkerClient(`${config.url.frontend}js/asset-meta.worker.js`);
        let timer: ReturnType<typeof setTimeout>;
        const booting = new Promise<WorkerClient | null>((resolve) => {
            const fail = () => {
                clearTimeout(timer);
                client.stop();
                if (worker === booting) {
                    worker = null;
                    [...pending.keys()].forEach((id) => settle(id, null));
                }
                resolve(null);
            };
            timer = setTimeout(fail, READY_TIMEOUT);
            restart = fail;
            client.once('ready', () => {
                clearTimeout(timer);
                resolve(client);
            });
            client.on('meta', settle);
            client.on('error', fail);
            client.start().catch(fail);
        });
        worker = booting;
        return booting;
    };

    const compute = (kind: string) => (file: Blob, name?: string) =>
        new Promise<object | null>((resolve) => {
            const id = ++next;
            const timer = setTimeout(() => restart?.(), TIMEOUT);
            pending.set(id, (meta) => {
                clearTimeout(timer);
                resolve(meta);
            });
            start().then((client) => (client ? client.send('meta', id, kind, file, name ?? '') : settle(id, null)));
        });

    KINDS.forEach((kind) => editor.method(`assets:meta:${kind}`, compute(kind)));

    // stores computed meta as ordinary ops, shaped like the server meta job's write. resolves false
    // when it could not be written (no write access, not loaded, or rejected), so the caller asks the
    // server for its meta instead
    editor.method('assets:meta:write', (asset: Syncable, meta: object) => {
        const doc = editor.api.globals.realtime.assets.get(asset.get('uniqueId'));
        if (!doc?.loaded || !editor.call('permissions:write')) {
            return Promise.resolve(false);
        }
        const writes = metaWrites(asset.get('type'), asset.get('meta'), meta);

        // submitted directly so each op's ack or rejection comes back, and before the observer sees the
        // meta, so edits its listeners make in response (default compression settings) go in their own op
        const acks = writes.map(
            ({ path, value }) =>
                new Promise<boolean>((resolve) => {
                    doc.submitOp({ p: path.split('.'), oi: structuredClone(value), od: null }, (err: unknown) => resolve(!err));
                })
        );
        return Promise.all(acks).then((ok) => {
            if (!ok.every(Boolean)) {
                return false;
            }

            // mirrored without echoing the ops, and the server job's write is not an undoable user edit
            const sync = asset.sync?.enabled;
            const history = asset.history?.enabled;
            if (asset.sync) {
                asset.sync.enabled = false;
            }
            if (asset.history) {
                asset.history.enabled = false;
            }
            writes.forEach(({ path, value }) => asset.set(path, value));
            if (asset.sync) {
                asset.sync.enabled = sync;
            }
            if (asset.history) {
                asset.history.enabled = history;
            }
            return true;
        });
    });

    // Get Meta for a texture that has none. false means the caller sends the server's meta job as before
    editor.method('assets:meta:fill', async (asset: Fillable) => {
        if (asset.get('meta') || !asset.get('file') || !['texture', 'textureatlas'].includes(asset.get('type'))) {
            return false;
        }
        const res = await fetch(`/api/assets/${asset.get('id')}/download?branchId=${config.self.branch.id}`).catch(
            () => null
        );
        if (!res?.ok) {
            return false;
        }
        const meta = await editor.call('assets:meta:texture', await res.blob(), asset.get('file.filename'));
        if (!meta || asset.get('meta')) {
            return false;
        }
        return editor.call('assets:meta:write', asset, meta);
    });
});
