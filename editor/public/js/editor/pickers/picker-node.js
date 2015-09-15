editor.once('load', function() {
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
        callback: function() {
            if (overlay.hidden)
                return;

            overlay.hidden = true;
        }
    });

    // on close asset picker
    overlay.on('hide', function() {
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

        for (var i = 0, len = currentEntities.length; i < len; i++) {

            var history = currentEntities[i].history.enabled;
            currentEntities[i].history.enabled = false;

            if (! currentEntities[i].get('components.model.mapping')) {
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
            undo: function() {
                for(var i = 0; i < resourceIds.length; i++) {
                    var item = editor.call('entities:get', resourceIds[i]);
                    if (! item)
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
            redo: function() {
                for(var i = 0; i < resourceIds.length; i++) {
                    var item = editor.call('entities:get', resourceIds[i]);
                    if (! item)
                        continue;

                    var history = item.history.enabled;
                    item.history.enabled = false;
                    item.set(actions[i].path, actions[i].redo);
                    item.history.enabled = history;
                }
            }
        });


    };

    var addClickEvent = function (field, index) {
        field.addEventListener('click', function () {
            addMapping(index, currentAsset.get('data.mapping.' + index + '.material'));
            overlay.hidden = true;
        });
    };

    var isAlreadyOverriden = function (index) {
        var len = currentEntities.length;
        var overrideCount = 0;
        for (var i = 0; i < len; i++) {
            if (currentEntities[i].has('components.model.mapping.' + index))
                overrideCount++;
        }

        return overrideCount && overrideCount === len;
    };


    // open asset picker
    editor.method('picker:node', function(entities) {
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

            // get mesh instances panel
            var panelNodes = editor.call('attributes:asset:model:nodesPanel');
            panelNodes.style.zIndex = 102;
            panelNodes.style.overflow = 'visible';

            var root = editor.call('attributes.rootPanel');
            root.style.zIndex = 102;

            // flash panel
            panelNodes.flash();

            // add special class
            panelNodes.class.add('picker-node', 'noHeader');

            // add help
            var help = new ui.Label({
                text: '<h5>SELECT MESH INSTANCE</h5>Choose a mesh instance to customize the material for ' + (currentEntities.length > 1 ? 'these Entities.' : 'this Entity.')
            });
            help.class.add('help');
            panelNodes.prepend(help);

            // add click events for each mesh instance field
            var fields = panelNodes.element.getElementsByClassName('field-asset');
            for (var i = 0, len = fields.length; i < len; i++) {
                if (isAlreadyOverriden(i)) {
                    fields[i].classList.add('disabled');
                } else {
                    addClickEvent(fields[i], i);
                }
            }

            // focus panel
            setTimeout(function() {
                panelNodes.element.focus();
            }, 100);
        });

    });


    // close asset picker
    editor.method('picker:node:close', function() {
        // hide overlay
        overlay.hidden = true;
    });
});
