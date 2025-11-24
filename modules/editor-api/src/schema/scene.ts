import { Schema } from '../schema';
import { utils } from '../utils';

/**
 * Provides methods to access the render schema
 */
class SceneSchema {
    private _schemaApi: Schema;

    private _schema: any;

    /**
     * Creates new instance of API
     *
     * @category Internal
     * @param schema - The schema API
     */
    constructor(schema: Schema) {
        this._schemaApi = schema;
        this._schema = this._schemaApi.schema.scene;
    }

    _getDefaultData(obj: Record<string, any>) {
        const result: Record<string, any> = {};
        for (const key in obj) {
            if (key.startsWith('$')) continue;
            if (!(obj[key] instanceof Object)) continue;

            if (obj[key].hasOwnProperty('$default')) {
                result[key] = utils.deepCopy(obj[key].$default);
                continue;
            } else {
                const subDefaults = this._getDefaultData(obj[key]);
                if (Object.keys(subDefaults).length) {
                    result[key] = subDefaults;
                }
            }
        }
        return result;
    }

    /**
     * Get the default physics scene settings for the project
     *
     * @returns The default physics scene settings
     * @example
     * ```javascript
     * const scenePhysicsSettings = editor.schema.scene.getDefaultPhysicsSettings();
     * ```
     */
    getDefaultPhysicsSettings() {
        return this._getDefaultData(this._schema.settings.physics);
    }

    /**
     * Get the default render scene settings for the project
     *
     * @returns The default physics scene settings
     * @example
     * ```javascript
     * const sceneRenderSettings = editor.schema.scene.getDefaultRenderSettings();
     * ```
     */
    getDefaultRenderSettings() {
        return this._getDefaultData(this._schema.settings.render);
    }
}

export { SceneSchema };
