import type { Observer } from '@playcanvas/observer';

import { deepEqual, formatter as f } from '@/common/utils';
import { LOAD_SCRIPT_AS_ASSET } from '@/core/constants';


const LEGACY_TINT_PROPERTIES = [
    ['data.diffuseMapTint', 'data.diffuseTint'],
    ['data.specularMapTint', 'data.specularTint'],
    ['data.emissiveMapTint', 'data.emissiveTint'],
    ['data.metalnessMapTint', 'data.metalnessTint']
];

const TINT_REMOVE_PATHS = [
    'data.ambientTint',
    'data.diffuseTint',
    'data.emissiveTint',
    'data.metalnessTint',
    'data.sheenTint',
    'data.sheenGlossTint'
];

editor.once('load', () => {
    const tintToDefault = TINT_REMOVE_PATHS.reduce((map, tintPath) => {
        const path = tintPath.replace(/Tint$/, '');
        const mapPath = tintPath.replace(/Tint$/, 'Map').replace('ambient', 'ao');
        map.set(tintPath, [path, mapPath]);
        return map;
    }, new Map());

    /**
     * This function removes tint flags from the material and if the tint flag is off, sets the
     * default color
     *
     * @param asset - The asset to migrate
     */
    const removeMaterialTintFlags = (asset: Observer) => {
        const resetNeutral = (path: string, defaultVal: any, tintPath: string) => {
            const oldVal = asset.get(path) ?? defaultVal;
            asset.set(path, defaultVal);
            if (!deepEqual(oldVal, defaultVal)) {
                return [
                    `. Setting property ${f.path(path)} from ${f.value(oldVal)} to neutral`,
                    `${f.value(defaultVal)} as ${f.path(tintPath)} was set to ${f.value(false)}`
                ].join(' ');
            }
            return '';
        };

        for (let i = 0; i < LEGACY_TINT_PROPERTIES.length; i++) {
            const [oldPath, newPath] = LEGACY_TINT_PROPERTIES[i];

            // check if the old tint path exists
            if (asset.has(oldPath)) {
                const oldVal = asset.get(oldPath);
                if (asset.has(newPath)) {
                    // if the new tint path exists, log a warning and remove the old tint path
                    const newVal = asset.get(newPath);
                    const msg = [
                        `The ${f.path(oldPath)} property of material ${f.asset(asset)} is no`,
                        `longer supported by the Editor and has been superseded by ${f.path(newPath)} set to ${f.value(newVal)}`
                    ].join(' ');
                    editor.call('console:log:asset', asset, msg);
                } else {
                    // if the new tint path does not exist, set the new tint path to the old value
                    asset.set(newPath, oldVal);
                    const msg = [
                        `The ${f.path(oldPath)} property of material ${f.asset(asset)} is no`,
                        `longer supported by the Editor and this has been switched to ${f.path(newPath)}`
                    ].join(' ');
                    editor.call('console:log:asset', asset, msg);
                }
                asset.unset(oldPath);
            }
        }

        for (let i = 0; i < TINT_REMOVE_PATHS.length; i++) {
            const tintPath = TINT_REMOVE_PATHS[i];

            // skip migration if tints set to true
            if (asset.get(tintPath)) {
                continue;
            }

            // set tint to always be true
            asset.set(tintPath, true);
            const [path, mapPath] = tintToDefault.get(tintPath);
            let msg = `The ${f.path(tintPath)} property is no longer exposed and the tint is always applied for ${f.asset(asset)}`;

            // if ambient tint is set to false reset the color to white
            if (path.includes('ambient')) {
                msg += resetNeutral(path, [1, 1, 1], tintPath);
                editor.call('console:log:asset', asset, msg);
                continue;
            }

            // if diffuse or emissive tint is set to false and the map is set reset the color to white
            if ((path.includes('diffuse') || path.includes('emissive')) && asset.get(mapPath)) {
                msg += resetNeutral(path, [1, 1, 1], tintPath);
                editor.call('console:log:asset', asset, msg);
                continue;
            }

            editor.call('console:log:asset', asset, msg);
        }
    };

    /**
     * Migration for material assets
     *
     * @param {Observer} asset - The material asset to migrate
     */
    const migrateMaterial = (asset) => {
        if (!asset.get('data')) {
            return;
        }

        if (!asset.has('data.useFog')) {
            asset.set('data.useFog', true);
        }

        if (!asset.has('data.useLighting')) {
            asset.set('data.useLighting', true);
        }

        if (!asset.has('data.useSkybox')) {
            asset.set('data.useSkybox', true);
        }

        // NOTE: useGammaTonemap is used by engine v1 so bind useTonemap to useGammaTonemap
        asset.on('data.useTonemap:set', (value) => {
            asset.set('data.useGammaTonemap', value);
        });

        if (asset.has('data.useGamma')) {
            const tonemap = asset.get('data.useGamma') ?? true;
            tonemap.write = true;
            asset.unset('data.useGamma');
            asset.set('data.useTonemap', tonemap.value);
            const msg = [
                `The ${f.path('data.useGamma')} properties of material ${f.asset(asset)} is`,
                `no longer supported by the Editor and this has been switched to ${f.path('data.useTonemap')}`
            ].join(' ');
            editor.call('console:log:asset', asset, msg);
        }

        if (!asset.get('data.cubeMapProjectionBox')) {
            asset.set('data.cubeMapProjectionBox', { center: [0, 0, 0], halfExtents: [0.5, 0.5, 0.5] });
        }

        if (!asset.has('data.alphaToCoverage')) {
            asset.set('data.alphaToCoverage', false);
        }

        if (!asset.has('data.opacityFadesSpecular')) {
            asset.set('data.opacityFadesSpecular', true);
        }

        if (!asset.has('data.alphaFade')) {
            asset.set('data.alphaFade', 1.0);
        }

        // migrate anisotropy to anisotropyIntensity and anisotropyRotation
        if (!asset.has('data.anisotropyIntensity') || !asset.has('data.anisotropyRotation')) {
            const anisotropy = asset.get('data.anisotropy') ?? 0;
            asset.set('data.anisotropyIntensity', Math.abs(anisotropy));
            asset.set('data.anisotropyRotation', anisotropy >= 0 ? 0 : 90);
            const msg = [
                `The ${f.path('data.anisotropy')} property of material ${f.asset(asset)} is no`,
                `longer supported by the Editor, and this has been switched to ${f.path('data.anisotropyIntensity')} and ${f.path('data.anisotropyRotation')}`
            ].join(' ');
            editor.call('console:log:asset', asset, msg);
        }

        // FIXME: bind the anisotropyIntensity and anisotropyRotation to anisotropy
        const anisotropyLegacyConvert = (intensity, rotation) => {
            return intensity * Math.sign(Math.cos(rotation * 2 * Math.PI / 180));
        };
        asset.on('data.anisotropyIntensity:set', (intensity) => {
            const rotation = asset.get('data.anisotropyRotation') ?? 0;
            asset.set('data.anisotropy', anisotropyLegacyConvert(intensity, rotation));
        });
        asset.on('data.anisotropyRotation:set', (rotation) => {
            const intensity = asset.get('data.anisotropyIntensity') ?? 0;
            asset.set('data.anisotropy', anisotropyLegacyConvert(intensity, rotation));
        });

        if (!asset.has('data.clearCoat')) {
            asset.set('data.clearCoat', 0.0);
        }

        if (!asset.has('data.clearCoatMap')) {
            asset.set('data.clearCoatMap', null);
        }

        if (!asset.has('data.clearCoatMapChannel')) {
            asset.set('data.clearCoatMapChannel', 'r');
        }

        if (!asset.has('data.clearCoatMapUv')) {
            asset.set('data.clearCoatMapUv', 0);
        }

        if (!asset.has('data.clearCoatMapTiling')) {
            asset.set('data.clearCoatMapTiling', [1, 1]);
        }

        if (!asset.has('data.clearCoatMapOffset')) {
            asset.set('data.clearCoatMapOffset', [0, 0]);
        }

        if (!asset.has('data.clearCoatVertexColor')) {
            asset.set('data.clearCoatVertexColor', false);
        }

        if (!asset.has('data.clearCoatVertexColorChannel')) {
            asset.set('data.clearCoatVertexColorChannel', 'r');
        }

        if (!asset.has('data.clearCoatGloss')) {
            if (asset.has('data.clearCoatGlossiness')) {
                asset.set('data.clearCoatGloss', asset.get('data.clearCoatGlossiness'));
            } else {
                asset.set('data.clearCoatGloss', 1.0);
            }
        }

        if (!asset.has('data.clearCoatGlossMap')) {
            asset.set('data.clearCoatGlossMap', null);
        }

        if (!asset.has('data.clearCoatGlossMapChannel')) {
            asset.set('data.clearCoatGlossMapChannel', 'r');
        }

        if (!asset.has('data.clearCoatGlossMapUv')) {
            asset.set('data.clearCoatGlossMapUv', 0);
        }

        if (!asset.has('data.clearCoatGlossMapTiling')) {
            asset.set('data.clearCoatGlossMapTiling', [1, 1]);
        }

        if (!asset.has('data.clearCoatGlossMapOffset')) {
            asset.set('data.clearCoatGlossMapOffset', [0, 0]);
        }

        if (!asset.has('data.clearCoatGlossVertexColor')) {
            asset.set('data.clearCoatGlossVertexColor', false);
        }

        if (!asset.has('data.clearCoatGlossVertexColorChannel')) {
            asset.set('data.clearCoatGlossVertexColorChannel', 'r');
        }

        if (!asset.has('data.clearCoatBumpiness')) {
            asset.set('data.clearCoatBumpiness', 1.0);
        }

        if (!asset.has('data.clearCoatNormalMap')) {
            asset.set('data.clearCoatNormalMap', null);
        }

        if (!asset.has('data.clearCoatNormalMapUv')) {
            asset.set('data.clearCoatNormalMapUv', 0);
        }

        if (!asset.has('data.clearCoatNormalMapTiling')) {
            asset.set('data.clearCoatNormalMapTiling', [1, 1]);
        }

        if (!asset.has('data.clearCoatNormalMapOffset')) {
            asset.set('data.clearCoatNormalMapOffset', [0, 0]);
        }

        // NOTE: set shader to blinn if it is not already for engine v1
        if (asset.get('data.shader') !== 'blinn') {
            const shader = asset.get('data.shader');
            asset.set('data.shader', 'blinn');
            if (shader !== 'blinn') {
                const msg = [
                    `The ${f.path('data.shader')} property of material ${f.asset(asset)} is no`,
                    'longer supported by the Editor, and this has been switched to Physical'
                ].join(' ');
                editor.call('console:log:asset', asset, msg);
            }
        }

        // remove fresnelModel since it is now always set to schlick
        if (asset.has('data.fresnelModel')) {
            const fresnelModel = asset.get('data.fresnelModel');
            asset.unset('data.fresnelModel');
            if (fresnelModel !== 2) {
                const msg = [
                    `The ${f.path('data.fresnelModel')} property of material ${f.asset(asset)}`,
                    'is no longer supported by the Editor, and this has been switched to Schlick'
                ].join(' ');
                editor.call('console:log:asset', asset, msg);
            }
        }

        // migrate tint flags
        removeMaterialTintFlags(asset);
    };

    /**
     * Migration for texture assets
     *
     * @param {Observer} asset - The texture asset to migrate
     */
    const migrateTexture = (asset) => {
        if (asset.get('source')) {
            return;
        }

        if (asset.get('meta')) {
            if (!asset.has('meta.compress')) {
                let alpha = asset.get('meta.alpha');
                if (!alpha) {
                    const metaType = asset.get('meta.type');
                    if ((metaType && metaType.toLowerCase() || '') === 'truecoloralpha') {
                        alpha = true;
                    }
                }

                asset.set('meta.compress', {
                    alpha: alpha || false,
                    normals: false,
                    dxt: false,
                    pvr: false,
                    pvrBpp: 4,
                    etc1: false,
                    etc2: false,
                    basis: false,
                    quality: 128,
                    compressionMode: 'etc'
                });
            } else {
                if (!asset.has('meta.compress.normals')) {
                    asset.set('meta.compress.normals', false);
                }

                if (!asset.has('meta.compress.pvr')) {
                    asset.set('meta.compress.pvr', false);
                }

                if (!asset.has('meta.compress.pvrBpp')) {
                    asset.set('meta.compress.pvrBpp', 4);
                }

                if (!asset.has('meta.compress.etc1')) {
                    asset.set('meta.compress.etc1', false);
                }

                if (!asset.has('meta.compress.etc2')) {
                    asset.set('meta.compress.etc2', false);
                }

                if (!asset.has('meta.compress.basis')) {
                    asset.set('meta.compress.basis', false);
                }

                if (!asset.has('meta.compress.quality')) {
                    asset.set('meta.compress.quality', 128);
                }

                if (!asset.has('meta.compress.compressionMode')) {
                    asset.set('meta.compress.compressionMode', 'etc');
                }
            }
        }

        if (asset.get('data')) {
            if (!asset.has('data.mipmaps')) {
                asset.set('data.mipmaps', true);
            }
        }
    };

    /**
     * Migration for font assets
     *
     * @param {Observer} asset - The font asset to migrate
     */
    const migrateFont = (asset) => {
        if (asset.get('source')) {
            return;
        }
        if (!asset.get('data')) {
            return;
        }

        if (!asset.has('data.intensity')) {
            asset.set('data.intensity', 0.0);
        }
    };

    /**
     * Migration for script assets
     *
     * @param {Observer} asset - The script asset to migrate
     */
    const migrateScript = (asset) => {
        if (!asset.get('data')) {
            return;
        }

        if (!asset.has('data.loadingType')) {
            asset.set('data.loadingType', LOAD_SCRIPT_AS_ASSET);
        }
    };

    /**
     * Migrate an asset
     *
     * @param {Observer} asset - The asset to migrate
     */
    const migrate = (asset) => {
        asset.history.enabled = false;

        const type = asset.get('type');

        if (!asset.has('i18n')) {
            asset.set('i18n', {});
        }

        if (type === 'material') {
            migrateMaterial(asset);
        }

        if (type === 'texture' || type === 'textureatlas') {
            migrateTexture(asset);
        }

        if (type === 'font') {
            migrateFont(asset);
        }

        if (type === 'script') {
            migrateScript(asset);
        }

        asset.history.enabled = true;
    };

    editor.on('assets:add', migrate);
    editor.call('assets:list').forEach(migrate);
});
