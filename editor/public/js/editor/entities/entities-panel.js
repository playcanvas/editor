editor.once('load', function() {
    'use strict'

    // hierarchy index
    var uiItemIndex = { };
    var awaitingParent = { };

    var panel = editor.call('layout.left');

    // list
    var hierarchy = new ui.Tree();
    hierarchy.allowRenaming = true;
    hierarchy.class.add('hierarchy');
    panel.append(hierarchy);

    var resizeTree = function() {
        hierarchy.element.style.width = '';
        hierarchy.element.style.width = (panel.innerElement.scrollWidth - 5) + 'px';
    };
    panel.on('resize', resizeTree);
    hierarchy.on('open', resizeTree);
    hierarchy.on('close', resizeTree);
    setInterval(resizeTree, 500);


    // return hirarchy
    editor.method('entities:hierarchy', function () {
        return hierarchy;
    });

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

        var resourceId = hierarchy._dragItems[0].entity.get('resource_id');
        editor.call('drop:set', 'entity', { resource_id: resourceId });
        editor.call('drop:activate', true);
    });

    hierarchy.on('dragend', function() {
        editor.call('drop:activate', false);
        editor.call('drop:set');
    });


    var target = editor.call('drop:target', {
        ref: panel.innerElement,
        type: 'entity',
        hole: true,
        passThrough: true
    });
    target.element.style.outline = 'none';


    // reparenting
    hierarchy.on('reparent', function(items) {
        var records = [ ];

        // make records and collect relevant data
        for(var i = 0; i < items.length; i++) {
            if (items[i].item.entity.reparenting)
                continue;

            var record = {
                item: items[i].item,
                parent: items[i].item.parent.entity,
                entity: items[i].item.entity,
                parentOld: items[i].old.entity,
                resourceId: items[i].item.entity.get('resource_id'),
                parentId: items[i].item.parent.entity.get('resource_id'),
                parentIdOld: items[i].old.entity.get('resource_id')
            };

            // relative entity
            record.indOld = record.parentOld.get('children').indexOf(record.resourceId);
            record.indNew = Array.prototype.indexOf.call(record.item.parent.innerElement.childNodes, record.item.element) - 1;

            records.push(record);
        }

        for(var i = 0; i < records.length; i++) {
            var record = records[i];

            record.entity.reparenting = true;

            record.parent.history.enabled = false;
            record.parentOld.history.enabled = false;
            record.entity.history.enabled = false;

            if (record.parent === record.parentOld) {
                // move
                record.parent.removeValue('children', record.resourceId);
                record.parent.insert('children', record.resourceId, record.indNew + ((record.indNew > record.indOld) ? (records.length - 1 - i) : 0));
            } else {
                // reparenting

                // remove from old parent
                record.parentOld.removeValue('children', record.resourceId);

                // add to new parent children
                if (record.indNew !== -1) {
                    // before other item
                    record.parent.insert('children', record.resourceId, record.indNew);
                } else {
                    // at the end
                    record.parent.insert('children', record.resourceId);
                }

                // set parent
                record.entity.set('parent', record.parentId);
            }

            record.parent.history.enabled = true;
            record.parentOld.history.enabled = true;
            record.entity.history.enabled = true;
            record.entity.reparenting = false;
        }

        editor.call('history:add', {
            name: 'reparent entities',
            undo: function() {
                for(var i = 0; i < records.length; i++) {
                    var parentOld = editor.call('entities:get', records[i].parentIdOld);
                    var parent = editor.call('entities:get', records[i].parentId);
                    var entity = editor.call('entities:get', records[i].resourceId);
                    if (! parentOld || ! parent || ! entity)
                        continue;

                    parent.history.enabled = false;
                    parent.removeValue('children', records[i].resourceId);
                    parent.history.enabled = true;

                    parentOld.history.enabled = false;
                    var off = parent !== parentOld ? 0 : ((records[i].indNew < records[i].indOld) ? (records.length - 1 - i) : 0);
                    parentOld.insert('children', records[i].resourceId, records[i].indOld === -1 ? undefined : records[i].indOld + off);
                    parentOld.history.enabled = true;

                    entity.history.enabled = false;
                    entity.set('parent', records[i].parentIdOld);
                    entity.history.enabled = true;
                }
            },
            redo: function() {
                for(var i = 0; i < records.length; i++) {
                    var parentOld = editor.call('entities:get', records[i].parentIdOld);
                    var parent = editor.call('entities:get', records[i].parentId);
                    var entity = editor.call('entities:get', records[i].resourceId);
                    if (! parentOld || ! parent || ! entity)
                        continue;

                    parentOld.history.enabled = false;
                    parentOld.removeValue('children', records[i].resourceId);
                    parentOld.history.enabled = true;

                    parent.history.enabled = false;
                    var off = parent !== parentOld ? 0 : ((records[i].indNew > records[i].indOld) ? (records.length - 1 - i) : 0);
                    parent.insert('children', records[i].resourceId, records[i].indNew + off);
                    parent.history.enabled = true;

                    entity.history.enabled = false;
                    entity.set('parent', records[i].parentId);
                    entity.history.enabled = true;
                }
            }
        });

        resizeTree();
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
    // selector change
    editor.on('selector:change', function(type, items) {
        if (type !== 'entity') {
            hierarchy.clear();
        } else {
            var selected = hierarchy.selected;
            var ids = { };

            // build index of selected items
            for(var i = 0; i < items.length; i++) {
                ids[items[i].get('resource_id')] = true;
            };

            // deselect unselected items
            for(var i = 0; i < selected.length; i++) {
                if (! ids[selected[i].entity.get('resource_id')])
                    selected[i].selected = false;
            }
        }
    });


    // entity removed
    editor.on('entities:remove', function(entity) {
        uiItemIndex[entity.get('resource_id')].destroy();
        resizeTree();
    });


    var componentList;


    // entity added
    editor.on('entities:add', function(entity) {
        var element = new ui.TreeItem({
            text: entity.get('name')
        });

        element.entity = entity;
        element.enabled = entity.get('enabled');

        if (! componentList)
            componentList = editor.call('components:list');

        // icon
        var components = Object.keys(entity.get('components'));
        for(var i = 0; i < components.length; i++) {
            element.class.add('c-' + components[i]);
        }
        var watchComponent = function(component) {
            entity.on('components.' + component + ':set', function() {
                element.class.add('c-' + component);
            });
            entity.on('components.' + component + ':unset', function() {
                element.class.remove('c-' + component);
            });
        };
        for(var i = 0; i < componentList.length; i++) {
            watchComponent(componentList[i]);
        }

        entity.reparenting = false;

        // index
        uiItemIndex[entity.get('resource_id')] = element;

        // name change
        entity.on('name:set', function(value) {
            element.text = value;
            resizeTree();
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

        resizeTree();
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

    // highlight entity
    editor.method('entities:panel:highlight', function (resourceId, highlight) {
        var item = uiItemIndex[resourceId];
        if (!item) return;

        if (highlight)
            item.class.add('highlight');
        else
            item.class.remove('highlight');
    });

});
