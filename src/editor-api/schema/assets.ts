import type { Schema } from '../schema';
import { utils } from '../utils';

/**
 * Provides methods to access the Assets schema
 */
class AssetsSchema {
    private _schemaApi: Schema;

    private _schema: any;

    /**
     * @category Internal
     * @param schema - The schema API
     */
    constructor(schema: Schema) {
        this._schemaApi = schema;
        this._schema = this._schemaApi.schema;
    }

    /**
     * Gets default data for asset type
     *
     * @param type - The asset type
     * @returns The default data
     */
    getDefaultData(type: string) {
        const field = `${type}Data`;

        if (!field || !this._schema[field]) {
            return null;
        }

        const result: Record<string, any> = {};

        const schema = this._schema[field];
        for (const key in schema) {
            if (key.startsWith('$')) {
                continue;
            }
            const block = schema[key];
            if (Object.prototype.hasOwnProperty.call(block, '$default')) {
                result[key] = utils.deepCopy(block.$default);
            }
        }

        return result;
    }

    resolvePath(type: string, path: string) {
        let field = this._schema[`${type}Data`];
        let open = false;

        if (!field) {
            return null;
        }
        for (const part of path.split('.')) {
            if (!part) {
                return null;
            }
            if (field.$type === 'map' || field.$type === 'mixed') {
                open = true;
                if (!field.$of) {
                    return { field: null, default: undefined, hasDefault: false, open };
                }
                field = field.$of;
            } else if (Array.isArray(field.$type)) {
                if (!Number.isInteger(Number(part)) || Number(part) < 0) {
                    return null;
                }
                field = field.$type[0];
            } else if (Object.hasOwn(field, part)) {
                field = field[part];
                continue;
            } else {
                return null;
            }
        }

        const hasDefault = Object.hasOwn(field, '$default');
        return { field, default: hasDefault ? utils.deepCopy(field.$default) : undefined, hasDefault, open };
    }

    /**
     * Gets a list of fields of a particular type for an asset type
     *
     * @param assetType - The type of the asset.
     * @param type - The desired type
     * @returns A list of fields
     * @example
     * ```javascript
     * const materialAssetPaths = editor.schema.assets.getFieldsOfType('material', 'asset');
     * ```
     */
    getFieldsOfType(assetType: string, type: string) {
        const result: string[] = [];

        const recurse = (schemaField: Record<string, any>, path: string, prefix = '') => {
            if (!schemaField) {
                return;
            }

            if (schemaField.$editorType === type || schemaField.$editorType === `array:${type}`) {
                result.push(prefix + path);
                return;
            }

            for (const field in schemaField) {
                if (field.startsWith('$')) {
                    continue;
                }

                const p = (path ? `${path}.` : '') + field;
                const fieldType = this._schemaApi.getType(schemaField[field]);
                if (fieldType === type || fieldType === `array:${type}`) {
                    result.push(prefix + p);
                } else if (fieldType === 'object' && schemaField[field].$of) {
                    recurse(schemaField[field].$of, `${p}.*`, prefix);
                } else if (fieldType === 'array:object' && Array.isArray(schemaField[field].$type)) {
                    recurse(schemaField[field].$type[0], `${p}.*`, prefix);
                }
            }
        };

        recurse(this._schema[`${assetType}Data`], '', 'data.');

        return result;
    }
}

export { AssetsSchema };
