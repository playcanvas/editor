import type { Observer } from '@playcanvas/observer';
import { Color, Curve, CurveSet, Quat, Vec2, Vec3, Vec4 } from 'playcanvas';

import { deepCopy } from '@/common/utils';

type CurveValue = { keys: number[]; type: number };

editor.once('load', () => {
    const api = editor.api.globals.schema;
    const schema = api.getFields(api.getComponents());
    const settings = editor.call('settings:project');
    const titles: Record<string, string> = {};

    for (const name of Object.keys(schema)) {
        switch (name) {
            case 'audiosource':
                titles[name] = 'Audio Source';
                break;
            case 'audiolistener':
                titles[name] = 'Audio Listener';
                break;
            case 'particlesystem':
                titles[name] = 'Particle System';
                break;
            case 'rigidbody':
                titles[name] = 'Rigid Body';
                break;
            case 'scrollview':
                titles[name] = 'Scroll View';
                break;
            case 'layoutgroup':
                titles[name] = 'Layout Group';
                break;
            case 'layoutchild':
                titles[name] = 'Layout Child';
                break;
            case 'gsplat':
                titles[name] = 'Gaussian Splat';
                break;
            default:
                titles[name] = name[0].toUpperCase() + name.substring(1);
                break;
        }
    }

    if (schema.screen) {
        const fields = api.getFields(schema.screen);
        (fields.resolution as Record<string, unknown>).default = () => [settings.get('width'), settings.get('height')];
        (fields.referenceResolution as Record<string, unknown>).default = () => [
            settings.get('width'),
            settings.get('height')
        ];
    }

    if (schema.element) {
        const fields = api.getFields(schema.element);
        (fields.fontAsset as Record<string, unknown>).default = () => {
            const id = editor.call('settings:projectUser').get('editor.lastSelectedFontId');
            if (id !== -1 && editor.call('assets:get', id)) return id;

            const asset = editor.call('assets:findOne', (item: Observer) => {
                return !item.get('source') && item.get('type') === 'font';
            });
            return asset ? parseInt(asset[1].get('id'), 10) : null;
        };
    }

    const assetPaths: string[] = [];
    const gather = (root: unknown, path: string) => {
        const type = api.getType(root);
        if (type === 'asset' || type === 'array:asset') {
            assetPaths.push(path);
            return;
        }

        for (const [name, field] of Object.entries(api.getFields(root))) {
            const current = `${path}.${name}`;
            const fieldType = api.getType(field);
            if (fieldType === 'asset' || fieldType === 'array:asset') {
                assetPaths.push(current);
                continue;
            }
            const map = api.getMapValue(field);
            if (fieldType === 'object' && map) gather(map, `${current}.*`);
        }
    };

    for (const [name, field] of Object.entries(schema)) {
        gather(field, `components.${name}`);
    }

    editor.method('components:assetPaths', () => assetPaths);

    const legacy = settings.get('useLegacyScripts');
    if (legacy) {
        const fields = api.getFields(schema.script);
        (fields.scripts as Record<string, unknown>).default = [];
        delete fields.order;
    }

    let list = Object.keys(schema).sort();
    list = list.filter((item) => !item.startsWith('$'));

    editor.method('components:convertValue', (component: string, property: string, value: unknown) => {
        let result = value;
        const field = api.getFields(schema[component])[property];

        if (value && field) {
            switch (api.getType(field)) {
                case 'rgb':
                    result = new Color(value[0], value[1], value[2]);
                    break;
                case 'rgba':
                    result = new Color(value[0], value[1], value[2], value[3]);
                    break;
                case 'vec2':
                    result = new Vec2(value[0], value[1]);
                    break;
                case 'vec3':
                    result = new Vec3(value[0], value[1], value[2]);
                    break;
                case 'vec4':
                    result = new Vec4(value[0], value[1], value[2], value[3]);
                    break;
                case 'curveset':
                    result = new CurveSet((value as CurveValue).keys);
                    (result as CurveSet).type = (value as CurveValue).type;
                    break;
                case 'curve':
                    result = new Curve((value as CurveValue).keys);
                    (result as Curve).type = (value as CurveValue).type;
                    break;
                case 'entity':
                    result = value;
                    break;
            }

            if (
                component === 'collision' &&
                property === 'angularOffset' &&
                Array.isArray(value) &&
                value.length === 3
            ) {
                result = new Quat().setFromEulerAngles(value[0], value[1], value[2]);
            }
        }

        if (result === null && property === 'batchGroupId') result = -1;
        return result;
    });

    editor.method('components:list', () => {
        const result = list.slice();
        if (!editor.call('users:hasFlag', 'hasZoneComponent')) {
            const index = result.indexOf('zone');
            if (index !== -1) result.splice(index, 1);
        }
        return result;
    });

    editor.method('components:schema', () => schema);
    editor.method('components:title', (component: string) => titles[component]);

    editor.method('components:getDefault', (component: string) => {
        const result: Record<string, unknown> = {};
        for (const [name, field] of Object.entries(api.getFields(schema[component]))) {
            if (legacy && component === 'script' && name === 'order') continue;
            const value = api.getDefault(field);
            if (value.hasDefault) result[name] = deepCopy(value.value);
        }

        for (const [name, value] of Object.entries(result)) {
            if (typeof value === 'function') result[name] = value();
        }
        return result;
    });

    editor.method('components:getFieldsOfType', (component, type) => {
        const result = [];
        for (const [name, field] of Object.entries(api.getFields(schema[component]))) {
            if (api.getType(field) === type) result.push(name);
        }
        return result;
    });
});
