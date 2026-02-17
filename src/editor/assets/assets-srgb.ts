import type { Observer } from '@playcanvas/observer';

import { formatter as f } from '@/common/utils';


const SRGB_PATH_MAP = {
    texture: {
        'data.srgb': true
    },
    material: {
        'data.aoMap': false,
        'data.diffuseMap': true,
        'data.anisotropyMap': false,
        'data.specularMap': true,
        'data.specularityFactorMap': false,
        'data.emissiveMap': true,
        'data.normalMap': false,
        'data.heightMap': false,
        'data.lightMap': false,
        'data.metalnessMap': false,
        'data.glossMap': false,
        'data.clearCoatMap': false,
        'data.clearCoatGlossMap': false,
        'data.clearCoatNormalMap': false,
        'data.sheenMap': true,
        'data.sheenGlossMap': false,
        'data.refractionMap': false,
        'data.thicknessMap': false,
        'data.iridescenceMap': false,
        'data.iridescenceThicknessMap': false
    },
    entity: {
        'components.particlesystem.colorMapAsset': true,
        'components.particlesystem.normalMapAsset': false,
        'components.element.textureAsset': true,
        'components.element.spriteAsset': true,
        'components.element.maskAsset': true,
        'components.sprite.spriteAsset': true
    }
};

const SPRITE_PATHS = [
    'components.element.spriteAsset',
    'components.sprite.spriteAsset'
];

const MATERIAL_PATH_CHANNEL_MAP = Object.keys(SRGB_PATH_MAP.material).reduce((map, path) => {
    map.set(`${path}Channel`, path);
    return map;
}, new Map());

type TextureUsage = {
    /** The srgb flag for the texture usage */
    srgb: boolean;
    /** The id of the entity or asset that references the texture */
    id: string;
    /** The type of the entity or asset that references the texture */
    type: string;
    /** The path of the property that references the texture */
    path: string;
    /** A function to jump to the entity or asset that references the texture */
    jump: () => void;
};

/**
 * This function checks for srgb conflicts for texture srgb flags based on their usage in
 * entities and assets and logs a warning if any are found. On load it checks all assets and
 * entities and determines the srgb flag based on the majority of references.
 */
const startChecker = () => {

    /**
     * A map of texture asset ids to their usages
     */
    const textureUsages = new Map<number, TextureUsage[]>();

    /**
     * A map of texture asset ids that need to be autofixed their error status
     */
    const textureFixes = new Set<number>();

    /**
     * A set of texture asset ids that have conflicts
     */
    const textureConflicts = new Set<number>();

    /**
     * A set of textures with srgb flag enforced
     */
    const textureEnforce = new Set<number>();

    /**
     * Find the references to an asset and check if the srgb flag is set correctly
     *
     * @param asset - The asset to check for usage flag
     * @returns The list of references for the asset
     */
    const findUsages = (asset: Observer): TextureUsage[] => {
        const used = editor.call('assets:used:index');
        const assetId = asset.get('id');
        const assetUsed = used[assetId];

        const usages: TextureUsage[] = [];

        if (!assetUsed) {
            return usages;
        }

        for (const id in assetUsed.ref) {
            const ref = assetUsed.ref[id];
            for (let i = 0; i < ref.length; i++) {
                const { owner } = ref[i];
                if (!owner || owner === editor) {
                    continue;
                }

                switch (ref.type) {
                    case 'entity': {
                        const entity = owner;
                        for (const path in SRGB_PATH_MAP.entity) {
                            if (entity.get(path) !== assetId) {
                                continue;
                            }

                            usages.push({
                                srgb: SRGB_PATH_MAP.entity[path],
                                id: entity.get('resource_id'),
                                type: 'entity',
                                path,
                                jump: () => {
                                    editor.call('selector:set', 'entity', [entity]);
                                }
                            });

                        }
                        continue;
                    }
                    case 'asset': {
                        const asset = owner;
                        switch (asset.get('type')) {
                            case 'material': {
                                for (const path in SRGB_PATH_MAP.material) {
                                    if (asset.get(path) !== assetId) {
                                        continue;
                                    }

                                    // Skip if the map channel has only alpha
                                    // NOTE: Can be set to any swizzled rgba channel but only at runtime
                                    if (asset.get(`${path}Channel`) === 'a') {
                                        continue;
                                    }

                                    // Skip if metalness is enabled for specular map
                                    if (asset.get('data.useMetalness') && path === 'data.specularMap') {
                                        continue;
                                    }

                                    // Skip if sheen is disabled for sheen map and sheen gloss map
                                    if (!asset.get('data.useSheen') && (path === 'data.sheenMap' || path === 'data.sheenGlossMap')) {
                                        continue;
                                    }

                                    usages.push({
                                        srgb: SRGB_PATH_MAP.material[path],
                                        id: asset.get('id'),
                                        type: 'asset',
                                        path,
                                        jump: () => {
                                            editor.call('selector:set', 'asset', [asset]);
                                        }
                                    });
                                }
                                continue;
                            }
                            case 'sprite': {
                                // Push all sprite usages
                                usages.push(...findUsages(asset));
                                continue;
                            }
                        }
                        continue;
                    }
                }
            }
        }

        return usages;
    };

    /**
     * Set the srgb flag for a texture asset based on its usage
     *
     * @param asset - The texture asset to migrate
     */
    const setSrgb = (asset: Observer) => {
        const updateAsset = () => {
            // Ensure data object exists
            if (!asset.get('data')) {
                asset.set('data', {});
            }

            // Set srgb false if the texture is rgbm
            if (asset.get('data.rgbm')) {
                asset.set('data.srgb', false);
                const msg = [
                    `The ${f.asset(asset)} asset is using RGBM encoding.`,
                    'sRGB was set to false'
                ].join(' ');
                editor.call('console:log:asset', asset, msg);
                return;
            }

            // Set srgb false if format is exr or hdr
            const format = asset.get('meta.format');
            if (format === 'exr' || format === 'hdr') {
                asset.set('data.srgb', false);
                const msg = [
                    `The ${f.asset(asset)} asset is using ${format.toUpperCase()} format.`,
                    'sRGB was set to false'
                ].join(' ');
                editor.call('console:log:asset', asset, msg);
                return;
            }

            // If the texture is not used anywhere, set srgb to true
            const srgbRefs = textureUsages.get(asset.get('id'));
            if (!srgbRefs?.length) {
                asset.set('data.srgb', true);
                const msg = [
                    `The ${f.asset(asset)} asset is not referenced.`,
                    'sRGB was set to true'
                ].join(' ');
                editor.call('console:log:asset', asset, msg);
                return;
            }

            // If the asset has one srgb reference set the srgb flag to that reference
            if (srgbRefs.length === 1) {
                asset.set('data.srgb', srgbRefs[0].srgb);
                const msg = [
                    `The ${f.asset(asset)} asset has a single reference.`,
                    `sRGB was set to ${srgbRefs[0].srgb}`
                ].join(' ');
                editor.call('console:log:asset', asset, msg);
                return;
            }

            // If the asset has multiple srgb references, set the srgb flag to the majority
            const srgb = srgbRefs.filter(r => r.srgb).length > srgbRefs.length / 2;
            asset.set('data.srgb', srgb);
            const msg = [
                `The ${f.asset(asset)} asset has multiple references with conflicting sRGB flags.`,
                `sRGB was set to ${srgb}`
            ].join(' ');
            editor.call('console:log:asset', asset, msg);
        };

        asset.history.enabled = false;
        updateAsset();
        asset.history.enabled = true;
    };

    /**
     * Check for texture usages in assets and entities
     *
     * @param asset - The asset to check for texture usages
     */
    const checkTextureUsage = (asset: Observer) => {
        const assetId = asset.get('id');

        // find all usages of the texture asset
        const usages = findUsages(asset);
        textureUsages.set(assetId, usages);

        // if no srgb flag set, set it
        if (!asset.has('data.srgb')) {
            setSrgb(asset);
        }
        const srgb = asset.get('data.srgb');

        // find all issues
        const issues = [];
        for (const usage of usages) {
            if (usage.srgb === srgb) {
                continue;
            }
            issues.push(usage);
        }

        // if no issues, remove from fixes and conflicts
        if (!issues.length) {
            textureFixes.delete(assetId);
            textureConflicts.delete(assetId);
            textureEnforce.delete(assetId);
            return;
        }

        let enforce = 0;
        let suppressed = 0;
        for (const usage of issues) {
            const observer = usage.type === 'entity' ? editor.call('entities:get', usage.id) : editor.call('assets:get', usage.id);
            if (!observer) {
                console.warn(`Could not find ${usage.type} with id ${usage.id}`);
                continue;
            }
            const name = usage.type === 'entity' ? f.entity(observer) : f.asset(observer);
            const msg = [
                `The ${f.asset(asset)} has sRGB set to ${srgb}.`,
                `The ${f.path(usage.path)} property from ${name} requires sRGB to be ${usage.srgb}`
            ].join(' ');
            const [uiMsg, verboseMsg] = f.parse(msg);

            const isMaterial = usage.type === 'asset' && observer.get('type') === 'material';
            const isUIElement = usage.path.includes('components.element');
            const isSprite = usage.path.includes('components.sprite');
            const isSpecularSheen = usage.path === 'data.specularMap' || usage.path === 'data.sheenMap';

            // if project is using engine v1 and the usage is a specular or sheen map
            // suppress the issue and log info message
            if (!editor.projectEngineV2 && isSpecularSheen) {
                editor.call('console:log', uiMsg, verboseMsg, usage.jump);
                suppressed++;
                continue;
            }

            // if all issues are usages then fixable so log a warning
            if (issues.length === usages.length) {
                editor.call('console:warn', uiMsg, verboseMsg, usage.jump);
                continue;
            }

            // if uses StandardMaterial under the hood and srgb false suppress and log info message
            if (!srgb && (isMaterial || isUIElement || isSprite)) {
                editor.call('console:log', uiMsg, verboseMsg, usage.jump);
                suppressed++;
                continue;
            }

            // otherwise log an error
            editor.call('console:error', uiMsg, verboseMsg, usage.jump);
            enforce++;
        }

        // If any issues are enforced, add to enforce list
        if (enforce > 0) {
            textureEnforce.add(assetId);
        } else {
            textureEnforce.delete(assetId);
        }

        // If all issues are suppressed, remove from fixes and conflicts
        if (suppressed === issues.length) {
            textureFixes.delete(assetId);
            textureConflicts.delete(assetId);
            return;
        }

        // if all issues are fixable, add to fixes
        if (issues.length === usages.length) {
            textureFixes.add(assetId);
            textureConflicts.delete(assetId);
            return;
        }

        // Otherwise, add to conflicts
        textureConflicts.add(assetId);
        textureFixes.delete(assetId);
    };

    /**
     * Update the audit button based on the number of texture issues
     */
    const updateAuditButton = () => {
        editor.emit('assets:auditor:issues', textureFixes.size + textureConflicts.size, textureEnforce.size);
    };

    /**
     * Check for texture usages in assets
     *
     * @param asset - The asset to check for texture usages
     */
    const checkAsset = (asset: Observer) => {
        switch (asset.get('type')) {
            case 'texture':
            case 'textureatlas': {
                checkTextureUsage(asset);

                // listen for changes to the srgb flag
                asset.on('*:set', (path) => {
                    if (!SRGB_PATH_MAP.texture.hasOwnProperty(path)) {
                        return;
                    }

                    // Defer the check to ensure the srgb flag is set
                    setTimeout(() => {
                        checkTextureUsage(asset);
                        updateAuditButton();
                    });
                });
                break;
            }
            case 'sprite': {
                // listen for changes to sprite assets
                asset.on('*:set', (path, value, oldValue) => {
                    if (path === 'data.textureAtlasAsset') {
                        const textureAtlasAsset = editor.call('assets:get', value || oldValue);
                        if (!textureAtlasAsset) {
                            return;
                        }

                        checkTextureUsage(textureAtlasAsset);
                        updateAuditButton();
                    }
                });
                break;
            }
            case 'material': {
                // listen for changes to material assets
                asset.on('*:set', (path, value, oldValue) => {
                    if (SRGB_PATH_MAP.material.hasOwnProperty(path)) {
                        const textureAsset = editor.call('assets:get', value || oldValue);
                        if (!textureAsset) {
                            return;
                        }

                        checkTextureUsage(textureAsset);
                        updateAuditButton();
                        return;
                    }

                    // Need to also check for channel map changes to ignore map channels that only have
                    // alpha
                    if (MATERIAL_PATH_CHANNEL_MAP.has(path)) {
                        const textureAssetId = asset.get(MATERIAL_PATH_CHANNEL_MAP.get(path));
                        const textureAsset = editor.call('assets:get', textureAssetId);
                        if (!textureAsset) {
                            return;
                        }

                        checkTextureUsage(textureAsset);
                        updateAuditButton();
                        return;
                    }

                    // Need to also check for useMetalness changes to ignore metalness for specular map
                    if (path === 'data.useMetalness') {
                        const textureAssetId = asset.get('data.specularMap');
                        const textureAsset = editor.call('assets:get', textureAssetId);
                        if (!textureAsset) {
                            return;
                        }

                        checkTextureUsage(textureAsset);
                        updateAuditButton();
                    }

                    // Need to also check for useSheen changes to ignore sheen for sheen map and sheen gloss map
                    if (path === 'data.useSheen') {
                        // Check sheen map
                        const textureAssetId = asset.get('data.sheenMap');
                        const textureAsset = editor.call('assets:get', textureAssetId);
                        if (textureAsset) {
                            checkTextureUsage(textureAsset);
                        }

                        // Check sheen gloss map
                        const glossTextureAssetId = asset.get('data.sheenGlossMap');
                        const glossTextureAsset = editor.call('assets:get', glossTextureAssetId);
                        if (glossTextureAsset) {
                            checkTextureUsage(glossTextureAsset);
                        }

                        updateAuditButton();
                    }

                });
                break;
            }
        }
    };

    /**
     * Check for texture usages in entities
     *
     * @param entity - The entity to check for texture usages
     */
    const checkEntity = (entity: Observer) => {
        // listen for changes to entities
        entity.on('*:set', (path, value, oldValue) => {
            if (!SRGB_PATH_MAP.entity.hasOwnProperty(path)) {
                return;
            }

            const asset = editor.call('assets:get', value || oldValue);
            if (!asset) {
                return;
            }

            // Check if the asset is a sprite asset
            if (SPRITE_PATHS.includes(path)) {
                const textureAtlasAsset = editor.call('assets:get', asset.get('data.textureAtlasAsset'));
                if (!textureAtlasAsset) {
                    return;
                }
                checkTextureUsage(textureAtlasAsset);
            } else {
                checkTextureUsage(asset);
            }

            updateAuditButton();
        });
    };

    /**
     * Get all the fixes and conflicts for setting the srgb flag for textures
     */
    editor.method('assets:srgb:issues', () => {
        return {
            fixes: new Set(textureFixes.keys()),
            conflicts: textureConflicts
        };
    });

    /**
     * Apply srgb autofix to all textures
     */
    editor.on('assets:srgb:fixes:apply', () => {
        const previous = new Map();

        const undo = () => {
            for (const [id, { srgb, enforced }] of previous) {
                const asset = editor.call('assets:get', id);
                if (!asset) {
                    continue;
                }

                // revert srgb flag
                asset.set('data.srgb', srgb, true);

                // add back to enforce list
                if (enforced) {
                    textureEnforce.add(id);
                }

                // add back to fix list
                textureFixes.add(id);
            }
            previous.clear();
        };

        const redo = () => {
            for (const id of textureFixes) {
                const asset = editor.call('assets:get', id);
                if (!asset) {
                    continue;
                }

                // store previous srgb flag and enforced flag
                const srgb = asset.get('data.srgb');
                const enforced = textureEnforce.has(id);
                previous.set(id, { srgb, enforced });

                // set srgb flag
                setSrgb(asset);

                // remove from enforce list
                textureEnforce.delete(id);
            }
            textureFixes.clear();
        };

        editor.api.globals.history.add({
            name: 'srgb fixes apply',
            combine: false,
            undo,
            redo
        });

        redo();
    });

    // check all loaded assets and entities
    editor.call('assets:list').forEach(checkAsset);
    editor.call('entities:list').forEach(checkEntity);
    updateAuditButton();

    // subscribe to add and remove
    editor.on('assets:add', checkAsset);
    editor.on('assets:remove', (asset) => {
        const assetId = asset.get('id');
        textureUsages.delete(assetId);
        textureFixes.delete(assetId);
        textureConflicts.delete(assetId);
        textureEnforce.delete(assetId);
        updateAuditButton();
    });
    editor.on('entities:add', checkEntity);
};

editor.once('entities:load', () => {
    editor.once('assets:load', () => {
        startChecker();
    });
});
