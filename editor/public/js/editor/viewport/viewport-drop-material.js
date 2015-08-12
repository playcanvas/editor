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

    var onHover = function(entity, meshInstance) {
        if (entity === hoverEntity && meshInstance === hoverMeshInstance)
            return;

        if (hoverMeshInstance && hoverMeshInstance._materialBeforeHover) {
            hoverMeshInstance.material = hoverMeshInstance._materialBeforeHover;
            hoverMeshInstance._materialBeforeHover = null;
        } else if (hoverEntity && hoverEntity._materialBeforeHover) {
            hoverEntity.model.material = hoverEntity._materialBeforeHover;
            hoverEntity._materialBeforeHover = null;
        }

        hoverEntity = entity;
        hoverMeshInstance = meshInstance;

        if (hoverEntity) {
            if (hoverEntity.model.type === 'asset') {
                if (hoverMaterial.resource) {
                    hoverMeshInstance._materialBeforeHover = hoverMeshInstance.material;
                    hoverMeshInstance.material = hoverMaterial.resource;
                }
            } else {
                if (hoverMaterial.resource) {
                    hoverEntity._materialBeforeHover = hoverEntity.model.material;
                    hoverEntity.model.material = hoverMaterial.resource;
                }
            }
            editor.call('viewport:render');
        }
    };

    var dropRef = editor.call('drop:target', {
        ref: canvas.element,
        type: 'asset.material',
        hole: true,
        drop: function(type, data) {
            if (evtPickHover)
                evtPickHover.unbind();

            if (! hoverEntity || ! hoverEntity.model)
                return;

            var entity = editor.call('entities:get', hoverEntity.getGuid());
            if (! entity)
                return;

            if (entity.get('components.model.type') === 'asset') {
                // model asset
                var ind = hoverEntity.model.model.meshInstances.indexOf(hoverMeshInstance);
                if (ind === -1)
                    return;

                var asset = editor.call('assets:get', entity.get('components.model.asset'));
                if (! asset)
                    return;

                if (asset.has('data.mapping.' + ind + '.material'))
                    asset.set('data.mapping.' + ind + '.material', hoverMaterial.id);
            } else {
                // primitive model
                entity.set('components.model.materialAsset', hoverMaterial.id);
            }

            if (hoverMeshInstance && hoverMeshInstance._materialBeforeHover)
                hoverMeshInstance._materialBeforeHover = null;
            if (hoverEntity && hoverEntity._materialBeforeHover)
                hoverEntity._materialBeforeHover = null;
        },
        over: function(type, data) {
            hoverMaterial = app.assets.get(parseInt(data.id, 10));
            if (! hoverMaterial)
                return;

            app.assets.load(hoverMaterial);

            evtPickHover = editor.on('viewport:pick:hover', onPickHover);
        },
        leave: function() {
            evtPickHover.unbind();
            evtPickHover = null;

            if (hoverMeshInstance && hoverMeshInstance._materialBeforeHover) {
                hoverMeshInstance.material = hoverMeshInstance._materialBeforeHover;
                hoverMeshInstance._materialBeforeHover = null;
                editor.call('viewport:render');
            } else if (hoverEntity && hoverEntity._materialBeforeHover) {
                hoverEntity.model.material = hoverEntity._materialBeforeHover;
                hoverEntity._materialBeforeHover = null;
                editor.call('viewport:render');
            }

            hoverEntity = null;
            hoverMeshInstance = null;
        }
    });
});
