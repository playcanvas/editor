editor.once('load', function() {
    'use strict'

    // hierarchy index
    var uiItemIndex = { };
    var awaitingParent = { };

    var panel = editor.call('layout.left');

    // list
    var hierarchy = new ui.Tree();
    hierarchy.class.add('hierarchy');
    panel.append(hierarchy);

    // controls
    var controls = new ui.Panel();
    controls.class.add('hierarchy-controls');
    controls.parent = panel;
    panel.element.appendChild(controls.element);

    // controls delete
    var btnDelete = new ui.Button({
        text: '&#58657;'
    });
    btnDelete.class.add('delete');
    btnDelete.element.title = 'Delete Entity';
    btnDelete.on('click', function() {
        var type = editor.call('selector:type');
        var items = editor.call('selector:items');

        if (type === 'entity') {
            for(var i = 0; i < items.length; i++)
                editor.call('entities:delete', items[i]);
        } else if (type === 'asset') {
            for(var i = 0; i < items.length; i++)
                editor.call('assets:delete', items[i]);
        }
    });
    controls.append(btnDelete);

    // controls add
    var btnAdd = new ui.Button({
        text: '&#57873;'
    });
    btnAdd.class.add('add');
    btnAdd.element.title = 'New Entity';
    btnAdd.on('click', function() {
        var parent = editor.call('entities:selectedFirst');
        editor.call('entities:new', parent);
    });
    controls.append(btnAdd);

    // controls duplicate
    var btnDuplicate = new ui.Button({
        text: '&#57908;'
    });
    btnDuplicate.disabled = true;
    btnDuplicate.class.add('duplicate');
    btnDuplicate.element.title = 'Duplicate Entity';
    btnDuplicate.on('click', function() {
        var type = editor.call('selector:type');
        var items = editor.call('selector:items');

        if (type === 'entity' && items.length)
            editor.call('entities:duplicate', items[0]);
    });
    controls.append(btnDuplicate);

    editor.on('attributes:clear', function() {
        btnDuplicate.disabled = true;
        btnDelete.disabled = true;
    });

    editor.on('attributes:inspect[*]', function(type) {
        btnDelete.enabled = type === 'entity';
        btnDuplicate.enabled = type === 'entity';
    });


    // list item selected
    hierarchy.on('select', function(item) {
        // open items till parent
        var parent = item.parent;
        while(parent && parent instanceof ui.TreeItem) {
            parent.open = true;
            parent = parent.parent;
        }
        // add selection
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
        var ind = parent.get('children').indexOf(entity.get('resource_id'));
        var indNew = -1;

        if (item.next && item.next.entity) {
            indNew = parent.get('children').indexOf(item.next.entity.get('resource_id'));

            if (parent === parentOld && ind < indNew)
                indNew--;
        }

        if (parent === parentOld) {
            // move
            parent.move('children', ind, indNew);

        } else {
            // reparenting

            // remove from old parent
            parentOld.removeValue('children', entity.get('resource_id'));

            // add to new parent children
            if (indNew !== -1) {
                // before other item
                parent.insert('children', entity.get('resource_id'), indNew);
            } else {
                // at the end
                parent.insert('children', entity.get('resource_id'));
            }

            // set parent
            entity.set('parent', parent.get('resource_id'));
        }

        // select reparented entity
        item.selected = true;

        entity.reparenting = false;
    });


    // selector add
    editor.on('selector:add', function(entity, type) {
        if (type !== 'entity')
            return;

        uiItemIndex[entity.get('resource_id')].selected = true;
    });
    // selector remove
    editor.on('selector:remove', function(entity, type) {
        if (type !== 'entity')
            return;

        uiItemIndex[entity.get('resource_id')].selected = false;
    });


    // entity removed
    editor.on('entities:remove', function(entity) {
        uiItemIndex[entity.get('resource_id')].destroy();
    });


    // entity added
    editor.on('entities:add', function(entity) {
        var element = new ui.TreeItem({
            text: entity.get('name')
        });

        element.entity = entity;
        element.enabled = entity.get('enabled');

        var components = Object.keys(entity.get('components'));
        for(var i = 0; i < components.length; i++) {
            element.class.add('c-' + components[i]);
        }

        entity.reparenting = false;

        // index
        uiItemIndex[entity.get('resource_id')] = element;

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

            var next = uiItemIndex[entity.get('children.' + (ind + 1))];
            var after = null;
            if (next === item) {
                next = null;

                if (ind > 0)
                    after = uiItemIndex[entity.get('children.' + ind)]
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

            var next = uiItemIndex[entity.get('children.' + (ind + 1))];
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
            var element = uiItemIndex[entity.get('resource_id')];

            if (! entity.get('parent')) {
                // root
                hierarchy.append(element);
                element.open = true;
            }

            var children = entity.get('children');
            if (children.length) {
                for(var c = 0; c < children.length; c++) {
                    var child = uiItemIndex[children[c]];
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
