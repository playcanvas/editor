editor.once('load', function () {
    'use strict';

    var componentSchema = editor.call('components:schema');

    var schema = {
        name: 'string',
        entities: {
            '*': {
                name: 'string',
                position: 'vec3',
                rotation: 'vec3',
                scale: 'vec3',
                tags: 'array:string',
                components: {
                    script: {
                        order: 'array:string',
                        scripts: {
                            '*': {
                                attributes: {

                                }
                            }
                        }
                    },
                    model: {
                        asset: 'asset'
                    },
                    animation: {
                        assets: 'array:asset'
                    },
                    button: {
                        imageEntity: 'entity'
                    },
                    light: {
                        color: 'rgb',
                        cookieOffset: 'vec2'
                    },
                    sound: {
                        volume: 'number',
                        slots: {
                            '*': {
                                name: 'string'
                            }
                        }
                    },
                    sprite: {
                        type: 'string',
                        clips: {
                            '*': {
                                name: 'string'
                            }
                        }
                    }
                }
            }
        }
    };

    var getType = function (path) {
        var parts = path.split('.');
        var target = schema;
        for (var p = 0; p < parts.length - 1; p++) {
            target = target[parts[p]] || target['*'];
            if (! target) {
                break;
            }
        }

        var result = target && target[parts[parts.length - 1]];
        if (! result) {
            console.warn('Unknown type for ' + path);
            result = 'string';
        }

        return result;
    };

    var appendFieldsToSection = function (fields, section, title, except) {
        var addedTitle = false;
        for (var field in fields)  {
            if (except && except.indexOf(field) !== -1) continue;

            var path = fields[field].path;
            if (! path) continue;

            if (! addedTitle && title) {
                addedTitle = true;
                section.appendTitle(title);
            }

            section.appendField({
                name: field,
                type: getType(path),
                conflict: fields[field],
                prettify: true
            });
        }
    };

    editor.method('picker:conflictManager:showSceneConflicts', function (parent, conflicts, mergeObject) {
        var resolver = new ui.ConflictResolver(conflicts, mergeObject);

        var index = {};

        // Build index of conflicts so that the conflicts become
        // a hierarchical object
        for (var i = 0, len = conflicts.data.length; i < len; i++) {
            var conflict = conflicts.data[i];
            var parts = conflict.path.split('.');
            var target = index;

            for (var p = 0; p < parts.length - 1; p++) {
                if (! target.hasOwnProperty(parts[p])) {
                    target[parts[p]] = {};
                }
                target = target[parts[p]];
            }

            target[parts[parts.length - 1]] = conflict;
        }

        // Scene properties
        var sectionProperties = resolver.createSection('PROPERTIES');
        appendFieldsToSection(index, sectionProperties);

        // Entities
        if (index.entities) {
            resolver.createSeparator('ENTITIES');
            for (var key in index.entities) {
                var sectionEntity = resolver.createSection(key, true);
                var entity = index.entities[key];

                appendFieldsToSection(entity, sectionEntity, 'ENTITY PROPERTIES');

                // Components
                if (entity.components) {
                    for (var component in componentSchema) {
                        if (! entity.components.hasOwnProperty(component)) continue;
                        sectionEntity.appendTitle(component.toUpperCase() + ' COMPONENT');

                        // handle script component so that script attributes appear
                        // after the rest of the component properties
                        if (component === 'script') {
                            appendFieldsToSection(entity.components[component], sectionEntity, null, ['scripts']);

                            // add script attributes after
                            var scripts = entity.components.script.scripts;
                            if (scripts) {
                                for (var scriptName in scripts) {
                                    var addedTitle = false;

                                    if (! scripts[scriptName]) continue;

                                    var attributes = scripts[scriptName].attributes;
                                    if (! attributes) continue;

                                    for (var attributeName in attributes) {
                                        var attribute = attributes[attributeName];
                                        if (! attribute) continue;

                                        if (! addedTitle) {
                                            sectionEntity.appendTitle(scriptName, true);
                                            addedTitle = true;
                                        }

                                        sectionEntity.appendField({
                                            name: attributeName,
                                            baseType: attribute.baseType,
                                            sourceType: attribute.srcType,
                                            destType: attribute.dstType,
                                            conflict: attribute
                                        });
                                    }
                                }
                            }
                        } else if (component === 'sound') {
                            // handle sound component so that sound slots appear after the rest of the component properties
                            appendFieldsToSection(entity.components[component], sectionEntity, null, ['slots']);

                            var slots = entity.components.sound.slots;
                            if (slots) {
                                for (var key in slots) {
                                    sectionEntity.appendTitle('SOUND SLOT ' + key, true);
                                    appendFieldsToSection(slots[key], sectionEntity);
                                }
                            }
                        } else if (component === 'sprite') {
                            // handle sprite component so that clips appear after the rest of the component properties
                            appendFieldsToSection(entity.components[component], sectionEntity, null, ['clips']);

                            var clips = entity.components.sprite.clips;
                            if (clips) {
                                for (var key in clips) {
                                    sectionEntity.appendTitle('CLIP ' + key, true);
                                    appendFieldsToSection(clips[key], sectionEntity);
                                }
                            }
                        } else {
                            // add component fields
                            appendFieldsToSection(entity.components[component], sectionEntity);
                        }
                    }
                }

            }
        }

        resolver.appendToParent(parent);

        return resolver;
    });
});
