editor.once('load', function () {
    'use strict';

    var overlay = new ui.Overlay();
    overlay.class.add('picker-node');
    overlay.center = false;
    overlay.hidden = true;

    var root = editor.call('layout.root');
    root.append(overlay);

    var currentEntities = null;
    var currentAsset = null;

    // esc to close
    editor.call('hotkey:register', 'picker:node:close', {
        key: 'esc',
        callback: function () {
            if (overlay.hidden)
                return;

            overlay.hidden = true;
        }
    });

    // on close asset picker
    overlay.on('hide', function () {
        // reset root header
        var root = editor.call('attributes.rootPanel');
        root.style.zIndex = '';

        // select entities again
        editor.call('selector:history', false);
        editor.call('selector:set', 'entity', currentEntities);
        editor.once('selector:change', function () {
            editor.call('selector:history', true);
        });

        // emit event
        editor.emit('picker:node:close');

        currentEntities = null;
        currentAsset = null;
    });

    var addMapping = function (index, assetId) {
        var resourceIds = [];
        var actions = [];

        for (let i = 0, len = currentEntities.length; i < len; i++) {

            var history = currentEntities[i].history.enabled;
            currentEntities[i].history.enabled = false;

            if (!currentEntities[i].get('components.model.mapping')) {
                var mapping = {};
                mapping[index] = parseInt(assetId, 10);

                actions.push({
                    path: 'components.model.mapping',
                    undo: undefined,
                    redo: mapping
                });

                currentEntities[i].set('components.model.mapping', mapping);

                resourceIds.push(currentEntities[i].get('resource_id'));
            } else {
                if (currentEntities[i].has('components.model.mapping.' + index))
                    continue;

                var id = parseInt(assetId, 10);

                actions.push({
                    path: 'components.model.mapping.' + index,
                    undo: undefined,
                    redo: id
                });

                currentEntities[i].set('components.model.mapping.' + index, id);

                resourceIds.push(currentEntities[i].get('resource_id'));
            }

            currentEntities[i].history.enabled = history;
        }

        editor.call('history:add', {
            name: 'entities.' + (resourceIds.length > 1 ? '*' : resourceIds[0]) + '.components.model.mapping',
            undo: function () {
                for (let i = 0; i < resourceIds.length; i++) {
                    var item = editor.call('entities:get', resourceIds[i]);
                    if (!item)
                        continue;

                    var history = item.history.enabled;
                    item.history.enabled = false;

                    if (actions[i].undo === undefined)
                        item.unset(actions[i].path);
                    else
                        item.set(actions[i].path, actions[i].undo);

                    item.history.enabled = history;
                }
            },
            redo: function () {
                for (let i = 0; i < resourceIds.length; i++) {
                    var item = editor.call('entities:get', resourceIds[i]);
                    if (!item)
                        continue;

                    var history = item.history.enabled;
                    item.history.enabled = false;
                    item.set(actions[i].path, actions[i].redo);
                    item.history.enabled = history;
                }
            }
        });
    };

    var isAlreadyOverriden = function (index) {
        var len = currentEntities.length;
        var overrideCount = 0;
        for (let i = 0; i < len; i++) {
            if (currentEntities[i].has('components.model.mapping.' + index))
                overrideCount++;
        }

        return overrideCount && overrideCount === len;
    };


    // open asset picker
    editor.method('picker:node', function (entities) {
        // show overlay
        overlay.hidden = false;

        currentEntities = entities;

        // select model asset
        currentAsset = editor.call('assets:get', entities[0].get('components.model.asset'));
        editor.call('selector:history', false);
        editor.call('selector:set', 'asset', [currentAsset]);

        editor.once('attributes:inspect[asset]', function () {
            editor.call('selector:history', true);

            // change header name
            editor.call('attributes:header', 'Entity Materials');

            // hide asset info
            editor.emit('attributes:assets:toggleInfo', false);

            var root = editor.call('attributes.rootPanel');
            root.style.zIndex = 102;

            const modelEntityMaterials = new pcui.ModelAssetInspectorMeshInstances({
                entities: currentEntities,
                assets: editor.call('assets:raw'),
                history: editor.call('editor:history'),
                mode: 'picker',
                isMeshInstanceDisabled: isAlreadyOverriden
            });

            modelEntityMaterials.on('select', (ind) => {
                addMapping(ind, currentAsset.get('data.mapping.' + ind + '.material'));
                overlay.hidden = true;
            });

            modelEntityMaterials.link([currentAsset]);
            root.append(modelEntityMaterials);

            const evtModelEntityPermissions = editor.on('permissions:writeState', (state) => {
                modelEntityMaterials.readOnly = !state;
                modelEntityMaterials.enabled = state;
            });
            modelEntityMaterials.once('destroy', () => {
                evtModelEntityPermissions.unbind();
            });
        });

    });


    // close asset picker
    editor.method('picker:node:close', function () {
        // hide overlay
        overlay.hidden = true;
    });
});
