(function() {
    'use strict'

    // hierarchy index
    var listItemsByEntity = { };

    // list
    var hierarchy = new ui.List();
    hierarchyPanel.append(hierarchy);


    // list item selected
    hierarchy.on('select', function(item) {
        msg.call('selector:add', 'entity', item.entity);
    });
    // list item deselected
    hierarchy.on('deselect', function(item) {
        msg.call('selector:remove', item.entity);
    });


    // selector add
    msg.on('selector:add', function(entity, type) {
        if (type !== 'entity')
            return;

        listItemsByEntity[entity.resource_id].selected = true;
    });
    // selector remove
    msg.on('selector:remove', function(entity, type) {
        if (type !== 'entity')
            return;

        listItemsByEntity[entity.resource_id].selected = false;
    });


    // entity removed
    msg.on('entities:remove', function(entity) {
        var element = listItemsByEntity[entity.resource_id];

        if (element.nameChange)
            entity.unbind('name:set', element.nameChange);

        element.destroy();
    });


    // entity added
    msg.on('entities:add', function(entity) {
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
    msg.on('entity:delete', function(entity) {
        msg.call('entities:remove', entity);
    });

})();
