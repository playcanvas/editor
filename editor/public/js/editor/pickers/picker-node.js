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
        // select entities again
        editor.call('selector:set', 'entity', currentEntities);

        // emit event
        editor.emit('picker:node:close');

        currentEntities = null;
        currentAsset = null;
    });

    var addMapping = function (index, assetId) {
        for (var i = 0, len = currentEntities.length; i < len; i++) {
            if (!currentEntities[i].get('components.model.mapping')) {
                var mapping = {};
                mapping[index] = parseInt(assetId, 10);
                currentEntities[i].set('components.model.mapping', mapping);
            } else {
                currentEntities[i].set('components.model.mapping.' + index, parseInt(assetId, 10));
            }

        }
    };

    var addClickEvent = function (field, index) {
        field.addEventListener('click', function () {
            addMapping(index, currentAsset.get('data.mapping.' + index + '.material'));
            overlay.hidden = true;
        });
    };

    var isAlreadyOverriden = function (index) {
        for (var i = 0, len = currentEntities.length; i < len; i++) {
            if (currentEntities[i].get('components.model.mapping.' + index))
                return true;
        }

        return false;
    };


    // open asset picker
    editor.method('picker:node', function(entities) {
        // show overlay
        overlay.hidden = false;

        currentEntities = entities;

        // select model asset
        currentAsset = editor.call('assets:get', entities[0].get('components.model.asset'));
        editor.call('selector:set', 'asset', [currentAsset]);

        editor.once('attributes:inspect[asset]', function () {
            // get mesh instances panel
            var panelNodes = editor.call('attributes:asset:model:nodesPanel');
            panelNodes.style.zIndex = 102;
            panelNodes.style.overflow = 'visible';

            // flash panel
            panelNodes.flash();

            // add special class
            panelNodes.class.add('picker-node');

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
