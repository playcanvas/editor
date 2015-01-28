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


    // reparenting
    hierarchy.on('reparent', function(item, parentOld) {
        var parent = item.parent.entity;
        var entity = item.entity;
        parentOld = parentOld.entity;

        // no need to reparent
        if (entity.reparenting)
            return;

        entity.reparenting = true;

        // relative entity
        var ind = parent.children.indexOf(entity.resource_id);
        var indNew = -1;

        if (item.next && item.next.entity) {
            indNew = parent.children.indexOf(item.next.entity.resource_id);

            if (parent === parentOld && ind < indNew)
                indNew--;
        }

        if (parent === parentOld) {
            // move
            parent.move('children', entity.resource_id, indNew);

        } else {
            // reparenting

            // remove from old parent
            parentOld.remove('children', entity.resource_id);

            // add to new parent children
            if (indNew !== -1) {
                // before other item
                parent.insert('children', entity.resource_id, indNew);
            } else {
                // at the end
                parent.insert('children', entity.resource_id);
            }

            // set parent
            entity.parent = parent.resource_id;
        }

        entity.reparenting = false;
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
        uiItemIndex[entity.resource_id].destroy();
    });


    // entity added
    editor.on('entities:add', function(entity) {
        var element = new ui.TreeItem({
            text: entity.name
        });

        element.entity = entity;
        element.enabled = entity.enabled;

        entity.reparenting = false;

        // index
        uiItemIndex[entity.resource_id] = element;

        // name change
        entity.on('name:set', function(value) {
            element.text = value;
        });

        entity.on('enabled:set', function(value) {
            element.enabled = value;
        });

        entity.on('children:move', function(value, ind, indOld) {
            var item = uiItemIndex[value];
            if (! item || item.entity.reparenting)
                return;

            element.remove(item);

            var next = uiItemIndex[entity.children[ind + 1]];
            var after = null;
            if (next === item) {
                next = null;

                if (ind > 0)
                    after = uiItemIndex[entity.children[ind]]
            }

            if (item.parent)
                item.parent.remove(item);

            if (next) {
                element.appendBefore(item, next);
            } else if (after) {
                element.appendAfter(item, after);
            } else {
                element.append(item);
            }
        });

        // remove children
        entity.on('children:remove', function(value) {
            var item = uiItemIndex[value];
            if (! item || item.entity.reparenting)
                return;

            element.remove(item);
        });

        // add children
        entity.on('children:insert', function(value, ind) {
            var item = uiItemIndex[value];

            if (! item || item.entity.reparenting)
                return;

            if (item.parent)
                item.parent.remove(item);

            var next = uiItemIndex[entity.children[ind + 1]];
            if (next) {
                element.appendBefore(item, next);
            } else {
                element.append(item);
            }
        });
    });


    // append all treeItems according to child order
    editor.once('entities:load', function() {
        var entities = editor.call('entities:list');

        for(var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            var element = uiItemIndex[entity.resource_id];

            if (! entity.parent) {
                // root
                hierarchy.append(element);
                element.open = true;
            }

            if (entity.children.length) {
                for(var c = 0; c < entity.children.length; c++) {
                    var child = uiItemIndex[entity.children[c]];
                    element.append(child);
                }
            }
        }
    });


    // deleting entity
    editor.on('entity:delete', function(entity) {
        editor.call('entities:remove', entity);
    });

});
