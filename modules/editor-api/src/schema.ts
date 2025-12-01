import { AssetsSchema } from './schema/assets';
import { ComponentSchema } from './schema/components';
import { SceneSchema } from './schema/scene';
import { SettingsSchema } from './schema/settings';

/**
 * Provides methods to access the Editor schema.
 */
class Schema {
    private _schema: any;

    private _assetsSchema: AssetsSchema;

    private _componentSchema: ComponentSchema;

    private _sceneSchema: SceneSchema;

    private _settingsSchema: SettingsSchema;

    /**
     * Creates new instance of API
     */
    constructor(schema: any) {
        this._schema = schema;
        this._assetsSchema = new AssetsSchema(this);
        this._componentSchema = new ComponentSchema(this);
        this._sceneSchema = new SceneSchema(this);
        this._settingsSchema = new SettingsSchema(this);
    }

    /**
     * Gets the schema
     */
    get schema() {
        return this._schema;
    }

    /**
     * Gets the assets schema
     */
    get assets() {
        return this._assetsSchema;
    }

    /**
     * Gets the component schema
     */
    get components() {
        return this._componentSchema;
    }

    /**
     * Gets the scene schema
     */
    get scene() {
        return this._sceneSchema;
    }

    /**
     * Gets the settings schema
     */
    get settings() {
        return this._settingsSchema;
    }

    /**
     * Converts the specified schema field to a type recursively.
     *
     * @category Internal
     */
    getType(field: any, fixedLength: number = 0): string {
        if (typeof field === 'string') {
            if (field === 'map' || field === 'mixed') {
                field = 'object';
            }

            return field.toLowerCase();
        }

        if (field.$editorType) {
            return field.$editorType;
        }

        if (Array.isArray(field)) {
            if (field[0] === 'number' && fixedLength) {
                if (fixedLength === 2) {
                    return 'vec2';
                } else if (fixedLength === 3) {
                    return 'vec3';
                } else if (fixedLength === 4) {
                    return 'vec4';
                }
            }

            return `array:${this.getType(field[0])}`;
        }

        if (field.$type) {
            return this.getType(field.$type, field.$length);
        }

        return 'object';
    }
}

export { Schema };
