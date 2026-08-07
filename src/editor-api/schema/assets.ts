import type { Schema } from '../schema';
import { utils } from '../utils';

type Field = Record<string, unknown>;

/**
 * Provides methods to access the Assets schema.
 */
class AssetsSchema {
    private _schemaApi: Schema;

    /**
     * @category Internal
     * @param schema - The schema API
     */
    constructor(schema: Schema) {
        this._schemaApi = schema;
    }

    /**
     * Gets default data for asset type.
     */
    getDefaultData(type: string) {
        const schema = this._schemaApi.getAssetData(type);
        if (!schema) return null;

        const result: Record<string, unknown> = {};
        for (const [key, block] of Object.entries(this._schemaApi.getFields(schema))) {
            const value = this._schemaApi.getDefault(block);
            if (value.hasDefault) result[key] = utils.deepCopy(value.value);
        }
        return result;
    }

    resolvePath(type: string, path: string) {
        const schema = this._schemaApi.getAssetData(type);
        const result = schema ? this._schemaApi.resolvePath(schema, path) : null;
        // copy the default so callers never mutate the shared catalog value
        if (result?.hasDefault) {
            result.default = typeof result.default === 'function' ? result.default() : utils.deepCopy(result.default);
        }
        return result;
    }

    /**
     * Gets a list of fields of a particular type for an asset type.
     */
    getFieldsOfType(assetType: string, type: string) {
        const result: string[] = [];

        const recurse = (schema: Field, path: string, prefix = '') => {
            for (const [name, field] of Object.entries(this._schemaApi.getFields(schema))) {
                const current = (path ? `${path}.` : '') + name;
                const fieldType = this._schemaApi.getType(field);
                if (fieldType === type || fieldType === `array:${type}`) {
                    result.push(prefix + current);
                    continue;
                }

                const map = this._schemaApi.getMapValue(field);
                if (fieldType === 'object' && map) {
                    recurse(map as Field, `${current}.*`, prefix);
                    continue;
                }

                const item = this._schemaApi.getArrayItem(field);
                if (fieldType === 'array:object' && item) recurse(item as Field, `${current}.*`, prefix);
            }
        };

        const schema = this._schemaApi.getAssetData(assetType);
        if (schema) recurse(schema, '', 'data.');
        return result;
    }
}

export { AssetsSchema };
