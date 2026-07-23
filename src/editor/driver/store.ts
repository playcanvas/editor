import { config } from '@/editor/config';

import { driver } from './driver';
import { api, log, writeError } from './shared';

type License =
    string | { author: string; authorUrl: string; license: string } | { id: string; author: string; authorUrl: string };

const clone = (store: string, id: string, name: string, license: License, folder?: number) =>
    api.rest.store
        .storeClone(id, {
            scope: {
                type: 'project',
                id: String(config.project.id)
            },
            name,
            store,
            targetFolderId: folder === undefined ? null : String(folder),
            license
        })
        .promisify();

// store - playcanvas
driver.method('store:playcanvas:list', async (options: any = {}) => {
    const data = await api.rest.store.storeList({ ...options, regex: true, excludeTags: 'INTERNAL' }).promisify();
    log(`Searched store: ${JSON.stringify(options)}`);
    return { data };
});
driver.method('store:playcanvas:get', async (id) => {
    const data = await api.rest.store.storeGet(Number(id)).promisify();
    log(`Got store item(${id})`);
    return { data };
});
driver.method('store:playcanvas:clone', async (id, name, license, folder) => {
    const denied = writeError('download store assets');
    if (denied) {
        return denied;
    }
    const data = await clone('playcanvas', id, name, license, folder);
    log(`Cloned store item(${id})`);
    return { data };
});

// store - sketchfab
driver.method('store:sketchfab:list', async (options: any = {}) => {
    const params = new URLSearchParams({ restricted: '0', type: 'models', downloadable: 'true' });
    if (options.search) {
        params.set('q', options.search);
    }
    if (options.order) {
        params.set('sort_by', options.order);
    }
    if (options.skip) {
        params.set('cursor', options.skip);
    }
    if (options.limit) {
        params.set('count', String(Math.min(options.limit, 24)));
    }

    const res = await fetch(`https://api.sketchfab.com/v3/search?${params}`);
    if (!res.ok) {
        throw new Error(`Sketchfab search failed: ${res.status} ${res.statusText}.`);
    }
    const data = await res.json();
    log(`Searched Sketchfab: ${JSON.stringify(options)}`);
    return { data };
});
driver.method('store:sketchfab:get', async (uid) => {
    const res = await fetch(`https://api.sketchfab.com/v3/models/${encodeURIComponent(uid)}`);
    if (!res.ok) {
        throw new Error(`Sketchfab model request failed: ${res.status} ${res.statusText}.`);
    }
    const data = await res.json();
    log(`Got Sketchfab model(${uid})`);
    return { data };
});
driver.method('store:sketchfab:clone', async (uid, name, license, folder) => {
    const denied = writeError('download store assets');
    if (denied) {
        return denied;
    }
    const data = await clone('sketchfab', uid, name, license, folder);
    log(`Cloned sketchfab item(${uid})`);
    return { data };
});

driver.method('store:myassets:list', async (options: any = {}) => {
    const data = await api.rest.assets
        .assetsList({
            search: options.search,
            regex: !!options.search,
            sort: options.sort,
            order: options.order,
            skip: options.skip,
            limit: options.limit,
            tags: options.tags
        })
        .promisify();
    return { data };
});

driver.method('store:myassets:clone', async (id, _name, folder) => {
    const denied = writeError('download My Assets');
    if (denied) {
        return denied;
    }
    const data = await api.rest.assets
        .assetClone(String(id), {
            scope: {
                type: 'project',
                id: Number(config.project.id)
            },
            targetFolderId: folder ?? null
        })
        .promisify();
    return { data };
});

driver.method('store:licenses:list', async () => {
    const data = await api.rest.store.storeLicenses().promisify();
    return { data: (data as any).result || data };
});
