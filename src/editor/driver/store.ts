import { config } from '@/editor/config';

import { driver } from './driver';
import { log, rest, writeError } from './shared';

// store - playcanvas
driver.method('store:playcanvas:list', async (options: any = {}) => {
    const params = [];
    if (options.search) {
        params.push(`search=${options.search}`);
    }
    params.push('regexp=true');
    if (options.order) {
        params.push(`order=${options.order}`);
    }
    if (options.skip) {
        params.push(`skip=${options.skip}`);
    }
    if (options.limit) {
        params.push(`limit=${options.limit}`);
    }

    try {
        const data = await rest('GET', `store?${params.join('&')}`);
        if (data.error) {
            return { error: data.error };
        }
        log(`Searched store: ${JSON.stringify(options)}`);
        return { data };
    } catch (e: any) {
        return { error: e.message };
    }
});
driver.method('store:playcanvas:get', async (id) => {
    try {
        const data = await rest('GET', `store/${id}`);
        if (data.error) {
            return { error: data.error };
        }
        log(`Got store item(${id})`);
        return { data };
    } catch (e: any) {
        return { error: e.message };
    }
});
driver.method('store:playcanvas:clone', async (id, name, license) => {
    const denied = writeError('download store assets');
    if (denied) {
        return denied;
    }
    try {
        const data = await rest('POST', `store/${id}/clone`, {
            scope: {
                type: 'project',
                id: config.project.id
            },
            name,
            store: 'playcanvas',
            targetFolderId: null,
            license
        });
        if (data.error) {
            return { error: data.error };
        }
        log(`Cloned store item(${id})`);
        return { data };
    } catch (e: any) {
        return { error: e.message };
    }
});

// store - sketchfab
driver.method('store:sketchfab:list', async (options: any = {}) => {
    const params = ['restricted=0', 'type=models', 'downloadable=true'];
    if (options.search) {
        params.push(`q=${options.search}`);
    }
    if (options.order) {
        params.push(`sort_by=${options.order}`);
    }
    if (options.skip) {
        params.push(`cursor=${options.skip}`);
    }
    if (options.limit) {
        params.push(`count=${Math.min(options.limit ?? 0, 24)}`);
    }

    try {
        const res = await fetch(`https://api.sketchfab.com/v3/search?${params.join('&')}`);
        const data = await res.json();
        if (data.error) {
            return { error: data.error };
        }
        log(`Searched Sketchfab: ${JSON.stringify(options)}`);
        return { data };
    } catch (e: any) {
        return { error: e.message };
    }
});
driver.method('store:sketchfab:get', async (uid) => {
    try {
        const res = await fetch(`https://api.sketchfab.com/v3/models/${uid}`);
        const data = await res.json();
        if (data.error) {
            return { error: data.error };
        }
        log(`Got Sketchfab model(${uid})`);
        return { data };
    } catch (e: any) {
        return { error: e.message };
    }
});
driver.method('store:sketchfab:clone', async (uid, name, license) => {
    const denied = writeError('download store assets');
    if (denied) {
        return denied;
    }
    try {
        const data = await rest('POST', `store/${uid}/clone`, {
            scope: {
                type: 'project',
                id: config.project.id
            },
            name,
            store: 'sketchfab',
            targetFolderId: null,
            license
        });
        if (data.error) {
            return { error: data.error };
        }
        log(`Cloned sketchfab item(${uid})`);
        return { data };
    } catch (e: any) {
        return { error: e.message };
    }
});
