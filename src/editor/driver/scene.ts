import { driver } from './driver';
import { api, log, iterateObject } from './shared';

// scene settings
driver.method('scene:settings:modify', (settings) => {
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
    const data = await new Promise((resolve) => {
        editor.call('scenes:list', (result: unknown) => resolve(result));
    });
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
    const data = await new Promise((resolve) => {
        editor.call('scenes:new', name, (d: unknown) => resolve(d));
    });
    log(`Created scene: ${name ?? '(unnamed)'}`);
    return { data };
});
driver.method('scenes:duplicate', async (id, name) => {
    const data = await new Promise((resolve) => {
        editor.call('scenes:duplicate', String(id), name, (d: unknown) => resolve(d));
    });
    log(`Duplicated scene(${id})`);
    return { data };
});
driver.method('scenes:delete', async (id) => {
    await new Promise<void>((resolve) => {
        editor.call('scenes:delete', String(id), () => resolve());
    });
    log(`Deleted scene(${id})`);
    return { data: { deleted: id } };
});
driver.method('scene:load', (uniqueId) => {
    // scene:load defers until realtime is authenticated, so this returns before
    // the switch completes; the editor loads the scene asynchronously.
    editor.call('scene:load', uniqueId);
    log(`Loading scene(${uniqueId})`);
    return { data: { loading: uniqueId } };
});
