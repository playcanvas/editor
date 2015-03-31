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

    // list item selected
    hierarchy.on('select', function(item) {
        // open items till parent
        var parent = item.parent;
        while(parent && parent instanceof ui.TreeItem) {
            parent.open = true;
            parent = parent.parent;
        }
        // focus
        item.elementTitle.focus();
        // add selection
        editor.call('selector:add', 'entity', item.entity);
    });

    // list item deselected
    hierarchy.on('deselect', function(item) {
        editor.call('selector:remove', item.entity);
    });


    // scrolling on drag
    var dragScroll = 0;
    var dragTimer;
    var dragLastEvt;
    var dragEvt = function(evt) {
        if (! hierarchy._dragging) {
            console.log('1')
            clearInterval(dragTimer);
            window.removeEventListener('mousemove', dragEvt);
            return;
        }
        var rect = panel.innerElement.getBoundingClientRect();

        if ((evt.clientY - rect.top) < 32 && panel.innerElement.scrollTop > 0) {
            dragScroll = -1;
        } else if ((rect.bottom - evt.clientY) < 32 && (panel.innerElement.scrollHeight - (rect.height + panel.innerElement.scrollTop)) > 0) {
            dragScroll = 1;
        } else {
            dragScroll = 0;
        }
    };
    hierarchy.on('dragstart', function() {
        dragTimer = setInterval(function() {
            if (dragScroll === 0)
                return;

            panel.innerElement.scrollTop += dragScroll * 8;
            hierarchy._dragOver = null;
            hierarchy._updateDragHandle();
        }, 1000 / 60);

        dragScroll = 0;
        window.addEventListener('mousemove', dragEvt, false);
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
    editor.on('entities:load', function() {
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

    // get entity item
    editor.method('entities:panel:get', function (resourceId) {
        return uiItemIndex[resourceId];
    });

});
