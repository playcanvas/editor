import type { ArchivePlan } from './entries';

type Get = (url: string) => Promise<{ ok: boolean; status: number; arrayBuffer: () => Promise<ArrayBuffer> }>;

const enc = new TextEncoder();

// files go through /api/assets/:id/file, so read permissions are enforced per file by the server
export const loadFiles = (plan: ArchivePlan, get: Get = (url) => fetch(url)) =>
    Promise.all(
        plan.entries.map(async (e) => {
            if (!e.url) {
                return { path: e.path, data: enc.encode(JSON.stringify(e.json)) };
            }
            const res = await get(e.url);
            if (!res.ok) {
                throw new Error(`A file of asset ${e.id} could not be downloaded (${res.status})`);
            }
            return { path: e.path, data: new Uint8Array(await res.arrayBuffer()) };
        })
    );
