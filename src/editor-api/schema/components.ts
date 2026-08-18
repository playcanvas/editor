import type { Schema } from '../schema';
import { utils } from '../utils';

type Field = Record<string, unknown>;

/**
 * Provides methods to access the components schema.
 */
class ComponentSchema {
    private _schemaApi: Schema;

    private _schema: Field;

    /**
     * Creates new instance of API.
     *
     * @category Internal
     * @param schema - The schema API
     */
    constructor(schema: Schema) {
        this._schemaApi = schema;
        this._schema = schema.getComponents();
    }

    _resolveLazyDefaults(defaults: Record<string, unknown>) {
        for (const [key, value] of Object.entries(defaults)) {
            if (typeof value === 'function') defaults[key] = value();
        }
    }

    /**
     * Gets default data for a component.
     *
     * @param component - The component name
     * @returns The default data
     * @example
     * ```javascript
     * const modelData = editor.schema.components.getDefaultData('model');
     * ```
     */
    getDefaultData(component: string) {
        const result: Record<string, unknown> = {};
        const schema = this._schemaApi.getFields(this._schema)[component];
        for (const [name, field] of Object.entries(this._schemaApi.getFields(schema))) {
            const value = this._schemaApi.getDefault(field);
            if (value.hasDefault) result[name] = utils.deepCopy(value.value);
        }
        this._resolveLazyDefaults(result);
        return result;
    }

    resolvePath(component: string, path: string) {
        const schema = this._schemaApi.getFields(this._schema)[component];
        const result = schema ? this._schemaApi.resolvePath(schema, path) : null;
        if (result?.hasDefault) {
            result.default = typeof result.default === 'function' ? result.default() : utils.deepCopy(result.default);
        }
        return result;
    }

    /**
     * Gets a list of fields of a particular type for a component.
     *
     * @param component - The component name
     * @param type - The desired type
     * @returns A list of fields
     * @example
     * ```javascript
     * const buttonEntityFields = editor.schema.components.getFieldsOfType('button', 'entity');
     * ```
     */
    getFieldsOfType(component: string, type: string) {
        const result: string[] = [];

        const recurse = (schema: Field, path: string) => {
            for (const [name, field] of Object.entries(this._schemaApi.getFields(schema))) {
                const current = (path ? `${path}.` : '') + name;
                const fieldType = this._schemaApi.getType(field);
                if (fieldType === type || fieldType === `array:${type}`) {
                    result.push(current);
                    continue;
                }
                const map = this._schemaApi.getMapValue(field);
                if (fieldType === 'object' && map) {
                    const mapType = this._schemaApi.getType(map);
                    if (mapType === type || mapType === `array:${type}`) {
                        result.push(`${current}.*`);
                    } else {
                        recurse(map as Field, `${current}.*`);
                    }
                }
            }
        };

        const schema = this._schemaApi.getFields(this._schema)[component];
        if (schema) recurse(schema as Field, '');
        return result;
    }

    /**
     * Gets a list of all the available components.
     *
     * @returns The components
     */
    list() {
        const result = Object.keys(this._schemaApi.getFields(this._schema)).sort();
        const index = result.indexOf('zone');
        if (index !== -1) result.splice(index, 1);
        return result;
    }
}

export { ComponentSchema };
