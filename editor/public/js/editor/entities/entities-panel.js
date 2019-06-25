editor.once('load', function() {
    'use strict'

    // hierarchy index
    var uiItemIndex = { };
    var awaitingParent = { };

    var panel = editor.call('layout.hierarchy');

    // list
    var hierarchy = new ui.Tree();
    hierarchy.allowRenaming = editor.call('permissions:write');
    hierarchy.draggable = hierarchy.allowRenaming;
    hierarchy.class.add('hierarchy');
    panel.append(hierarchy);

    editor.on('permissions:writeState', function(state) {
        hierarchy.allowRenaming = state;
    });

    var resizeQueued = false;
    var resizeTree = function() {
        resizeQueued = false;
        hierarchy.element.style.width = '';
        hierarchy.element.style.width = (panel.content.style.scrollWidth - 5) + 'px';
    };
    var resizeQueue = function() {
        if (resizeQueued) return;
        resizeQueued = true;
        requestAnimationFrame(resizeTree);
    };
    panel.on('resize', resizeQueue);
    hierarchy.on('open', resizeQueue);
    hierarchy.on('close', resizeQueue);
    setInterval(resizeQueue, 1000);


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
        var rect = panel.content.dom.getBoundingClientRect();

        if ((evt.clientY - rect.top) < 32 && panel.content.dom.scrollTop > 0) {
            dragScroll = -1;
        } else if ((rect.bottom - evt.clientY) < 32 && (panel.content.dom.scrollHeight - (rect.height + panel.content.dom.scrollTop)) > 0) {
            dragScroll = 1;
        } else {
            dragScroll = 0;
        }
    };
    hierarchy.on('dragstart', function() {
        dragTimer = setInterval(function() {
            if (dragScroll === 0)
                return;

            panel.content.dom.scrollTop += dragScroll * 8;
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
        ref: panel.content.dom,
        type: 'entity',
        hole: true,
        passThrough: true
    });
    target.element.style.outline = 'none';


    // reparenting
    hierarchy.on('reparent', function(items) {
        var records = [ ];

        var preserveTransform = ! Tree._ctrl || ! Tree._ctrl();

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

            if (preserveTransform && record.entity) {
                record.position = record.entity.entity.getPosition().clone();
                record.rotation = record.entity.entity.getRotation().clone();
            }

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

            if (preserveTransform && record.position) {
                record.entity.entity.setPosition(record.position);
                record.entity.entity.setRotation(record.rotation);

                var localPosition = record.entity.entity.getLocalPosition();
                var localRotation = record.entity.entity.getLocalEulerAngles();
                record.entity.set('position', [ localPosition.x, localPosition.y, localPosition.z ]);
                record.entity.set('rotation', [ localRotation.x, localRotation.y, localRotation.z ]);
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
                    var entity = editor.call('entities:get', records[i].resourceId);
                    if (! entity) continue;

                    var parent = editor.call('entities:get', entity.get('parent'));
                    var parentOld = editor.call('entities:get', records[i].parentIdOld);
                    if (! parentOld || ! parent) continue;

                    if (parent.get('children').indexOf(records[i].resourceId) === -1 || (parentOld.get('children').indexOf(records[i].resourceId) !== -1 && parentOld !== parent))
                        return;

                    // check if not reparenting to own child
                    var deny = false;
                    var checkParent = editor.call('entities:get', parentOld.get('parent'));
                    while(checkParent) {
                        if (checkParent === entity) {
                            deny = true;
                            checkParent = null;
                            break;
                        } else {
                            checkParent = editor.call('entities:get', checkParent.get('parent'));
                        }
                    }
                    if (deny)
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

                    if (preserveTransform && records[i].position && entity.entity) {
                        entity.entity.setPosition(records[i].position);
                        entity.entity.setRotation(records[i].rotation);

                        var localPosition = entity.entity.getLocalPosition();
                        var localRotation = entity.entity.getLocalEulerAngles();
                        entity.set('position', [ localPosition.x, localPosition.y, localPosition.z ]);
                        entity.set('rotation', [ localRotation.x, localRotation.y, localRotation.z ]);
                    }

                    entity.history.enabled = true;

                    editor.call('viewport:render');
                }
            },
            redo: function() {
                for(var i = 0; i < records.length; i++) {
                    var entity = editor.call('entities:get', records[i].resourceId);
                    if (! entity) continue;

                    var parent = editor.call('entities:get', records[i].parentId);
                    var parentOld = editor.call('entities:get', entity.get('parent'));
                    if (! parentOld || ! parent) continue;

                    if (parentOld.get('children').indexOf(records[i].resourceId) === -1 || (parent.get('children').indexOf(records[i].resourceId) !== -1 && parent !== parentOld))
                        continue;

                    // check if not reparenting to own child
                    var deny = false;
                    var checkParent = editor.call('entities:get', parent.get('parent'));
                    while(checkParent) {
                        if (checkParent === entity) {
                            deny = true;
                            checkParent = null;
                            break;
                        } else {
                            checkParent = editor.call('entities:get', checkParent.get('parent'));
                        }
                    }
                    if (deny)
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

                    if (preserveTransform && records[i].position && entity.entity) {
                        entity.entity.setPosition(records[i].position);
                        entity.entity.setRotation(records[i].rotation);

                        var localPosition = entity.entity.getLocalPosition();
                        var localRotation = entity.entity.getLocalEulerAngles();
                        entity.set('position', [ localPosition.x, localPosition.y, localPosition.z ]);
                        entity.set('rotation', [ localRotation.x, localRotation.y, localRotation.z ]);
                    }

                    entity.history.enabled = true;

                    editor.call('viewport:render');
                }
            }
        });

        resizeQueue();
        editor.call('viewport:render');
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
        resizeQueue();
    });


    var componentList;

    // entity added
    editor.on('entities:add', function(entity, isRoot) {
        var classList = ['tree-item-entity', 'entity-id-' + entity.get('resource_id')];
        if (isRoot) {
            classList.push('tree-item-root');
        }

        var element = new ui.TreeItem({
            text: entity.get('name'),
            classList: classList
        });

        element.entity = entity;
        element.enabled = entity.get('enabled');

        if (! componentList)
            componentList = editor.call('components:list');

        // icon
        var components = Object.keys(entity.get('components'));
        for(var i = 0; i < components.length; i++)
            element.class.add('c-' + components[i]);

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
            resizeQueue();
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

        // collaborators
        var users = element.users = document.createElement('span');
        users.classList.add('users');
        element.elementTitle.appendChild(users);

        resizeQueue();
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
                    if (!child) {
                        var err = 'Cannot find child entity ' + children[c];
                        editor.call('status:error', err);
                        console.error(err);
                        continue;
                    }
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
