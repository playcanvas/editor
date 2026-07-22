import { driver } from './driver';
import { api, log, iterateObject, writeError } from './shared';

const WRITE_SCOPES = new Set(['project', 'projectPrivate', 'scene']);
const BLOCKED_PATHS = new Set(['__proto__', 'prototype', 'constructor']);

const getSettings = (scope: string) => {
    if (scope === 'scene') {
        return api.settings.scene.observer;
    }
    if (['project', 'projectUser', 'projectPrivate', 'user', 'session'].includes(scope)) {
        return editor.call(`settings:${scope}`);
    }
    throw new Error(`Invalid settings scope: ${scope}.`);
};

const validatePath = (path: string) => {
    if (!path || path.split('.').some((part) => !part || BLOCKED_PATHS.has(part))) {
        throw new Error(`Invalid settings path: ${path}.`);
    }
};

// project settings
driver.method('project:settings:modify', (settings) => {
    const denied = writeError('modify project settings');
    if (denied) {
        return denied;
    }
    const project = editor.call('settings:project');
    iterateObject(settings, (path, value) => {
        project.set(path, value);
    });
    log('Modified project settings');

    // return the resulting settings snapshot inline
    return { data: project.json() };
});
driver.method('project:settings:query', () => {
    const project = editor.call('settings:project');
    log('Queried project settings');
    return { data: project.json() };
});

driver.method('settings:query', (scope, path) => {
    const settings = getSettings(scope);
    if (path === undefined) {
        return { data: settings.json() };
    }
    validatePath(path);
    if (!settings.has(path)) {
        return { error: `Settings path not found in ${scope}: ${path}.` };
    }
    return { data: settings.get(path) };
});

driver.method('settings:modify', (scope, edits) => {
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
});
