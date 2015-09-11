editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:framework');
    var canvas = editor.call('viewport:canvas');
    var evtPickHover = null;
    var hoverMaterial = null;
    var hoverEntity = null;
    var hoverMeshInstance = null;

    var onPickHover = function(node, picked) {
        var meshInstance = null;

        if (node && node._icon)
            node = node._getEntity();

        if (! node || ! editor.call('entities:get', node.getGuid())) {
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

    var onLeave = function() {
        if (! hoverEntity)
            return;

        if (hoverEntity.model.type === 'asset') {
            var mapping = hoverEntity.model.mapping;
            if (hoverEntity._materialBeforeHover === undefined)
                delete mapping[hoverEntity._materialIndHover];
            else
                mapping[hoverEntity._materialIndHover] = hoverEntity._materialBeforeHover;
            hoverEntity.model.mapping = mapping;
            editor.call('viewport:render');
        } else if (hoverEntity._materialBeforeHover) {
            hoverEntity.model.material = hoverEntity._materialBeforeHover;
            editor.call('viewport:render');
        }

        delete hoverEntity._materialBeforeHover;
        delete hoverEntity._materialIndHover;
    };

    var onHover = function(entity, meshInstance) {
        if (entity === hoverEntity && meshInstance === hoverMeshInstance)
            return;

        onLeave();

        hoverEntity = entity;
        hoverMeshInstance = meshInstance;

        if (hoverEntity) {
            if (hoverEntity.model.type === 'asset') {
                var ind = hoverEntity.model.model.meshInstances.indexOf(hoverMeshInstance);
                if (ind !== -1) {
                    var mapping = hoverEntity.model.mapping;

                    hoverEntity._materialBeforeHover = mapping ? mapping[ind] : undefined;
                    hoverEntity._materialIndHover = ind;

                    if (! mapping)
                        mapping = {};

                    mapping[ind] = hoverMaterial.id;
                    hoverEntity.model.mapping = mapping;
                    editor.call('viewport:render');
                }
            } else {
                hoverEntity._materialBeforeHover = hoverEntity.model.material;
                hoverEntity.model.material = hoverMaterial.resource;
                editor.call('viewport:render');
            }
        }
    };

    var dropRef = editor.call('drop:target', {
        ref: canvas.element,
        type: 'asset.material',
        hole: true,
        drop: function(type, data) {
            if (!config.scene.id)
                return;

            if (evtPickHover)
                evtPickHover.unbind();

            if (! hoverEntity || ! hoverEntity.model)
                return;

            var entity = editor.call('entities:get', hoverEntity.getGuid());
            if (! entity)
                return;

            if (entity.get('components.model.type') === 'asset') {
                var ind = hoverEntity.model.model.meshInstances.indexOf(hoverMeshInstance);
                if (ind === -1)
                    return;

                if (!entity.get('components.model.mapping')) {
                    var mapping = {};
                    mapping[ind] = parseInt(hoverMaterial.id, 10);
                    entity.set('components.model.mapping', mapping);
                } else {
                   entity.set('components.model.mapping.' + ind, parseInt(hoverMaterial.id, 10));
                }
            } else {
                // primitive model
                entity.set('components.model.materialAsset', hoverMaterial.id);
            }
        },
        over: function(type, data) {
            if (!config.scene.id)
                return;

            hoverMaterial = app.assets.get(parseInt(data.id, 10));
            if (! hoverMaterial)
                return;

            app.assets.load(hoverMaterial);

            hoverEntity = null;
            hoverMeshInstance = null;

            evtPickHover = editor.on('viewport:pick:hover', onPickHover);
        },
        leave: function() {
            if (!config.scene.id)
                return;

            if (evtPickHover) {
                evtPickHover.unbind();
                evtPickHover = null;
            }

            onLeave();
        }
    });
});
