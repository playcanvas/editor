import { driver } from './driver';
import { api, log, iterateObject, validatePath, writeError } from './shared';
import { resolveUnset } from './unset';

const WRITE_SCOPES = new Set(['project', 'projectPrivate', 'scene']);

const LEGACY_AMMO_PATHS = new Set(['use3dPhysics', 'useLegacyAmmoPhysics']);
const LEGACY_AMMO_MODULE_ERROR =
    'use3dPhysics enables the LEGACY asm.js Ammo loader, which is loaded after the imported Ammo WASM module and overrides it. Physics is already enabled by the Ammo module; leave use3dPhysics false (or remove the module first).';
const LEGACY_AMMO_WARNING =
    'Legacy Ammo flag set: the launch page loads the legacy asm.js Ammo build after the WASM modules, so it overrides an imported Ammo module. Import the Ammo module instead for WASM physics.';

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
    const legacyAmmo = scope === 'project' ? prepared.filter(isLegacyAmmoEdit) : [];
    if (legacyAmmo.some(({ path }) => path === 'use3dPhysics') && editor.call('project:module:hasModule', 'ammo')) {
        return { error: LEGACY_AMMO_MODULE_ERROR };
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
    return legacyAmmo.length
        ? { data: settings.json(), meta: { warning: LEGACY_AMMO_WARNING } }
        : { data: settings.json() };
};

driver.method('settings:query', querySettings);
driver.method('settings:modify', modifySettings);
driver.method('project:settings:query', () => querySettings('project'));
driver.method('project:settings:modify', (settings) => {
    const edits: any[] = [];
    iterateObject(settings, (path, value) => edits.push({ path, value }));
    return modifySettings('project', edits);
});
