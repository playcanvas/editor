import { Entity } from '../entity';
import { globals as api } from '../globals';
import { utils } from '../utils';

const fieldsCache: Record<string, any> = {};

function findReferencesInComponents(entity: Entity, refType: string) {
    const result: Record<string, any> = {};

    function addReference(entity: Entity, path: string, value: any) {
        if (!result[value]) {
            result[value] = [];
        }

        result[value].push({
            entityId: entity.get('resource_id'),
            path: path
        });
    }

    function handleScriptAttribute(entity: Entity, path: string, attributeDefinition: { array: any; }, attributeValue: any[]) {
        if (!attributeValue) return;
        if (attributeDefinition.array) {
            attributeValue.forEach((id, i) => {
                if (id) {
                    addReference(entity, `${path}.${i}`, id);
                }
            });
        } else {
            if (attributeValue) {
                addReference(entity, path, attributeValue);
            }
        }
    }

    function handleReference(entity: Entity, path: string) {
        const value = entity.get(path);
        if (!value) return;
        if (Array.isArray(value)) {
            value.forEach((id, i) => {
                if (id) {
                    addReference(entity, `${path}.${i}`, id);
                }
            });
        } else {
            addReference(entity, path, value);
        }
    }

    entity.depthFirst((entity: Entity) => {
        const componentNames = Object.keys(entity.get('components') || {});
        componentNames.forEach((component) => {
            if (!fieldsCache[refType]) {
                fieldsCache[refType] = {};
            }
            if (!fieldsCache[refType][component]) {
                fieldsCache[refType][component] = api.schema.components.getFieldsOfType(component, refType);
            }

            fieldsCache[refType][component].forEach((field: any) => {
                // expand path will handle paths that contain '*'
                utils.expandPath(entity, `components.${component}.${field}`, (entity, path) => {
                    handleReference(entity, path);
                });
            });

            // get script attributes
            if (!api.hasLegacyScripts && api.assets && component === 'script') {
                const scriptComponent = entity.get('components.script');
                for (const scriptName in scriptComponent.scripts) {
                    // get script asset
                    const scriptAsset = api.assets.getAssetForScript(scriptName);
                    if (!scriptAsset) continue;

                    // go through the script component attribute values
                    for (const attributeName in scriptComponent.scripts[scriptName].attributes) {
                        const attributeValue = scriptComponent.scripts[scriptName].attributes[attributeName];
                        // early out if the value is null
                        if (!attributeValue || (Array.isArray(attributeValue) && !attributeValue.length)) continue;

                        const attributeDef = scriptAsset.get(`data.scripts.${scriptName}.attributes.${attributeName}`);
                        if (!attributeDef) continue;

                        const componentAttributePath = `components.script.scripts.${scriptName}.attributes.${attributeName}`;

                        if (attributeDef.type === 'json') {
                            if (!Array.isArray(attributeDef.schema)) continue;

                            if (attributeDef.array) {
                                for (let i = 0; i < attributeValue.length; i++) {
                                    attributeDef.schema.forEach((field: any) => {
                                        if (field.type !== refType) return;

                                        handleScriptAttribute(entity, `${componentAttributePath}.${i}.${field.name}`, field, attributeValue[i]?.[field.name]);
                                    });
                                }
                            } else {
                                attributeDef.schema.forEach((field: any) => {
                                    if (field.type !== refType) return;

                                    handleScriptAttribute(entity, `${componentAttributePath}.${field.name}`, field, attributeValue[field.name]);
                                });
                            }
                        } else if (attributeDef.type === refType) {
                            handleScriptAttribute(entity, componentAttributePath, attributeDef, attributeValue);
                        }
                    }
                }
            }
        });
    });

    return result;


}


/**
 * Return a map of all entity reference properties in the graph. This will
 * include references of the entity and also references of its children
 *
 * @param entity - The entity
 * @returns The entity references
 */
function findEntityReferencesInComponents(entity: Entity) {
    return findReferencesInComponents(entity, 'entity');
}

/**
 * Return a map of all asset reference properties in the graph.
 *
 * @param entity - The entity
 * @returns The asset references
 */
function findAssetReferencesInComponents(entity: Entity) {
    return findReferencesInComponents(entity, 'asset');
}

/**
 * Updates references to the old value to point to the new value
 *
 * @param references - A map of references that we got
 * from findEntityReferencesInComponents or findAssetReferencesInComponents.
 * @param oldValue - The value that we want to replace
 * @param newValue - The value that we want our references to point to
 */
function updateReferences(references: Record<string, any>, oldValue: string | number, newValue: string | number) {
    const referencesToEntity = references[oldValue];
    if (!referencesToEntity) return;

    referencesToEntity.forEach((reference: { entityId: string; path: any; }) => {
        const entity = api.entities.get(reference.entityId);
        if (entity && entity.has(reference.path)) {
            const history = entity.history.enabled;
            entity.history.enabled = false;
            entity.set(reference.path, newValue);
            entity.history.enabled = history;
        }
    });
}


export {
    findEntityReferencesInComponents,
    findAssetReferencesInComponents,
    updateReferences
};
