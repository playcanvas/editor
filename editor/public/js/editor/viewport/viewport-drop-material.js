editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:framework');
    var canvas = editor.call('viewport:canvas');
    var evtPickHover = null;
    var hoverAsset = null;
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
        if (hoverAsset && hoverAsset._materialBeforeHover !== undefined) {
            hoverAsset.data.mapping[hoverAsset._materialIndHover].material = hoverAsset._materialBeforeHover;
            hoverAsset.fire('change', hoverAsset, 'data', hoverAsset.data, hoverAsset.data);
            delete hoverAsset._materialBeforeHover;
            editor.call('viewport:render');
        } else if (hoverEntity && hoverEntity._materialBeforeHover) {
            hoverEntity.model.material = hoverEntity._materialBeforeHover;
            delete hoverEntity._materialBeforeHover;
            editor.call('viewport:render');
        }
    }

    var onHover = function(entity, meshInstance) {
        if (entity === hoverEntity && meshInstance === hoverMeshInstance)
            return;

        onLeave();

        hoverAsset = null;
        hoverEntity = entity;
        hoverMeshInstance = meshInstance;

        if (hoverEntity) {
            if (hoverEntity.model.type === 'asset') {
                if (hoverMaterial.resource) {
                    var ind = hoverEntity.model.model.meshInstances.indexOf(hoverMeshInstance);
                    if (ind !== -1) {
                        hoverAsset = app.assets.get(hoverEntity.model.asset);
                        hoverAsset._materialBeforeHover = hoverAsset.data.mapping[ind].material;
                        hoverAsset._materialIndHover = ind;

                        hoverAsset.data.mapping[ind].material = hoverMaterial.id;
                        hoverAsset.fire('change', hoverAsset, 'data', hoverAsset.data, hoverAsset.data);
                        editor.call('viewport:render');
                    }
                }
            } else {
                if (hoverMaterial.resource) {
                    hoverEntity._materialBeforeHover = hoverEntity.model.material;
                    hoverEntity.model.material = hoverMaterial.resource;
                    editor.call('viewport:render');
                }
            }
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
        },
        over: function(type, data) {
            hoverMaterial = app.assets.get(parseInt(data.id, 10));
            if (! hoverMaterial)
                return;

            app.assets.load(hoverMaterial);

            hoverAsset = null;
            hoverEntity = null;
            hoverMeshInstance = null;

            evtPickHover = editor.on('viewport:pick:hover', onPickHover);
        },
        leave: function() {
            evtPickHover.unbind();
            evtPickHover = null;

            onLeave();
        }
    });
});
