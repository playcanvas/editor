editor.once('load', function () {
    'use strict';

    var projectSettings = editor.call('settings:project');

    var schema = config.schema.scene.entities.$of.components;

    var componentName;

    // make titles for each component
    for (componentName in schema) {
        if (componentName.startsWith('$')) continue;

        var title;
        switch (componentName) {
            case 'audiosource':
                title = 'Audio Source';
                break;
            case 'audiolistener':
                title = 'Audio Listener';
                break;
            case 'particlesystem':
                title = 'Particle System';
                break;
            case 'rigidbody':
                title = 'Rigid Body';
                break;
            case 'scrollview':
                title = 'Scroll View';
                break;
            case 'layoutgroup':
                title = 'Layout Group';
                break;
            case 'layoutchild':
                title = 'Layout Child';
                break;
            default:
                title = componentName[0].toUpperCase() + componentName.substring(1);
                break;
        }

        schema[componentName].$title = title;
    }

    // some property defaults should be dynamic so
    // patch them in
    if (schema.screen) {
        // default resolution to project resolution for screen components
        schema.screen.resolution.$default = function () {
            return [
                projectSettings.get('width'),
                projectSettings.get('height')
            ];
        };
        schema.screen.referenceResolution.$default = function () {
            return [
                projectSettings.get('width'),
                projectSettings.get('height')
            ];
        };
    }

    if (schema.element) {
        schema.element.fontAsset.$default = function () {
            // Reuse the last selected font, if it still exists in the library
            var lastSelectedFontId = editor.call('settings:projectUser').get('editor.lastSelectedFontId');
            var lastSelectedFontStillExists = lastSelectedFontId !== -1 && !!editor.call('assets:get', lastSelectedFontId);

            if (lastSelectedFontStillExists) {
                return lastSelectedFontId;
            }

            // Otherwise, select the first available font in the library
            var firstAvailableFont = editor.call('assets:findOne', function (asset) { return !asset.get('source') && asset.get('type') === 'font'; });

            return firstAvailableFont ? parseInt(firstAvailableFont[1].get('id'), 10) : null;
        };
    }

    // Paths in components that represent assets.
    // Does not include asset script attributes.
    var assetPaths = [];
    var gatherAssetPathsRecursively = function (schemaField, path) {
        if (schemaField.$editorType === 'asset' || schemaField.$editorType === 'array:asset') {
            // this is for cases like components.model.mapping
            assetPaths.push(path);
            return;
        }

        for (const fieldName in schemaField) {
            if (fieldName.startsWith('$')) continue;

            var field = schemaField[fieldName];
            var type = editor.call('schema:getType', field);
            if (type === 'asset' || type === 'array:asset') {
                assetPaths.push(path + '.' + fieldName);
            } else if (type === 'object' && field.$of) {
                gatherAssetPathsRecursively(field.$of, path + '.' + fieldName + '.*');
            }
        }
    };

    for (componentName in schema) {
        gatherAssetPathsRecursively(schema[componentName], 'components.' + componentName);
    }


    editor.method('components:assetPaths', function () {
        return assetPaths;
    });

    if (editor.call('settings:project').get('useLegacyScripts')) {
        schema.script.scripts.$default = [];
        delete schema.script.order;
    }

    var list = Object.keys(schema).sort(function (a, b) {
        if (a > b) {
            return 1;
        } else if (a < b) {
            return -1;
        }

        return 0;
    });

    list = list.filter(item => !item.startsWith('$'));

    editor.method('components:convertValue', function (component, property, value) {
        var result = value;

        if (value) {
            var data = schema[component];
            if (data && data[property]) {
                var type = editor.call('schema:getType', data[property]);
                switch (type) {
                    case 'rgb':
                        result = new pc.Color(value[0], value[1], value[2]);
                        break;
                    case 'rgba':
                        result = new pc.Color(value[0], value[1], value[2], value[3]);
                        break;
                    case 'vec2':
                        result = new pc.Vec2(value[0], value[1]);
                        break;
                    case 'vec3':
                        result = new pc.Vec3(value[0], value[1], value[2]);
                        break;
                    case 'vec4':
                        result = new pc.Vec4(value[0], value[1], value[2], value[3]);
                        break;
                    case 'curveset':
                        result = new pc.CurveSet(value.keys);
                        result.type = value.type;
                        break;
                    case 'curve':
                        result = new pc.Curve(value.keys);
                        result.type = value.type;
                        break;
                    case 'entity':
                        result = value; // Entity fields should just be a string guid
                        break;
                }
            }
        }

        // for batchGroupId convert null to -1 for runtime
        if (result === null && property === 'batchGroupId')
            result = -1;

        return result;
    });

    editor.method('components:list', function () {
        var result = list.slice(0);
        var idx;

        // filter out zone (which is not really supported)
        if (!editor.call('users:hasFlag', 'hasZoneComponent')) {
            idx = result.indexOf('zone');
            if (idx !== -1) {
                result.splice(idx, 1);
            }
        }

        return result;
    });

    editor.method('components:schema', function () {
        return schema;
    });

    editor.method('components:getDefault', function (component) {
        var result = {};
        for (const fieldName in schema[component]) {
            if (fieldName.startsWith('$')) continue;
            var field = schema[component][fieldName];
            if (field.hasOwnProperty('$default')) {
                result[fieldName] = utils.deepCopy(field.$default);
            }
        }

        resolveLazyDefaults(result);

        return result;
    });

    function resolveLazyDefaults(defaults) {
        // Any functions in the default property set are used to provide
        // lazy resolution, to handle cases where the values are not known
        // at startup time.
        Object.keys(defaults).forEach(function (key) {
            var value = defaults[key];

            if (typeof value === 'function') {
                defaults[key] = value();
            }
        });
    }

    editor.method('components:getFieldsOfType', function (component, type) {
        var matchingFields = [];

        for (const field in schema[component]) {
            if (schema[component][field].$editorType === type) {
                matchingFields.push(field);
            }
        }

        return matchingFields;
    });

});
