import { AssetsSchema } from './schema/assets';
import { ComponentSchema } from './schema/components';
import { SceneSchema } from './schema/scene';
import { SettingsSchema } from './schema/settings';

type Field = Record<string, unknown>;

const isObject = (value: unknown): value is Field => {
    return !!value && typeof value === 'object' && !Array.isArray(value);
};

const jsonValue = (field: unknown) => {
    let value = field;
    while (isObject(value) && Array.isArray(value.anyOf)) {
        const next = value.anyOf.find((item) => isObject(item) && item.type !== 'null');
        if (!next) break;
        value = next;
    }
    return value;
};

/**
 * Provides methods to access the Editor schema.
 */
class Schema {
    private _schema: Field;

    private _assetsSchema: AssetsSchema;

    private _componentSchema: ComponentSchema;

    private _sceneSchema: SceneSchema;

    private _settingsSchema: SettingsSchema;

    /**
     * Creates new instance of API
     */
    constructor(schema: Field) {
        if (!isObject(schema)) {
            throw new Error('Invalid Editor schema payload');
        }

        if (schema.version !== 1 || !isObject(schema.documents) || !isObject(schema.assetData)) {
            throw new Error(`Unsupported Editor schema version: ${String(schema.version)}`);
        }

        this._schema = schema;
        this._assetsSchema = new AssetsSchema(this);
        this._componentSchema = new ComponentSchema(this);
        this._sceneSchema = new SceneSchema(this);
        this._settingsSchema = new SettingsSchema(this);
    }

    /**
     * Gets the raw schema payload.
     */
    get schema() {
        return this._schema;
    }

    /**
     * Gets the assets schema.
     */
    get assets() {
        return this._assetsSchema;
    }

    /**
     * Gets the component schema.
     */
    get components() {
        return this._componentSchema;
    }

    /**
     * Gets the scene schema.
     */
    get scene() {
        return this._sceneSchema;
    }

    /**
     * Gets the settings schema.
     */
    get settings() {
        return this._settingsSchema;
    }

    getDocument(name: 'asset' | 'scene' | 'settings') {
        return (this._schema.documents as Field)[name] as Field;
    }

    getAssetData(type: string) {
        return (this._schema.assetData as Field)[type.toLowerCase()] as Field | undefined;
    }

    getComponents() {
        return this.resolvePath(this.getDocument('scene'), 'entities.*.components', false)?.field as Field;
    }

    getFields(field: unknown) {
        if (!isObject(field)) return {};
        const value = jsonValue(field);
        return isObject(value) && isObject(value.properties) ? value.properties : {};
    }

    getMapValue(field: unknown) {
        if (!isObject(field)) return null;
        const value = jsonValue(field);
        if (isObject(value) && isObject(value.additionalProperties)) return value.additionalProperties;
        return null;
    }

    getArrayItem(field: unknown) {
        if (!isObject(field)) return null;
        const value = jsonValue(field);
        return isObject(value) && value.type === 'array' ? value.items : null;
    }

    getDefault(field: unknown) {
        if (!isObject(field)) return { value: undefined, hasDefault: false };
        const hasDefault = Object.hasOwn(field, 'default');
        return { value: hasDefault ? field.default : undefined, hasDefault };
    }

    getScope(field: unknown) {
        if (!isObject(field)) return undefined;
        return field['x-scope'] as string | undefined;
    }

    getAssetTypes() {
        const asset = jsonValue(this.getDocument('asset'));
        if (!isObject(asset) || !isObject(asset.properties)) return [];
        const type = jsonValue(asset.properties.type);
        return isObject(type) && Array.isArray(type.enum) ? (type.enum as string[]) : [];
    }

    resolvePath(root: unknown, path: string | readonly (string | number)[], strictArrays = true) {
        const parts = typeof path === 'string' ? path.split('.') : path;
        let field = root;
        let open = false;

        for (const part of parts) {
            if (part === '' || !isObject(field)) return null;

            field = jsonValue(field);
            if (!isObject(field)) return null;

            if (field['x-open-map'] === true || isObject(field.additionalProperties)) {
                open = true;
                if (!isObject(field.additionalProperties)) {
                    return { field: null, default: undefined, hasDefault: false, open };
                }
                field = field.additionalProperties;
            } else if (field.type === 'array') {
                if (strictArrays && (!Number.isInteger(Number(part)) || Number(part) < 0)) return null;
                if (!isObject(field.items)) return null;
                field = field.items;
            } else if (isObject(field.properties) && Object.hasOwn(field.properties, part)) {
                field = field.properties[part];
                continue;
            } else if (!field.type && !field.properties && !field.items && !field.anyOf) {
                open = true;
                return { field: null, default: undefined, hasDefault: false, open };
            } else {
                return null;
            }
        }

        const result = this.getDefault(field);
        return { field, default: result.value, hasDefault: result.hasDefault, open };
    }

    /**
     * Converts the specified schema field to a type recursively.
     *
     * @category Internal
     */
    getType(field: unknown): string {
        const value = jsonValue(field);
        if (!isObject(value)) return 'object';
        if (isObject(field) && typeof field['x-editor-type'] === 'string') return field['x-editor-type'];
        if (typeof value['x-editor-type'] === 'string') return value['x-editor-type'];
        if (value.type === 'array' && isObject(value.items)) {
            if (
                value.items.type === 'number' &&
                value.minItems === value.maxItems &&
                Number(value.minItems) >= 2 &&
                Number(value.minItems) <= 4
            ) {
                return `vec${value.minItems}`;
            }
            return `array:${this.getType(value.items)}`;
        }
        return typeof value.type === 'string' ? value.type : 'object';
    }

    getTypeForPath(root: unknown, path: string, strictArrays = true) {
        const result = this.resolvePath(root, path, strictArrays);
        return result?.field ? this.getType(result.field) : null;
    }

    getMergeMethodForPath(root: unknown, path: string, strictArrays = true) {
        const field = this.resolvePath(root, path, strictArrays)?.field;
        if (!isObject(field)) return undefined;
        return field['x-merge-method'] as string | undefined;
    }

    getScopeForPath(root: unknown, path: string, strictArrays = true) {
        const field = this.resolvePath(root, path, strictArrays)?.field;
        if (!isObject(field)) return undefined;
        return field['x-scope'] as string | undefined;
    }
}

export { Schema };
