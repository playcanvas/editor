import { resolveUnset } from './unset';

type Item = {
    get: (path: string) => unknown;
    has: (path: string) => boolean;
    set: (path: string, value: unknown) => unknown;
    unset: (path: string) => unknown;
};

export const unsetObserver = (item: Item, path: string) => {
    const schema = editor.api.globals.schema;
    let resolved;
    if (item.has('resource_id')) {
        resolved = schema.resolvePath(schema.getDocument('scene'), ['entities', '*', ...path.split('.')]);
    } else if (item.has('type')) {
        resolved = path.startsWith('data.')
            ? schema.assets.resolvePath(String(item.get('type')), path.slice(5))
            : schema.resolvePath(schema.getDocument('asset'), path);
    } else {
        const scene = item.has('physics') || item.has('render');
        resolved = schema.resolvePath(
            schema.getDocument(scene ? 'scene' : 'settings'),
            scene ? `settings.${path}` : path
        );
    }

    const op = resolveUnset(resolved ?? { hasDefault: false, default: undefined, open: false, optional: false });
    if (!op) throw new Error(`Path ${path} cannot be unset.`);
    if (op.op === 'set') item.set(path, structuredClone(op.value));
    else item.unset(path);
};
