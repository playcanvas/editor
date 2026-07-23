import { driver } from './driver';
import { api, log, iterateObject, validatePath, writeError } from './shared';

const WRITE_SCOPES = new Set(['project', 'projectPrivate', 'scene']);

const getSettings = (scope: string) => {
    if (scope === 'scene') {
        if (!api.realtime.scenes.current?.data) {
            throw new Error('No scene is currently loaded.');
        }
        return api.settings.scene.observer;
    }
    if (['project', 'projectUser', 'projectPrivate', 'user', 'session'].includes(scope)) {
        return editor.call(`settings:${scope}`);
    }
    throw new Error(`Invalid settings scope: ${scope}.`);
};

const querySettings = (scope: string, path?: string) => {
    const settings = getSettings(scope);
    if (path === undefined) {
        return { data: settings.json() };
    }
    validatePath(path);
    if (!settings.has(path)) {
        return { error: `Settings path not found in ${scope}: ${path}.` };
    }
    return { data: settings.get(path) };
};

const modifySettings = (scope: string, edits: any[]) => {
    if (WRITE_SCOPES.has(scope)) {
        const denied = writeError(`modify ${scope} settings`);
        if (denied) {
            return denied;
        }
    }
    const settings = getSettings(scope);
    const prepared = edits.map((edit) => {
        validatePath(edit.path);
        const op = edit.op || 'set';
        if (op !== 'set' && op !== 'unset') {
            throw new Error(`Invalid settings operation: ${op}.`);
        }
        if (op === 'set' && !Object.hasOwn(edit, 'value')) {
            throw new Error(`Missing value for settings path: ${edit.path}.`);
        }
        return { ...edit, op };
    });
    prepared.forEach(({ path, op, value }) => {
        if (op === 'unset') {
            settings.unset(path);
        } else {
            settings.set(path, value);
        }
    });
    log(`Modified ${scope} settings: ${prepared.map(({ path }) => path).join(', ')}`);
    return { data: settings.json() };
};

driver.method('settings:query', querySettings);
driver.method('settings:modify', modifySettings);
driver.method('project:settings:query', () => querySettings('project'));
driver.method('project:settings:modify', (settings) => {
    const edits: any[] = [];
    iterateObject(settings, (path, value) => edits.push({ path, value }));
    return modifySettings('project', edits);
});
