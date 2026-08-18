import type { Schema } from '../schema';
import { utils } from '../utils';

type Field = Record<string, unknown>;

/**
 * Provides methods to access the scene schema.
 */
class SceneSchema {
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
        this._schema = schema.getDocument('scene');
    }

    _getDefaultData(schema: Field) {
        const result: Record<string, unknown> = {};
        for (const [key, field] of Object.entries(this._schemaApi.getFields(schema))) {
            const value = this._schemaApi.getDefault(field);
            if (value.hasDefault) {
                result[key] = utils.deepCopy(value.value);
                continue;
            }
            const nested = this._getDefaultData(field as Field);
            if (Object.keys(nested).length) result[key] = nested;
        }
        return result;
    }

    /**
     * Get the default physics scene settings for the project.
     *
     * @returns The default physics scene settings
     * @example
     * ```javascript
     * const scenePhysicsSettings = editor.schema.scene.getDefaultPhysicsSettings();
     * ```
     */
    getDefaultPhysicsSettings() {
        const settings = this._schemaApi.getFields(this._schema).settings;
        const physics = this._schemaApi.getFields(settings).physics;
        return this._getDefaultData(physics as Field);
    }

    /**
     * Get the default render scene settings for the project.
     *
     * @returns The default render scene settings
     * @example
     * ```javascript
     * const sceneRenderSettings = editor.schema.scene.getDefaultRenderSettings();
     * ```
     */
    getDefaultRenderSettings() {
        const settings = this._schemaApi.getFields(this._schema).settings;
        const render = this._schemaApi.getFields(settings).render;
        return this._getDefaultData(render as Field);
    }
}

export { SceneSchema };
