editor.once('load', function() {
    'use strict'

    // hierarchy index
    var listItemsByEntity = { };

    // list
    var hierarchy = new ui.List();
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

        listItemsByEntity[entity.resource_id].selected = true;
    });
    // selector remove
    editor.on('selector:remove', function(entity, type) {
        if (type !== 'entity')
            return;

        listItemsByEntity[entity.resource_id].selected = false;
    });


    // entity removed
    editor.on('entities:remove', function(entity) {
        var element = listItemsByEntity[entity.resource_id];

        if (element.nameChange)
            entity.unbind('name:set', element.nameChange);

        element.destroy();
    });


    // entity added
    editor.on('entities:add', function(entity) {
        var element = new ui.ListItem({
            text: entity.name
        });
        element.entity = entity;
        hierarchy.append(element);

        // index
        listItemsByEntity[entity.resource_id] = element;

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
