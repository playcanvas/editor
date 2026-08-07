import type { Schema } from '../schema';
import { utils } from '../utils';

type Field = Record<string, unknown>;

/**
 * Provides methods to access the scene schema.
 */
class SceneSchema {
    private _schemaApi: Schema;

    private _schema: Field;

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

    getDefaultPhysicsSettings() {
        const settings = this._schemaApi.getFields(this._schema).settings;
        const physics = this._schemaApi.getFields(settings).physics;
        return this._getDefaultData(physics as Field);
    }

    getDefaultRenderSettings() {
        const settings = this._schemaApi.getFields(this._schema).settings;
        const render = this._schemaApi.getFields(settings).render;
        return this._getDefaultData(render as Field);
    }
}

export { SceneSchema };
