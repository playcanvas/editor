import { Entity } from '../entity';
import { globals as api } from '../globals';

let ASSET_PATHS: string[] = null;
const REGEX_CONTAINS_STAR = /\.\*\./;

/**
 * Stores asset paths in the assets dictionary by converting the array of
 * folder ids to an array of folder names.
 *
 * @param assetIds - The asset ids
 * @param assets - The assets dictionary
 */
function storeAssetPaths(assetIds: number[], assets: Record<number, any>) {
    if (!Array.isArray(assetIds)) {
        assetIds = [assetIds];
    }

    for (let i = 0; i < assetIds.length; i++) {
        const assetId = assetIds[i];
        if (!assetId || assets[assetId]) continue;

        const asset = api.assets.get(assetId);
        if (!asset) return;

        const parts = [];

        const path = asset.get('path');
        if (path && path.length) {
            for (let j = 0; j < path.length; j++) {
                const a = api.assets.get(path[j]);
                if (!a) continue;

                parts.push(a.get('name'));
            }
        }

        parts.push(asset.get('name'));

        assets[assetId] = {
            path: parts,
            type: asset.get('type')
        };
    }
}

/**
 * Gathers all asset dependencies for this entity
 *
 * @param entity - The entity
 * @param data - The helper data
 */
function gatherDependencies(entity: Entity, data: Record<string, any>) {
    if (!ASSET_PATHS) {
        // get asset paths for all components
        ASSET_PATHS = [];
        api.schema.components.list().forEach((component) => {
            const paths = api.schema.components.getFieldsOfType(component, 'asset');
            paths.forEach((path) => {
                ASSET_PATHS.push(`components.${component}.${path}`);
            });
        });
    }

    // store entity json
    const resourceId = entity.get('resource_id');
    if (!data.hierarchy[resourceId]) {
        data.hierarchy[resourceId] = entity.json();
    }

    // gather all asset references from the entity
    // and store their path + name
    for (let i = 0; i < ASSET_PATHS.length; i++) {
        const path = ASSET_PATHS[i];

        // handle paths that contain a '*' as a wildcard
        if (REGEX_CONTAINS_STAR.test(path)) {
            const parts = path.split('.*.');
            if (!entity.has(parts[0])) continue;

            const obj = entity.get(parts[0]);
            if (!obj) continue;

            for (const key in obj) {
                const fullKey = `${parts[0]}.${key}.${parts[1]}`;
                if (!entity.has(fullKey)) {
                    continue;
                }

                const assets = entity.get(fullKey);
                if (!assets) continue;

                storeAssetPaths(assets, data.assets);
            }
        } else if (entity.has(path)) {
            // handle path without '*'
            const assets = entity.get(path);
            if (!assets) continue;

            storeAssetPaths(assets, data.assets);
        }
    }

    // gather script attributes
    if (entity.has('components.script.scripts')) {
        const scripts = entity.get('components.script.scripts');

        if (scripts) {
            // legacy scripts
            if (api.hasLegacyScripts) {
                for (let i = 0; i < scripts.length; i++) {
                    const script = scripts[i];
                    if (!script.attributes) continue;
                    for (const name in script.attributes) {
                        const attr = script.attributes[name];
                        if (!attr) continue;

                        if (attr.type === 'asset') {
                            if (attr.value) {
                                storeAssetPaths(attr.value, data.assets);
                            }

                            if (attr.defaultValue) {
                                storeAssetPaths(attr.defaultValue, data.assets);
                            }

                        }
                    }
                }
            } else {
                // scripts 2.0
                for (const key in scripts) {
                    const scriptData = scripts[key];
                    if (!scriptData || !scriptData.attributes) continue;

                    const asset = api.assets.getAssetForScript(key);
                    if (!asset) continue;

                    // search for asset script attributes in script asset
                    const assetData = asset.get(`data.scripts.${key}.attributes`);
                    if (!assetData) continue;

                    for (const name in assetData) {
                        const componentAttribute = scriptData.attributes[name];
                        if (!componentAttribute) continue;

                        if (assetData[name].type === 'asset') {
                            storeAssetPaths(componentAttribute, data.assets);
                        } else if (assetData[name].type === 'json') {
                            const schema = assetData[name].schema;
                            if (Array.isArray(schema)) {
                                for (let i = 0; i < schema.length; i++) {
                                    const field = schema[i];
                                    if (field.type === 'asset') {
                                        if (Array.isArray(componentAttribute)) {
                                            for (let j = 0; j < componentAttribute.length; j++) {
                                                if (componentAttribute[j] && componentAttribute[j][field.name]) {
                                                    storeAssetPaths(componentAttribute[j][field.name], data.assets);
                                                }
                                            }
                                        } else if (componentAttribute[field.name]) {
                                            storeAssetPaths(componentAttribute[field.name], data.assets);
                                        }
                                    }
                                }
                            }

                        }
                    }
                }
            }
        }
    }

    const children = entity.get('children');
    for (let i = 0; i < children.length; i++) {
        gatherDependencies(api.entities.get(children[i]), data);
    }
}

// Sorts entities by their index in their parent's children list
function sortEntities(entities: Entity[]) {
    entities.sort((a, b) => {
        let parentA = a.get('parent');
        if (!parentA) {
            return -1;
        }

        parentA = api.entities.get(parentA);
        if (!parentA) {
            return -1;
        }

        const indA = parentA.get('children').indexOf(a.get('resource_id'));

        let parentB = b.get('parent');
        if (!parentB) {
            return 1;
        }

        parentB = api.entities.get(parentB);
        if (!parentB) {
            return -1;
        }

        const indB = parentB.get('children').indexOf(b.get('resource_id'));

        return indA - indB;
    });
}

/**
 * Copy specified entities to localStorage clipboard. Can be used
 * to paste these entities later on.
 *
 * @param entities - The entities
 */
function copyEntities(entities: Entity[]) {
    const currentScene = api.realtime?.scenes?.current;
    if (!currentScene) throw new Error('No current scene loaded');

    const data: Record<string, any> = {
        project: api.projectId,
        scene: currentScene.uniqueId,
        branch: api.branchId,
        legacy_scripts: api.hasLegacyScripts,
        hierarchy: {},
        assets: {},
        type: 'entity'
    };

    // build index
    const selection: Record<string, Entity> = {};
    for (let i = 0; i < entities.length; i++) {
        selection[entities[i].get('resource_id')] = entities[i];
    }

    sortEntities(entities);

    for (let i = 0; i < entities.length; i++) {
        const e = entities[i];

        let p = e.parent;
        let isParentSelected = false;
        while (p) {
            if (selection[p.get('resource_id')]) {
                isParentSelected = true;
                break;
            }

            p = p.parent;
        }

        // if parent is also selected then skip child
        // and only add parent to copied entities
        if (isParentSelected) {
            // remove entity from selection
            // since its parent is selected
            delete selection[e.get('resource_id')];
            continue;
        }

        // add entity to clipboard if not already added as a child of
        // a higher level entity
        gatherDependencies(e, data);
    }

    for (const key in selection) {
        // set parent of each copied entity to null
        if (data.hierarchy[key]) {
            data.hierarchy[key].parent = null;
        }
    }

    // save to local storage
    api.clipboard.value = data;
}

export { copyEntities };
