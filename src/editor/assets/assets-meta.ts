import { WorkerClient } from '@/core/worker/worker-client';
import { config } from '@/editor/config';

// a stuck worker must not hold an upload; past this the server computes the meta
const TIMEOUT = 30000;

// a worker script that never runs (an empty or blocked response) never says ready
const READY_TIMEOUT = 15000;

const KINDS = ['texture', 'model', 'animation', 'gsplat'];

// texture-meta's fields; the server keeps compress.normals only where compression settings exist
const TEXTURE_KEYS = ['format', 'type', 'width', 'height', 'alpha', 'depth', 'srgb', 'interlaced'];

type Fillable = {
    get: (path: string) => any;
    set: (path: string, value: unknown) => void;
    history?: { enabled?: boolean };
};

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

    // Get Meta for a texture that has none: no conversion follows, so a plain op is enough. no meta
    // means no compression settings, so the normal-map flag is dropped as texture-meta does.
    // false means the caller sends the server's meta job as before
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

        // the server job's write is not an undoable user edit
        const history = asset.history;
        const enabled = history?.enabled;
        if (history) {
            history.enabled = false;
        }
        asset.set('meta', Object.fromEntries(TEXTURE_KEYS.map((key) => [key, meta[key]])));
        if (history) {
            history.enabled = enabled;
        }
        return true;
    });
});
