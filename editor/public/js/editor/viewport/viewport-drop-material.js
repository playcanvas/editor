editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:framework');
    if (! app) return;

    var canvas = editor.call('viewport:canvas');
    var evtPickHover = null;
    var hoverMaterial = null;
    var hoverAsset = null;
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

            if (hoverAsset) {
                hoverAsset.data.mapping[hoverAsset._materialIndHover].material = hoverAsset._materialBeforeHover;
                hoverAsset.fire('change', hoverAsset, 'data', hoverAsset.data, hoverAsset.data);
                delete hoverAsset._materialBeforeHover;
            } else {
                var mapping = hoverEntity.model.mapping;
                if (hoverEntity._materialBeforeHover === undefined)
                    delete mapping[hoverEntity._materialIndHover];
                else
                    mapping[hoverEntity._materialIndHover] = hoverEntity._materialBeforeHover;
                hoverEntity.model.mapping = mapping;
            }

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

        hoverAsset = null;
        hoverEntity = entity;
        hoverMeshInstance = meshInstance;

        if (hoverEntity) {
            if (hoverEntity.model.type === 'asset') {
                var ind = hoverEntity.model.model.meshInstances.indexOf(hoverMeshInstance);
                if (ind !== -1) {
                    var mapping = hoverEntity.model.mapping;
                    if (!mapping || !mapping[ind]) {

                        hoverAsset = app.assets.get(hoverEntity.model.asset);
                        hoverAsset._materialBeforeHover = hoverAsset.data.mapping[ind].material;
                        hoverAsset._materialIndHover = ind;

                        hoverAsset.data.mapping[ind].material = hoverMaterial.id;
                        hoverAsset.fire('change', hoverAsset, 'data', hoverAsset.data, hoverAsset.data);
                } else {
                        hoverEntity._materialBeforeHover = mapping[ind];
                        hoverEntity._materialIndHover = ind;

                        mapping[ind] = hoverMaterial.id;
                        hoverEntity.model.mapping = mapping;
                    }

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

                // if we are setting the model asset mapping then set it and return
                if (hoverAsset) {
                    var asset = editor.call('assets:get', hoverAsset.id);
                    if (asset.has('data.mapping.' + ind + '.material'))
                        asset.set('data.mapping.' + ind + '.material', hoverMaterial.id);

                    return;
                }

                // set mapping with custom history action
                // to prevent bug where undoing will set the mapping to
                // null instead of unsetting it
                var history = entity.history.enabled;
                entity.history.enabled = false;
                var resourceId = entity.get('resource_id');

                var undo = {};
                var redo = {};

                if (!entity.get('components.model.mapping')) {
                    var mapping = {};
                    mapping[ind] = parseInt(hoverMaterial.id, 10);
                    entity.set('components.model.mapping', mapping);
                    undo.path = 'components.model.mapping';
                    undo.value = undefined;
                    redo.path = undo.path;
                    redo.value = mapping;
                } else {
                    undo.path = 'components.model.mapping.' + ind;
                    undo.value = entity.has('components.model.mapping.' + ind) ?
                                 entity.get('components.model.mapping.' + ind) :
                                 undefined;
                    redo.path = undo.path;
                    redo.value = parseInt(hoverMaterial.id, 10);

                    entity.set('components.model.mapping.' + ind, parseInt(hoverMaterial.id, 10));

                }
                entity.history.enabled = history;

                editor.call('history:add', {
                    name: 'entities.' + resourceId + '.components.model.mapping',
                    undo: function() {
                        var item = editor.call('entities:get', resourceId);
                        if (! item) return;

                        var history = item.history.enabled;
                        item.history.enabled = false;

                        if (undo.value === undefined)
                            item.unset(undo.path);
                        else
                            item.set(undo.path, undo.value);

                        item.history.enabled = history;
                    },
                    redo: function() {
                        var item = editor.call('entities:get', resourceId);
                        if (! item) return;

                        var history = item.history.enabled;
                        item.history.enabled = false;
                        if (redo.value === undefined)
                            item.unset(redo.path);
                        else
                            item.set(redo.path, redo.value);
                        item.history.enabled = history;
                    }
                });
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
