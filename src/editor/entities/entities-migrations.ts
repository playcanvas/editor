import { formatter as f } from '../../common/utils.ts';
import { LAYERID_WORLD, LAYERID_DEPTH, LAYERID_SKYBOX, LAYERID_IMMEDIATE, LAYERID_UI } from '../../core/constants.ts';

/** @import { Observer } from '@playcanvas/observer' */

editor.once('load', () => {
    /**
     * @param {Observer & { insert: (string, val) => void }} entity - The entity to migrate
     */
    const migrate = (entity) => {
        // Defer migration to ensure document is ready
        setTimeout(() => {
            entity.history.enabled = false;

            // tags
            if (!entity.has('tags')) {
                entity.set('tags', []);
            }

            // components

            // camera
            if (entity.has('components.camera')) {
                // frustumCulling
                if (!entity.has('components.camera.frustumCulling')) {
                    entity.set('components.camera.frustumCulling', false);
                }

                // layers
                if (!entity.has('components.camera.layers')) {
                    entity.set('components.camera.layers', []);
                    entity.insert('components.camera.layers', LAYERID_WORLD);
                    entity.insert('components.camera.layers', LAYERID_DEPTH);
                    entity.insert('components.camera.layers', LAYERID_SKYBOX);
                    entity.insert('components.camera.layers', LAYERID_IMMEDIATE);
                    entity.insert('components.camera.layers', LAYERID_UI);
                }
            }

            // light
            if (entity.has('components.light')) {
                // isStatic
                if (!entity.has('components.light.isStatic')) {
                    entity.set('components.light.isStatic', false);
                }

                // bake
                if (!entity.has('components.light.bake')) {
                    entity.set('components.light.bake', false);
                }

                // bakeDir
                if (!entity.has('components.light.bakeDir')) {
                    entity.set('components.light.bakeDir', true);
                }

                // affectDynamic
                if (!entity.has('components.light.affectDynamic')) {
                    entity.set('components.light.affectDynamic', true);
                }

                // affectLightmapped
                if (!entity.has('components.light.affectLightmapped')) {
                    entity.set('components.light.affectLightmapped', false);
                }

                // affectSpecularity
                if (!entity.has('components.light.affectSpecularity')) {
                    entity.set('components.light.affectSpecularity', true);
                }

                // shadowUpdateMode
                const shadowUpdateMode = entity.get('components.light.shadowUpdateMode');
                if (shadowUpdateMode === null || isNaN(shadowUpdateMode)) {
                    entity.set('components.light.shadowUpdateMode', pc.SHADOWUPDATE_REALTIME);
                }

                // shape
                if (!entity.has('components.light.shape')) {
                    entity.set('components.light.shape', 0);
                }

                // shadowType
                if (!entity.has('components.light.shadowType')) {
                    entity.set('components.light.shadowType', 0);
                }
                const SHADOW_VSM8 = 1;
                if (entity.get('components.light.shadowType') === SHADOW_VSM8) {
                    entity.set('components.light.shadowType', pc.SHADOW_VSM16);
                    const msg = [
                        `The ${f.path('components.light.shadowType')} property value`,
                        `${f.const('SHADOW_VSM8', SHADOW_VSM8)} on ${f.entity(entity)} is deprecated.`,
                        `Setting value to ${f.const('SHADOW_VSM16', pc.SHADOW_VSM16)} instead.`
                    ].join(' ');
                    editor.call('console:log:entity', entity, msg);
                }

                // numCascades
                if (!entity.has('components.light.numCascades')) {
                    entity.set('components.light.numCascades', 1);
                }

                // cascadeDistribution
                if (!entity.has('components.light.cascadeDistribution')) {
                    entity.set('components.light.cascadeDistribution', 0.5);
                }

                // vsmBlurMode
                if (!entity.has('components.light.vsmBlurMode')) {
                    entity.set('components.light.vsmBlurMode', 0);
                }

                // vsmBlurSize
                if (!entity.has('components.light.vsmBlurSize')) {
                    entity.set('components.light.vsmBlurSize', 5);
                }

                // vsmBias
                if (!entity.has('components.light.vsmBias')) {
                    entity.set('components.light.vsmBias', 0.01 * 0.25);
                }

                // cookieAsset
                if (!entity.has('components.light.cookieAsset')) {
                    entity.set('components.light.cookieAsset', null);
                }

                // cookieIntensity
                if (!entity.has('components.light.cookieIntensity')) {
                    entity.set('components.light.cookieIntensity', 1.0);
                }

                // cookieFalloff
                if (!entity.has('components.light.cookieFalloff')) {
                    entity.set('components.light.cookieFalloff', true);
                }

                // cookieChannel
                if (!entity.has('components.light.cookieChannel')) {
                    entity.set('components.light.cookieChannel', 'rgb');
                }

                // cookieAngle
                if (!entity.has('components.light.cookieAngle')) {
                    entity.set('components.light.cookieAngle', 0);
                }

                // cookieScale
                if (!entity.has('components.light.cookieScale')) {
                    entity.set('components.light.cookieScale', [1.0, 1.0]);
                }

                // cookieOffset
                if (!entity.has('components.light.cookieOffset')) {
                    entity.set('components.light.cookieOffset', [0.0, 0.0]);
                }

                // layers
                if (!entity.has('components.light.layers')) {
                    entity.set('components.light.layers', []);
                    entity.insert('components.light.layers', LAYERID_WORLD);
                }

                // shadow intensity
                if (!entity.has('components.light.shadowIntensity')) {
                    entity.set('components.light.shadowIntensity', 1.0);
                }
            }

            // model
            if (entity.has('components.model')) {
                // isStatic
                if (!entity.has('components.model.isStatic')) {
                    entity.set('components.model.isStatic', false);
                }

                // lightmapped
                if (!entity.has('components.model.lightmapped')) {
                    entity.set('components.model.lightmapped', false);
                }

                // castShadowsLightmap
                if (!entity.has('components.model.castShadowsLightmap')) {
                    entity.set('components.model.castShadowsLightmap', true);
                }

                // lightmapSizeMultiplier
                if (!entity.has('components.model.lightmapSizeMultiplier')) {
                    entity.set('components.model.lightmapSizeMultiplier', 1.0);
                }

                // batch group id
                if (!entity.has('components.model.batchGroupId')) {
                    entity.set('components.model.batchGroupId', null);
                }

                // layers
                if (!entity.has('components.model.layers')) {
                    entity.set('components.model.layers', []);
                    entity.insert('components.model.layers', LAYERID_WORLD);
                }
            }

            // element
            if (entity.has('components.element')) {
                const color = entity.get('components.element.color');
                let opacity = 1.0;
                if (color.length > 3) {
                    opacity = color[3];
                    entity.set('components.element.color', [color[0], color[1], color[2]]);
                }

                if (!entity.has('components.element.opacity')) {
                    entity.set('components.element.opacity', opacity);
                }

                if (!entity.has('components.element.useInput')) {
                    entity.set('components.element.useInput', false);
                }

                if (!entity.has('components.element.fitMode')) {
                    entity.set('components.element.fitMode', pc.FITMODE_STRETCH);
                }

                if (!entity.has('components.element.autoWidth')) {
                    entity.set('components.element.autoWidth', entity.get('components.element.type') === 'text');
                }

                if (!entity.has('components.element.autoHeight')) {
                    entity.set('components.element.autoHeight', entity.get('components.element.type') === 'text');
                }

                if (!entity.has('components.element.margin')) {
                    if (entity.entity && entity.entity.element) {
                        const margin = entity.entity.element.margin;
                        entity.set('components.element.margin', [margin.x, margin.y, margin.z, margin.w]);
                    } else {
                        entity.set('components.element.margin', [0, 0, 0, 0]);
                    }
                }

                if (!entity.has('components.element.alignment')) {
                    entity.set('components.element.alignment', [0.5, 0.5]);
                }

                if (!entity.has('components.element.wrapLines')) {
                    entity.set('components.element.wrapLines', false);
                }

                if (!entity.has('components.element.batchGroupId')) {
                    entity.set('components.element.batchGroupId', null);
                }
                if (!entity.has('components.element.mask')) {
                    entity.set('components.element.mask', false);
                }
                if (!entity.has('components.element.spriteAsset')) {
                    entity.set('components.element.spriteAsset', null);
                }
                if (!entity.has('components.element.spriteFrame')) {
                    entity.set('components.element.spriteFrame', 0);
                }
                if (!entity.has('components.element.pixelsPerUnit')) {
                    entity.set('components.element.pixelsPerUnit', null);
                }

                if (!entity.has('components.element.outlineColor')) {
                    entity.set('components.element.outlineColor', [0.0, 0.0, 0.0, 1.0]);
                }
                if (!entity.has('components.element.outlineThickness')) {
                    entity.set('components.element.outlineThickness', 0.0);
                }
                if (!entity.has('components.element.shadowColor')) {
                    entity.set('components.element.shadowColor', [0.0, 0.0, 0.0, 1.0]);
                }
                if (!entity.has('components.element.shadowOffset')) {
                    entity.set('components.element.shadowOffset', [0.0, 0.0]);
                }

                // layers
                if (!entity.has('components.element.layers')) {
                    entity.set('components.element.layers', []);
                    entity.insert('components.element.layers', LAYERID_UI);
                }

                if (!entity.has('components.element.autoFitWidth')) {
                    entity.set('components.element.autoFitWidth', false);
                }

                if (!entity.has('components.element.autoFitHeight')) {
                    entity.set('components.element.autoFitHeight', false);
                }

                if (!entity.has('components.element.maxLines')) {
                    entity.set('components.element.maxLines', null);
                }

                if (!entity.has('components.element.minFontSize')) {
                    entity.set('components.element.minFontSize', 8);
                }

                if (!entity.has('components.element.maxFontSize')) {
                    entity.set('components.element.maxFontSize', entity.get('components.element.fontSize') || 32);
                }

                if (!entity.has('components.element.enableMarkup')) {
                    entity.set('components.element.enableMarkup', false);
                }
            }

            // scrollview
            if (entity.has('components.scrollview')) {
                if (!entity.has('components.scrollview.useMouseWheel')) {
                    entity.set('components.scrollview.useMouseWheel', true);
                }
                if (!entity.has('components.scrollview.mouseWheelSensitivity')) {
                    entity.set('components.scrollview.mouseWheelSensitivity', [1, 1]);
                }
            }

            // screen
            if (entity.has('components.screen')) {
                if (!entity.has('components.screen.priority')) {
                    entity.set('components.screen.priority', 0);
                }
            }

            // sprite
            if (entity.has('components.sprite')) {
                if (!entity.has('components.sprite.width')) {
                    entity.set('components.sprite.width', 1);
                }
                if (!entity.has('components.sprite.height')) {
                    entity.set('components.sprite.height', 1);
                }
                // layers
                if (!entity.has('components.sprite.layers')) {
                    entity.set('components.sprite.layers', []);
                    entity.insert('components.sprite.layers', LAYERID_WORLD);
                }
                // draw order
                if (!entity.has('components.sprite.drawOrder')) {
                    entity.set('components.sprite.drawOrder', 0);
                }
            }

            // layoutchild
            if (entity.has('components.layoutchild')) {
                if (!entity.has('components.layoutchild.excludeFromLayout')) {
                    entity.set('components.layoutchild.excludeFromLayout', false);
                }
            }

            // anim
            if (entity.has('components.anim')) {
                if (!entity.has('components.anim.normalizeWeights')) {
                    entity.set('components.anim.normalizeWeights', true);
                    window.sessionStorage.setItem(`${entity.get('resource_id')}:animNormalizeWeightsMessage`, 'true');
                }
            }

            // particles
            if (entity.has('components.particlesystem')) {
                // layers
                if (!entity.has('components.particlesystem.layers')) {
                    entity.set('components.particlesystem.layers', []);
                    entity.insert('components.particlesystem.layers', LAYERID_WORLD);
                }
                if (!entity.has('components.particlesystem.emitterRadiusInner')) {
                    entity.set('components.particlesystem.emitterRadiusInner', 0.0);
                }
                if (!entity.has('components.particlesystem.emitterExtentsInner')) {
                    entity.set('components.particlesystem.emitterExtentsInner', [0.0, 0.0, 0.0]);
                }
                if (!entity.has('components.particlesystem.orientation')) {
                    entity.set('components.particlesystem.orientation', 0);
                }
                if (!entity.has('components.particlesystem.particleNormal')) {
                    entity.set('components.particlesystem.particleNormal', [0.0, 1.0, 0.0]);
                }
                if (!entity.has('components.particlesystem.radialSpeedGraph')) {
                    entity.set('components.particlesystem.radialSpeedGraph', {
                        type: 1,
                        keys: [0, 0],
                        betweenCurves: false
                    });
                }
                if (!entity.has('components.particlesystem.radialSpeedGraph2')) {
                    entity.set('components.particlesystem.radialSpeedGraph2', {
                        type: 1,
                        keys: [0, 0]
                    });
                }
                if (!entity.has('components.particlesystem.localSpace')) {
                    entity.set('components.particlesystem.localSpace', false);
                }

                if (!entity.has('components.particlesystem.screenSpace')) {
                    entity.set('components.particlesystem.screenSpace', false);
                }

                if (!entity.has('components.particlesystem.animStartFrame')) {
                    entity.set('components.particlesystem.animStartFrame', 0);
                }

                if (!entity.has('components.particlesystem.animNumAnimations')) {
                    entity.set('components.particlesystem.animNumAnimations', 1);
                }

                if (!entity.has('components.particlesystem.animIndex')) {
                    entity.set('components.particlesystem.animIndex', 0);
                }

                if (!entity.has('components.particlesystem.randomizeAnimIndex')) {
                    entity.set('components.particlesystem.randomizeAnimIndex', false);
                }
            }

            // collision
            if (entity.has('components.collision')) {
                if (!entity.has('components.collision.linearOffset')) {
                    entity.set('components.collision.linearOffset', [0.0, 0.0, 0.0]);
                }

                if (!entity.has('components.collision.angularOffset')) {
                    entity.set('components.collision.angularOffset', [0.0, 0.0, 0.0]);
                }
            }

            entity.history.enabled = true;
        });
    };

    editor.on('scene:raw', () => {
        editor.call('entities:list').forEach(migrate);
        editor.on('entities:add', migrate);
    });

    editor.on('scene:unload', () => {
        editor.unbind('entities:add', migrate);
    });
});
