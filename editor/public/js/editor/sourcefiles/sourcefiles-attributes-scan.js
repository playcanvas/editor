editor.once('load', function () {
    if (! editor.call('settings:project').get('useLegacyScripts'))
        return;

    var VALID_TYPES = [
        'number',
        'string',
        'boolean',
        'asset',
        'rgb',
        'rgba',
        'vector',
        'vec2',
        'vec3',
        'vec4',
        'enumeration',
        'entity',
        'curve',
        'colorcurve'
    ];

    var REGEX_GUID = /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/i;
    var REGEX_COLOR_CURVE = /^((r((gba?)?))|g|b|a)$/; // r or g or b or rgb or rgba

    var attributeErrorMsg = function (url, attribute, error) {
        return pc.string.format("Attribute '{0}' of script {1} is invalid: {2}", attribute.name, url, error);
    };

    var validateValue = function (url, attribute, correctType, valueIfUndefined) {
        var type = pc.type(attribute.defaultValue);
        if (type === 'undefined' || type === 'null') {
            attribute.defaultValue = valueIfUndefined;
        } else if (type !== correctType) {
            throw attributeErrorMsg(url, attribute, 'Value is not of type ' + correctType);
        }
    };

    var validateArrayValue = function (url, attribute, valueIfUndefined, correctLength, typeofElements) {
        validateValue(url, attribute, 'array', valueIfUndefined);

        if (correctLength >= 0 && attribute.defaultValue.length !== correctLength) {
            throw attributeErrorMsg(url, attribute, pc.string.format('Value must be an array with {0} elements of type {1}', correctLength, typeofElements));
        } else {
            for (let i = 0; i < attribute.defaultValue.length; i++) {
                if (typeof attribute.defaultValue[i] !== typeofElements) {
                    throw attributeErrorMsg(url, attribute, pc.string.format('Value must be an array with elements of type {0}', typeofElements));
                }
            }
        }
    };

    var validators = {
        'number': function (url, attribute) {
            validateValue(url, attribute, 'number', 0);
        },

        'string': function (url, attribute) {
            validateValue(url, attribute, 'string', '');

            if (attribute.defaultValue.length > 512) {
                throw attributeErrorMsg(url, attribute, "Value exceeds 512 characters");
            }
        },

        'boolean': function (url, attribute) {
            validateValue(url, attribute, 'boolean', false);
        },

        'asset': function (url, attribute) {
            // TODO check max array length
            validateArrayValue(url, attribute, [], -1, 'number');
        },

        'vector': function (url, attribute) {
            validateArrayValue(url, attribute, [0, 0, 0], 3, 'number');
        },

        'vec2': function (url, attribute) {
            validateArrayValue(url, attribute, [0, 0], 2, 'number');
        },

        'vec3': function (url, attribute) {
            validateArrayValue(url, attribute, [0, 0, 0], 3, 'number');
        },

        'vec4': function (url, attribute) {
            validateArrayValue(url, attribute, [0, 0, 0, 0], 4, 'number');
        },

        'rgb': function (url, attribute) {
            validateArrayValue(url, attribute, [0, 0, 0], 3, 'number');
        },

        'rgba': function (url, attribute) {
            validateArrayValue(url, attribute, [0, 0, 0, 1], 4, 'number');
        },

        'enumeration': function (url, attribute) {
            if (attribute.options &&
                attribute.options.enumerations &&
                pc.type(attribute.options.enumerations) === 'array' &&
                attribute.options.enumerations.length) {

                var valueType;
                var enumerations = attribute.options.enumerations;
                // TODO check enumerations max length
                for (let i = 0; i < enumerations.length; i++) {
                    if (pc.type(enumerations[i]) !== 'object') {
                        throw attributeErrorMsg(url, attribute, "Each enumeration must be an object with this form: {name: '...', value: ...}");
                    } else {
                        if (pc.type(enumerations[i].name) !== 'string' ||
                            enumerations[i].name.length === 0 ||
                            pc.type(enumerations[i].value) === 'undefined') {

                            throw attributeErrorMsg(url, attribute, "Each enumeration must be an object with this form: {name: '...', value: ...}");
                        } else {
                            if (!valueType) {
                                valueType = pc.type(enumerations[i].value);
                            } else {
                                if (valueType !== pc.type(enumerations[i].value)) {
                                    throw attributeErrorMsg(url, attribute, "All enumerations values must be the same type");
                                }
                            }
                        }
                    }
                }

                validateValue(url, attribute, valueType, enumerations[0].value);

                var isValueInEnumerations = false;
                for (let i = 0; i < enumerations.length; i++) {
                    if (enumerations[i].value === attribute.defaultValue) {
                        isValueInEnumerations = true;
                        break;
                    }
                }

                if (!isValueInEnumerations) {
                    throw attributeErrorMsg(url, attribute, "Value is not one of the possible enumerations");
                }
            } else {
                throw attributeErrorMsg(url, attribute, "Missing enumerations from attribute options");
            }
        },

        'entity': function (url, attribute) {
            validateValue(url, attribute, 'string', null);

            if (attribute.defaultValue && !REGEX_GUID.test(attribute.defaultValue)) {
                throw attributeErrorMsg(url, attribute, "Value is not a valid Entity resource id");
            }
        },

        'curve': function (url, attribute) {
            if (!attribute.options)
                attribute.options = {};

            if (!attribute.options.curves) {
                attribute.options.curves = ['Value'];
            } else {
                if (!attribute.options.curves.length) {
                    throw attributeErrorMsg(url, attribute, "Curves option must be a non-empty string array");
                } else if (attribute.options.curves.length > 4) {
                    throw attributeErrorMsg(url, attribute, "Curves option cannot exceed 4 elements");
                }
            }

            if (attribute.defaultValue !== null && attribute.defaultValue !== undefined) {
                if (typeof attribute.defaultValue !== 'object' || attribute.defaultValue instanceof Array)
                    throw attributeErrorMsg(url, attribute, "Invalid default value for curve attribute");

                var validData = {
                    type: attribute.defaultValue.type,
                    keys: attribute.defaultValue.keys
                };

                attribute.defaultValue = validData;

                if (validData.type !== undefined) {
                    if (validData.type !== 0 && validData.type !== 1 && validData.type !== 2) {
                        throw attributeErrorMsg(url, attribute, "Invalid type. Needs to be one of: 0, 1, 2");
                    }
                }

                if (!(validData.keys instanceof Array)) {
                    throw attributeErrorMsg(url, attribute, "Invalid keys. Needs to be an array");
                }

                if (attribute.options.curves.length > 1) {
                    if (validData.keys.length !== 0 && validData.keys.length !== attribute.options.curves.length) {
                        throw attributeErrorMsg(url, attribute, 'Invalid keys. Needs to be an array of ' + attribute.options.curves.length + ' arrays');
                    } else {
                        for (let i = 0, len = validData.keys.length; i < len; i++) {
                            if (!(validData.keys[i] instanceof Array)) {
                                throw attributeErrorMsg(url, attribute, 'Invalid keys. Needs to be an array of ' + len + ' arrays');
                            } else {
                                var len2 = validData.keys[i].length;
                                if (len2 % 2 !== 0)
                                    throw attributeErrorMsg(url, attribute, 'Invalid keys. Array must hold an even amount of numbers');

                                for (var j = 0; j < len2; j++) {
                                    if (typeof validData.keys[i][j] !== 'number')
                                        throw attributeErrorMsg(url, attribute, 'Invalid keys. Array values must be numbers');
                                }
                            }
                        }
                    }
                } else {
                    if (attribute.options.curves.length === 1) {
                        if (validData.keys.length % 2 !== 0)
                            throw attributeErrorMsg(url, attribute, 'Invalid keys. Array must hold an even amount of numbers');

                        for (let i = 0, len = validData.keys.length; i < len; i++) {
                            if (typeof validData.keys[i] !== 'number')
                                throw attributeErrorMsg(url, attribute, 'Invalid keys. Array values must be numbers');
                        }
                    }
                }
            } else {
                attribute.defaultValue = {
                    type: 1,
                    keys: []
                };

                if (attribute.options.curves.length === 1)
                    attribute.defaultValue.keys = [0, 0];
                else {
                    for (let i = 0; i < attribute.options.curves.length; i++) {
                        attribute.defaultValue.keys.push([0, 0]);
                    }
                }
            }
        },

        'colorcurve': function (url, attribute) {
            if (!attribute.options)
                attribute.options = {};

            if (!attribute.options.type) {
                attribute.options.type = 'rgb';
            } else {
                if (!REGEX_COLOR_CURVE.test(attribute.options.type)) {
                    throw attributeErrorMsg(url, attribute, "Color curve type can be one of 'r', 'g', 'b', 'a', 'rgb', 'rgba'");
                }
            }

            if (attribute.defaultValue !== null && attribute.defaultValue !== undefined) {
                if (typeof attribute.defaultValue !== 'object' || attribute.defaultValue instanceof Array)
                    throw attributeErrorMsg(url, attribute, "Invalid default value for curve attribute");

                var validData = {
                    type: attribute.defaultValue.type,
                    keys: attribute.defaultValue.keys
                };

                attribute.defaultValue = validData;

                if (validData.type !== undefined) {
                    if (validData.type !== 0 && validData.type !== 1 && validData.type !== 2) {
                        throw attributeErrorMsg(url, attribute, "Invalid type. Needs to be one of: 0, 1, 2");
                    }
                }

                if (!(validData.keys instanceof Array)) {
                    throw attributeErrorMsg(url, attribute, "Invalid keys. Needs to be an array");
                }

                if (attribute.options.type.length > 1) {
                    if (validData.keys.length !== 0 && validData.keys.length !== attribute.options.type.length) {
                        throw attributeErrorMsg(url, attribute, 'Invalid keys. Needs to be an array of ' + attribute.options.type.length + ' arrays');
                    } else {
                        for (let i = 0, len = validData.keys.length; i < len; i++) {
                            if (!(validData.keys[i] instanceof Array)) {
                                throw attributeErrorMsg(url, attribute, 'Invalid keys. Needs to be an array of ' + len + ' arrays');
                            } else {
                                var len2 = validData.keys[i].length;
                                if (len2 % 2 !== 0)
                                    throw attributeErrorMsg(url, attribute, 'Invalid keys. Array must hold an even amount of numbers');

                                for (var j = 0; j < len2; j++) {
                                    if (typeof validData.keys[i][j] !== 'number')
                                        throw attributeErrorMsg(url, attribute, 'Invalid keys. Array values must be numbers');
                                }
                            }
                        }
                    }
                } else {
                    if (attribute.options.type.length === 1) {
                        if (validData.keys.length % 2 !== 0)
                            throw attributeErrorMsg(url, attribute, 'Invalid keys. Array must hold an even amount of numbers');

                        for (let i = 0, len = validData.keys.length; i < len; i++) {
                            if (typeof validData.keys[i] !== 'number')
                                throw attributeErrorMsg(url, attribute, 'Invalid keys. Array values must be numbers');
                        }
                    }
                }
            } else {
                attribute.defaultValue = {
                    type: 1,
                    keys: []
                };

                if (attribute.options.type.length === 1)
                    attribute.defaultValue.keys = [0, 0];
                else {
                    for (let i = 0; i < attribute.options.type.length; i++) {
                        attribute.defaultValue.keys.push([0, 0]);
                    }
                }
            }
        }
    };

    var validateScriptAttributes = function (url, data) {
        var hasErrors = false;
        var validated = {
            name: data.name,
            attributes: {},
            attributesOrder: []
        };

        data.values.forEach(function (attr) {
            try {
                // check if name is valid
                if (typeof attr.name !== 'string' || !attr.name) {
                    throw pc.string.format("Validation error in {0}: Missing attribute name", url);
                }

                if (attr.name.length > 128) {
                    throw pc.string.format(pc.string.format("Validation error in {0}: Attribute name exceeds 128 characters", url));
                }

                // check if type is valid
                if (typeof attr.type === 'undefined') {
                    throw attributeErrorMsg(url, attr, "Missing attribute type");
                }

                if (VALID_TYPES.indexOf(attr.type) < 0) {
                    throw attributeErrorMsg(url, attr, pc.string.format("{0} is not a valid attribute type", attr.type));
                }

                if (attr.options) {
                    if (attr.options.displayName) {
                        if (typeof attr.options.displayName !== 'string') {
                            throw attributeErrorMsg(url, attr, "Display name of attribute must be a string");
                        }

                        if (attr.options.displayName.length > 128) {
                            throw attributeErrorMsg(url, attr, "Display name of attribute cannot exceed 128 characters");
                        }
                    }

                    if (attr.options.description) {
                        if (typeof attr.options.description !== 'string') {
                            throw attributeErrorMsg(url, attr, "Description of attribute must be a string");
                        }

                        if (attr.options.description.length > 1024) {
                            throw attributeErrorMsg(url, attr, "Description of attribute cannot exceed 1024 characters");
                        }
                    }
                }

                // type-specific validations
                validators[attr.type](url, attr);

                if (validated.attributes[attr.name]) {
                    throw attributeErrorMsg(url, attr, 'Duplicate attribute');
                }

                validated.attributesOrder.push(attr.name);

                validated.attributes[attr.name] = {
                    name: attr.name,
                    displayName: attr.options && attr.options.displayName ? attr.options.displayName : attr.name,
                    description: attr.options ? attr.options.description : undefined,
                    defaultValue: attr.defaultValue,
                    value: attr.defaultValue,
                    type: attr.type,
                    options: attr.options ? {
                        // Only allowed options
                        max: attr.options.max,
                        min: attr.options.min,
                        step: attr.options.step,
                        type: attr.options.type,
                        decimalPrecision: attr.options.decimalPrecision,
                        enumerations: attr.options.enumerations,
                        curves: attr.options.curves,
                        color: attr.options.color
                    } : {}
                };
            } catch (e) {
                hasErrors = true;
                log.error(e);
            }
        });

        if (hasErrors) {
            editor.call('status:error', 'Error while parsing script attributes. Open browser console for details.');
            validated = null;
        }

        return validated;
    };

    // only allow scrpts from playcanvas, code.playcanvas.com and localhost:51000 to be parsed
    var REGEX_ALLOWED = new RegExp('^((http(s)?:\/\/)((code.playcanvas.com)|(localhost:51000)))|(' + config.url.api + ')');

    /**
     * Starts a web worker which scans the specified URL
     * for script attributes, then validates the result and passes it to
     * the success callback
     */
    editor.method('sourcefiles:scan', function (url, success) {
        if (!REGEX_ALLOWED.test(url)) {
            success({});
            return;
        }

        var worker = new Worker("/editor/scene/js/editor/sourcefiles/sourcefiles-attributes-parser.js");
        worker.postMessage({
            url: url
        });

        worker.onmessage = function (e) {
            if (e.data) {
                if (typeof e.data.error !== 'undefined') {
                    editor.call('status:error', pc.string.format("Could not parse {0} - {1}", url, e.data.error));
                } else {
                    var result = validateScriptAttributes(url, e.data);
                    if (result) {
                        success(result);
                    }
                }
            }
        };
    });
});
