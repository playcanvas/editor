editor.once('load', function () {
    'use strict';

    var componentSchema = config.schema.scene.entities.$of.components;

    function appendScriptAttribute(attribute, attributeName, section) {
        // if id and mergeId fields exist then this is probably
        // the data of a script attribute conflict, otherwise
        // this is probably a JSON script attribute
        if (attribute.id && attribute.mergeId) {
            section.appendField({
                name: attributeName,
                baseType: attribute.baseType,
                sourceType: attribute.srcType,
                destType: attribute.dstType,
                conflict: attribute
            });
        } else {
            // get deeper into the attribute
            for (const key in attribute) {
                if (!attribute[key]) continue;

                appendScriptAttribute(attribute[key], `${attributeName}.${key}`, section);
            }
        }

    }

    // Shows conflicts for a scene
    editor.method('picker:conflictManager:showSceneConflicts', function (parent, conflicts, mergeObject) {
        // create resolver
        var resolver = new ui.ConflictResolver(conflicts, mergeObject);

        // Build index of conflicts so that the conflicts become
        // a hierarchical object
        var index = {};
        for (let i = 0, len = conflicts.data.length; i < len; i++) {
            var conflict = conflicts.data[i];
            // check if the whole scene has changed (e.g. deleted in one branch)
            if (conflict.path === '') {
                index = conflict;
                break;
            }

            var parts = conflict.path.split('.');
            var plen = parts.length;
            var target = index;

            for (var p = 0; p < plen - 1; p++) {
                if (! target.hasOwnProperty(parts[p])) {
                    target[parts[p]] = {};
                }
                target = target[parts[p]];
            }

            target[parts[plen - 1]] = conflict;
        }

        // Check if the whole scene has been deleted in one branch
        if (index.missingInDst || index.missingInSrc) {
            var sectionScene = resolver.createSection(conflicts.itemName);
            sectionScene.appendField({
                type: 'object',
                conflict: index
            });

            resolver.appendToParent(parent);
            return resolver;
        }

        // Scene properties
        var sectionProperties = resolver.createSection('PROPERTIES');
        sectionProperties.appendAllFields({
            schema: 'scene',
            fields: index
        });

        // append scene settings
        if (index.settings) {
            for (const key in index.settings) {
                sectionProperties.appendAllFields({
                    schema: 'scene',
                    fields: index.settings[key]
                });
            }
        }

        // Entities
        if (index.entities) {
            resolver.createSeparator('ENTITIES');

            // for diffs it's more likely that we are going to have a large
            // number of entities so cloak sections that are out of view if we have a lot
            // of entities to improve DOM performance
            var allowSectionCloaking = false;
            if (resolver.isDiff) {
                var numEntities = Object.keys(index.entities).length;
                allowSectionCloaking = numEntities > 50;
            }

            for (const key in index.entities) {
                // create title for entity section
                var entityName = resolver.srcEntityIndex[key] || resolver.dstEntityIndex[key];
                if (entityName) {
                    entityName = "'" + entityName + "' - " + key;
                } else {
                    entityName = key;
                }

                // create entity section
                var sectionEntity = resolver.createSection(entityName, true, allowSectionCloaking);
                var entity = index.entities[key];

                // append entity properties
                sectionEntity.appendAllFields({
                    schema: 'scene',
                    fields: entity,
                    title: 'ENTITY PROPERTIES'
                });

                // Components
                if (entity.components) {
                    for (const component in componentSchema) {
                        if (! entity.components.hasOwnProperty(component)) continue;
                        sectionEntity.appendTitle(component.toUpperCase() + ' COMPONENT');

                        // handle script component so that script attributes appear
                        // after the rest of the component properties
                        if (component === 'script') {
                            sectionEntity.appendAllFields({
                                schema: 'scene',
                                fields: entity.components[component],
                                except: ['scripts']
                            });

                            // add script attributes after
                            var scripts = entity.components.script.scripts;
                            if (scripts) {
                                for (const scriptName in scripts) {
                                    if (! scripts[scriptName]) continue;

                                    sectionEntity.appendTitle(`script: '${scriptName}'`, true);

                                    // check if script was deleted in one of the branches
                                    if (scripts[scriptName].missingInSrc || scripts[scriptName].missingInDst) {
                                        sectionEntity.appendField({
                                            type: editor.call('schema:scene:getType', scripts[scriptName].path),
                                            conflict: scripts[scriptName]
                                        });
                                        continue;
                                    }

                                    // append all fields for that specific script instance
                                    // except script attributes which are done after
                                    sectionEntity.appendAllFields({
                                        schema: 'scene',
                                        fields: scripts[scriptName],
                                        except: ['attributes']
                                    });

                                    var attributes = scripts[scriptName].attributes;
                                    if (! attributes) continue;

                                    for (const attributeName in attributes) {
                                        var attribute = attributes[attributeName];
                                        if (! attribute) continue;

                                        appendScriptAttribute(attribute, attributeName, sectionEntity);
                                    }
                                }
                            }
                        } else if (component === 'sound') {
                            // handle sound component so that sound slots appear after the rest of the component properties
                            sectionEntity.appendAllFields({
                                schema: 'scene',
                                fields: entity.components[component],
                                except: ['slots']
                            });

                            var slots = entity.components.sound.slots;
                            if (slots) {
                                for (const key in slots) {
                                    sectionEntity.appendTitle('SOUND SLOT ' + key, true);
                                    sectionEntity.appendAllFields({
                                        schema: 'scene',
                                        fields: slots[key]
                                    });
                                }
                            }
                        } else if (component === 'sprite') {
                            // handle sprite component so that clips appear after the rest of the component properties
                            sectionEntity.appendAllFields({
                                schema: 'scene',
                                fields: entity.components[component],
                                except: ['clips']
                            });

                            var clips = entity.components.sprite.clips;
                            if (clips) {
                                for (const key in clips) {
                                    sectionEntity.appendTitle('CLIP ' + key, true);
                                    sectionEntity.appendAllFields({
                                        schema: 'scene',
                                        fields: clips[key]
                                    });
                                }
                            }
                        } else if (component === 'model') {
                            // handle all model properties except mapping
                            sectionEntity.appendAllFields({
                                schema: 'scene',
                                fields: entity.components[component],
                                except: ['mapping']
                            });

                            // handle mapping
                            var mapping = entity.components.model.mapping;
                            if (mapping) {
                                for (const key in mapping) {
                                    sectionEntity.appendTitle('ENTITY MATERIAL ' + key, true);

                                    sectionEntity.appendField({
                                        name: 'Material',
                                        type: editor.call('schema:scene:getType', mapping[key].path),
                                        conflict: mapping[key]
                                    });
                                }
                            }
                        } else if (component === 'anim') {
                            sectionEntity.appendAllFields({
                                schema: 'scene',
                                fields: entity.components[component],
                                except: ['animationAssets']
                            });

                            const animAssets = entity.components.anim.animationAssets;
                            if (animAssets && Object.keys(animAssets).length) {
                                sectionEntity.appendTitle('Animation Assets');
                                for (const key in animAssets) {
                                    if (animAssets[key].asset) {
                                        sectionEntity.appendField({
                                            name: key,
                                            type: 'asset',
                                            conflict: animAssets[key].asset
                                        });
                                    } else {
                                        sectionEntity.appendField({
                                            name: key,
                                            type: 'object',
                                            conflict: animAssets[key]
                                        });
                                    }
                                }
                            }
                        } else {
                            // add component fields
                            sectionEntity.appendAllFields({
                                schema: 'scene',
                                fields: entity.components[component]
                            });
                        }
                    }
                }

            }
        }

        resolver.appendToParent(parent);

        return resolver;
    });
});
