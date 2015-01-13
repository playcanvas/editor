editor.once('load', function() {
    'use strict'

    // hierarchy index
    var uiItemIndex = { };
    var awaitingParent = { };

    // list
    var hierarchy = new ui.Tree();
    editor.call('layout.left').append(hierarchy);


    // list item selected
    hierarchy.on('select', function(item) {
        editor.call('selector:add', 'entity', item.entity);
    });
    // list item deselected
    hierarchy.on('deselect', function(item) {
        editor.call('selector:remove', item.entity);
    });


    // selector add
    editor.on('selector:add', function(entity, type) {
        if (type !== 'entity')
            return;

        uiItemIndex[entity.resource_id].selected = true;
    });
    // selector remove
    editor.on('selector:remove', function(entity, type) {
        if (type !== 'entity')
            return;

        uiItemIndex[entity.resource_id].selected = false;
    });


    // entity removed
    editor.on('entities:remove', function(entity) {
        var element = uiItemIndex[entity.resource_id];

        if (element.nameChange)
            entity.unbind('name:set', element.nameChange);

        element.destroy();
    });


    // entity added
    editor.on('entities:add', function(entity) {
        var element = new ui.TreeItem({
            text: entity.name
        });
        element.entity = entity;
        if (! entity.parent) {
            // root
            hierarchy.append(element);
            element.open = true;
        } else {
            if (uiItemIndex[entity.parent]) {
                // has parent already
                uiItemIndex[entity.parent].append(element);
            } else {
                // need to wait for parent
                if (! awaitingParent[entity.parent]) {
                    awaitingParent[entity.parent] = [ ];
                }
                awaitingParent[entity.parent].push(element);
            }
        }

        // if there are children waiting?
        var children = awaitingParent[entity.resource_id];
        if (children) {
            for(var i = 0; i < children.length; i++) {
                element.append(children[i]);
            }
            delete awaitingParent[entity.resource_id];
        }

        // index
        uiItemIndex[entity.resource_id] = element;

        // name change
        element.nameChange = function(value) {
            element.text = value;
        };
        entity.on('name:set', element.nameChange);
    });


    // deleting entity
    editor.on('entity:delete', function(entity) {
        editor.call('entities:remove', entity);
    });

});
