import { driver } from './driver';
import { api, log, iterateObject, validatePath, writeError } from './shared';
import { resolveUnset } from './unset';

const WRITE_SCOPES = new Set(['project', 'projectPrivate', 'scene']);

// the legacy asm.js Ammo loader is not supported over MCP: it loads after the WASM modules and
// overrides an imported Ammo module, so only clearing these flags is allowed
const LEGACY_AMMO_PATHS = new Set(['use3dPhysics', 'useLegacyAmmoPhysics']);
const LEGACY_AMMO_ERROR =
    'use3dPhysics and useLegacyAmmoPhysics enable the legacy asm.js Ammo loader and are not supported. Import the Ammo WASM module instead (Editor: IMPORT AMMO).';

const isLegacyAmmoEdit = ({ path, op, value }: any) => op === 'set' && LEGACY_AMMO_PATHS.has(path) && !!value;

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
        if (op !== 'unset') return { ...edit, op };

        const root = api.schema.getDocument(scope === 'scene' ? 'scene' : 'settings');
        const path = scope === 'scene' ? `settings.${edit.path}` : edit.path;
        const resolved = api.schema.resolvePath(root, path);
        const unset = resolveUnset(resolved ?? { hasDefault: false, default: undefined, open: false, optional: false });
        if (!unset) throw new Error(`Settings path ${edit.path} cannot be unset.`);
        return { ...edit, op: unset.op, value: unset.op === 'set' ? structuredClone(unset.value) : undefined };
    });
    if (scope === 'project' && prepared.some(isLegacyAmmoEdit)) {
        return { error: LEGACY_AMMO_ERROR };
    }
    for (let i = 0; i < prepared.length; i++) {
        const { path, op, value } = prepared[i];
        if (op === 'unset') {
            settings.unset(path);
        } else {
            settings.set(path, value);
        }
    }
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
