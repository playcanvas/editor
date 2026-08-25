import type { Schema } from '../schema';
import { utils } from '../utils';

type Field = Record<string, unknown>;

/**
 * Provides methods to access the settings schema.
 */
class SettingsSchema {
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
        this._schema = schema.getDocument('settings');
    }

    _getDefaultData(schema: Field, scope: string) {
        const result: Record<string, unknown> = {};
        for (const [key, field] of Object.entries(this._schemaApi.getFields(schema))) {
            const nested = this._getDefaultData(field as Field, scope);
            if (Object.keys(nested).length) {
                result[key] = nested;
                continue;
            }
            const value = this._schemaApi.getDefault(field);
            if (value.hasDefault && this._schemaApi.getScope(field) === scope) {
                result[key] = utils.deepCopy(value.value);
            }
        }
        return result;
    }

    /**
     * Get the default settings for the project.
     *
     * @returns The default settings for the project
     * @example
     * ```javascript
     * const projectSettings = editor.schema.settings.getDefaultProjectSettings();
     * ```
     */
    getDefaultProjectSettings() {
        return this._getDefaultData(this._schema, 'project');
    }

    /**
     * Get the default settings for the user.
     *
     * @returns The default settings for the user
     * @example
     * ```javascript
     * const userSettings = editor.schema.settings.getDefaultUserSettings();
     * ```
     */
    getDefaultUserSettings() {
        return this._getDefaultData(this._schema, 'user');
    }

    /**
     * Get the default settings for the user in the project.
     *
     * @returns The default settings for the user in the project
     * @example
     * ```javascript
     * const projectUserSettings = editor.schema.settings.getDefaultProjectUserSettings();
     * ```
     */
    getDefaultProjectUserSettings() {
        return this._getDefaultData(this._schema, 'projectUser');
    }
}

export { SettingsSchema };
