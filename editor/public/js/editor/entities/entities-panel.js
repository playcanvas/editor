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
        ref: panel.content,
        type: 'entity',
        hole: true,
        passThrough: true
    });
    target.style.outline = 'none';


    // reparenting
    hierarchy.on('reparent', function(items) {
        var preserveTransform = ! Tree._ctrl || ! Tree._ctrl();

        var data = items
        .filter(item => !item.item.entity.reparenting)
        .map(item => {
            item.item.entity.reparenting = true;
            return {
                entity: item.item.entity,
                parent: item.item.parent.entity,
                index: Array.prototype.indexOf.call(item.item.parent.innerElement.childNodes, item.item.element) - 1
            };
        });

        editor.call('entities:reparent', data, preserveTransform);

        data.forEach(entry => {
            entry.entity.reparenting = false;
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

        if (uiItemIndex[entity.get('resource_id')]) {
            uiItemIndex[entity.get('resource_id')].selected = false;
        }
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
        delete uiItemIndex[entity.get('resource_id')];
        resizeQueue();
    });

    // Go through the entity and its children
    // recursively and update the icons of each tree item
    // depending on whether each child belongs to a template or not
    function resetTemplateIcons(entity) {
        const item = uiItemIndex[entity.get('resource_id')];

        if (item) {
            if (entity.get('template_id')) {
                item.class.remove('template-instance-child');
                item.class.add('template-instance');
                entity.emit('isPartOfTemplate', true);
            } else {
                item.class.remove('template-instance');
                if (editor.call('templates:isTemplateChild', entity)) {
                    item.class.add('template-instance-child');
                    entity.emit('isPartOfTemplate', true);
                } else {
                    item.class.remove('template-instance-child');
                    entity.emit('isPartOfTemplate', false);
                }
            }
        }

        const children = entity.get('children');
        for (let i = 0; i < children.length; i++) {
            const child = editor.call('entities:get', children[i]);
            if (child) {
                resetTemplateIcons(child);
            }
        }
    }

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

        if (entity.get('template_id')) {
            element.class.add('template-instance');
        } else if (editor.call('templates:isTemplateChild', entity)) {
            element.class.add('template-instance-child');
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

        // handle templates
        entity.on('template_ent_ids:set', () => {
            resetTemplateIcons(entity);
        });

        entity.on('template_ent_ids:unset', () => {
            resetTemplateIcons(entity);
        });

        entity.on('parent:set', () => {
            resetTemplateIcons(entity);
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

    // get a dictionary with the expanded state of an entity and its children
    editor.method('entities:panel:getExpandedState', function (entity) {
        const result = {};

        function recurse(entity) {
            if (!entity) return;

            const item = uiItemIndex[entity.get('resource_id')];
            if (item) {
                result[entity.get('resource_id')] = item.open;
            }

            const children = entity.get('children');
            for (let i = 0; i < children.length; i++) {
                recurse(editor.call('entities:get', children[i]));
            }
        }

        recurse(entity);

        return result;
    });

    // restore the expanded state of an entity tree item
    editor.method('entities:panel:restoreExpandedState', function (state) {
        for (const resourceId in state) {
            const item = uiItemIndex[resourceId];
            if (!item) continue;

            item.open = state[resourceId];
        }
    });
});
