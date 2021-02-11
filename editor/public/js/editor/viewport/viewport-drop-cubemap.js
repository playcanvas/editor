editor.once('load', function () {
    'use strict';

    var app = editor.call('viewport:app');
    if (! app) return; // webgl not available

    var canvas = editor.call('viewport:canvas');
    var evtPickHover = null;
    var hoverSkybox = null;
    var hoverMaterial = null;
    var hoverCubemap = null;
    var hoverEntity = undefined;
    var hoverMeshInstance = null;
    var hoverSkyboxFields = ['cubeMap', 'prefilteredCubeMap128', 'prefilteredCubeMap64', 'prefilteredCubeMap32', 'prefilteredCubeMap16', 'prefilteredCubeMap8', 'prefilteredCubeMap4'];

    var onPickHover = function (node, picked) {
        var meshInstance = null;

        if (node && node._icon)
            node = node._getEntity();

        if (! node) {
            onHover(null);
            return;
        }

        if (picked instanceof pc.MeshInstance)
            meshInstance = picked;

        if (node.model && meshInstance && (! meshInstance.node._parent || ! meshInstance.node._parent._icon)) {
            onHover(node, meshInstance);
        } else {
            onHover(null);
        }
    };

    var onLeave = function () {
        if (hoverSkybox) {
            app.scene.setSkybox(hoverSkybox);
            hoverSkybox = null;
            editor.call('viewport:render');
        }

        if (hoverMaterial) {
            for (let i = 0; i < hoverSkyboxFields.length; i++)
                hoverMaterial[hoverSkyboxFields[i]] = hoverMaterial._hoverCubeMap[hoverSkyboxFields[i]];
            hoverMaterial.update();
            delete hoverMaterial._hoverCubeMap;
            hoverMaterial = null;

            editor.call('viewport:render');
        }
    };

    var onCubemapLoad = function () {
        setCubemap();
    };

    var setCubemap = function () {
        if (hoverEntity) {
            hoverMaterial = hoverMeshInstance.material;

            if (hoverMaterial) {
                if (! hoverMaterial._hoverCubeMap) {
                    hoverMaterial._hoverCubeMap = { };
                    for (let i = 0; i < hoverSkyboxFields.length; i++)
                        hoverMaterial._hoverCubeMap[hoverSkyboxFields[i]] = hoverMaterial[hoverSkyboxFields[i]];
                }

                for (let i = 0; i < hoverSkyboxFields.length; i++)
                    hoverMaterial[hoverSkyboxFields[i]] = hoverCubemap.resources[i];

                hoverMaterial.update();

                editor.call('viewport:render');
            }
        } else {
            if (! hoverSkybox) {
                hoverSkybox = [null, null, null, null, null, null];
                var id = editor.call('sceneSettings').get('render.skybox');
                if (id) {
                    var engineCubemap = app.assets.get(id);
                    if (engineCubemap)
                        hoverSkybox = engineCubemap.resources;
                }
            }

            if (hoverCubemap)
                app.scene.setSkybox(hoverCubemap.resources);

            editor.call('viewport:render');
        }
    };

    var onHover = function (entity, meshInstance) {
        if (entity === hoverEntity && meshInstance === hoverMeshInstance)
            return;

        onLeave();

        hoverEntity = entity;
        hoverMeshInstance = meshInstance;

        setCubemap();
    };

    editor.call('drop:target', {
        ref: canvas,
        type: 'asset.cubemap',
        hole: true,
        drop: function (type, data) {
            if (!config.scene.id)
                return;

            if (evtPickHover) {
                evtPickHover.unbind();
                evtPickHover = null;
            }

            hoverCubemap.off('load', onCubemapLoad);

            onLeave();

            if (hoverEntity) {
                var materialId;
                if (hoverEntity.model.type === 'asset') {
                    var ind = hoverEntity.model.model.meshInstances.indexOf(hoverMeshInstance);

                    if (hoverEntity.model.mapping && hoverEntity.model.mapping[ind]) {
                        materialId = hoverEntity.model.mapping[ind];
                    } else if (hoverEntity.model.asset) {
                        var modelAsset = editor.call('assets:get', hoverEntity.model.asset);

                        if (modelAsset && ind !== -1)
                            materialId = modelAsset.get('data.mapping.' + ind + '.material');
                    }
                } else if (hoverEntity.model.materialAsset) {
                    materialId = hoverEntity.model.materialAsset.id;
                }

                if (materialId) {
                    var materialAsset = editor.call('assets:get', materialId);
                    if (materialAsset)
                        materialAsset.set('data.cubeMap', hoverCubemap.id);
                }
                editor.call('viewport:render');
            } else {
                editor.call('sceneSettings').set('render.skybox', hoverCubemap.id);
                app.scene.setSkybox(hoverCubemap.resources);
                editor.call('viewport:render');
            }
        },
        over: function (type, data) {
            if (!config.scene.id)
                return;

            hoverCubemap = app.assets.get(parseInt(data.id, 10));
            if (! hoverCubemap)
                return;

            hoverCubemap.loadFaces = true;
            app.assets.load(hoverCubemap);
            hoverCubemap.on('load', onCubemapLoad);

            hoverEntity = undefined;
            hoverMeshInstance = null;

            evtPickHover = editor.on('viewport:pick:hover', onPickHover);
            onHover(null, null);
        },
        leave: function () {
            if (!config.scene.id)
                return;

            if (evtPickHover) {
                evtPickHover.unbind();
                evtPickHover = null;
            }

            hoverCubemap.off('load', onCubemapLoad);

            onLeave();
        }
    });
});
