import { config } from '@/editor/config';

import { driver } from './driver';
import { api, log, iterateObject, writeError } from './shared';

const LOAD_TIMEOUT = 50_000;

const scenes = () =>
    new Promise<unknown[]>((resolve) => {
        editor.call(
            'scenes:list',
            (result: unknown) => resolve([null, result]),
            (error: unknown) => resolve([error])
        );
    });

// scene settings
driver.method('scene:settings:modify', (settings) => {
    const denied = writeError('modify scene settings');
    if (denied) {
        return denied;
    }
    const scene = api.settings.scene;
    iterateObject(settings, (path, value) => {
        scene.set(path, value);
    });
    log('Modified scene settings');

    // return the resulting settings snapshot inline
    return { data: scene.json() };
});
driver.method('scene:settings:query', () => {
    const scene = api.settings.scene;
    log('Queried scene settings');
    return { data: scene.json() };
});

// scene management
driver.method('scenes:list', async () => {
    const [err, data] = await scenes();
    if (err) {
        return { error: String(err) };
    }
    log('Listed scenes');
    return { data };
});
driver.method('scenes:get', async (id) => {
    const [err, data] = await new Promise<unknown[]>((resolve) => {
        editor.call('scenes:get', String(id), (e: unknown, d: unknown) => resolve([e, d]));
    });
    if (err) {
        return { error: `Scene not found: ${id}. Call list_scenes to obtain a valid scene id.` };
    }
    log(`Got scene(${id})`);
    return { data };
});
driver.method('scenes:new', async (name) => {
    const denied = writeError('create scenes');
    if (denied) {
        return denied;
    }
    const [err, data] = await new Promise<unknown[]>((resolve) => {
        editor.call(
            'scenes:new',
            name,
            (result: unknown) => resolve([null, result]),
            (error: unknown) => resolve([error])
        );
    });
    if (err) {
        return { error: String(err) };
    }
    log(`Created scene: ${name ?? '(unnamed)'}`);
    return { data };
});
driver.method('scenes:duplicate', async (id, name) => {
    const denied = writeError('duplicate scenes');
    if (denied) {
        return denied;
    }
    const [err, data] = await new Promise<unknown[]>((resolve) => {
        editor.call(
            'scenes:duplicate',
            String(id),
            name,
            (result: unknown) => resolve([null, result]),
            (error: unknown) => resolve([error])
        );
    });
    if (err) {
        return { error: String(err) };
    }
    log(`Duplicated scene(${id})`);
    return { data };
});
driver.method('scenes:delete', async (id) => {
    const denied = writeError('delete scenes');
    if (denied) {
        return denied;
    }
    const err = await new Promise<unknown>((resolve) => {
        editor.call('scenes:delete', String(id), () => resolve(null), resolve);
    });
    if (err) {
        return { error: String(err) };
    }
    log(`Deleted scene(${id})`);
    return { data: { deleted: id } };
});
driver.method('scene:load', async (uniqueId) => {
    if (String(config.scene.uniqueId) === String(uniqueId)) {
        return { data: { id: config.scene.id, uniqueId: config.scene.uniqueId } };
    }
    const [err, data] = await scenes();
    if (err) {
        return { error: String(err) };
    }
    if (!Array.isArray(data)) {
        return { error: 'Could not list scenes in the designated project.' };
    }
    const scene = data.find((item) => String(item.uniqueId) === String(uniqueId));
    if (!scene) {
        return { error: `Scene not found in the designated project: ${uniqueId}.` };
    }
    const loaded = new Promise<{ id?: number | string; uniqueId?: number | string; error?: string }>((resolve) => {
        const event = editor.on('scene:load', (id: number | string, loadedId: number | string) => {
            if (String(loadedId) === String(uniqueId)) {
                clearTimeout(timer);
                event.unbind();
                resolve({ id, uniqueId: loadedId });
            }
        });
        const timer = setTimeout(() => {
            event.unbind();
            resolve({ error: `Timed out waiting for scene ${uniqueId} to load.` });
        }, LOAD_TIMEOUT);
    });
    editor.call('scene:load', uniqueId);
    log(`Loading scene(${uniqueId})`);
    const result = await loaded;
    return result.error ? { error: result.error } : { data: result };
});
