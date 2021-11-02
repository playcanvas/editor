Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'entities-treeview';
    const CLASS_COMPONENT_ICON = 'component-icon-postfix';
    const CLASS_TEMPLATE_INSTANCE = 'template-instance';
    const CLASS_TEMPLATE_INSTANCE_CHILD = CLASS_TEMPLATE_INSTANCE + '-child';
    const CLASS_HIGHLIGHT = CLASS_ROOT + '-highlight';
    const CLASS_USER_SELECTION_MARKER = CLASS_ROOT + '-user-marker';
    const CLASS_USER_SELECTION_MARKER_CONTAINER = CLASS_USER_SELECTION_MARKER + '-container';

    const TIME_WAIT_ENTITIES = 5000;

    /**
     * @name pcui.EntitiesTreeView
     * @classdesc Represents the Entity TreeView that shows the Scene hierarchy.
     * @property {ObserverList} entities The entities observer list.
     */
    class EntitiesTreeView extends pcui.TreeView {
        constructor(args) {
            if (!args) args = {};

            super(args);

            this.class.add(CLASS_ROOT);

            this._eventsEditor = [];
            this._eventsObserverList = [];
            this._eventsEntity = {};

            this._rootItem = null;
            this._treeItemIndex = {};

            this._userSelectionMarkers = {};

            this._componentList = editor.call('components:list');

            this._suspendSelectionEvents = false;

            if (args.entities) {
                this.entities = args.entities;
            }

            this._assets = args.assets;

            this._history = args.history;
            this._dropManager = args.dropManager;
            this._dropType = null;
            this._dropData = null;

            this.on('rename', this._onRename.bind(this));

            this.on('dragstart', this._onStartDrag.bind(this));
            this.on('dragend', this._onEndDrag.bind(this));

            this.on('select', this._onSelectEntityItem.bind(this));
            this.on('deselect', this._onDeselectEntityItem.bind(this));

            this._onReparentFn = this._onReparent.bind(this);

            this._eventsEditor.push(editor.on('selector:change', this._onSelectorChange.bind(this)));
            this._eventsEditor.push(editor.on('selector:sync', this._onSelectorSync.bind(this)));
            this._eventsEditor.push(editor.on('whoisonline:remove', this._onUserOffline.bind(this)));

            this._domEvtEntitiesMouseEnter = this._onEntitiesMouseEnter.bind(this);
            this._domEvtEntitiesMouseLeave = this._onEntitiesMouseLeave.bind(this);
            this._domEvtEntitiesMouseUp = this._onEntitiesMouseUp.bind(this);

            if (this._dropManager) {
                this._eventsEditor.push(this._dropManager.on('activate', this._onActivateDropManager.bind(this)));
                this._eventsEditor.push(this._dropManager.on('deactivate', this._onDeactivateDropManager.bind(this)));
            }

            this.writePermissions = !!args.writePermissions;
        }

        _onRename(item, name) {
            if (item.entity) {
                item.entity.set('name', name);
            }
        }

        _onReparent(reparentedItems) {
            // do not allow entities part of a template to be dragged out
            // of the template root
            const newParentTemplates = {};

            for (let i = 0; i < reparentedItems.length; i++) {
                const entry = reparentedItems[i];
                const templateRoot = editor.call('templates:isTemplateChild', entry.item.entity, this._entities);
                if (templateRoot) {
                    const newParentId = entry.newParent.entity.get('resource_id');
                    if (!newParentTemplates.hasOwnProperty(newParentId)) {
                        if (entry.newParent.entity.get('template_id')) {
                            newParentTemplates[newParentId] = entry.newParent.entity;
                        } else {
                            newParentTemplates[newParentId] = editor.call('templates:isTemplateChild', entry.newParent.entity, this._entities);
                        }
                    }

                    if (templateRoot !== newParentTemplates[newParentId]) {
                        editor.call(
                            'picker:confirm',
                            `Entities that are part of a Template cannot be reparented outside the Template.`,
                            function () {},
                            {
                                yesText: 'OK',
                                noText: ''
                            }
                        );

                        return;
                    }
                }
            }

            // preserve transform if we are not pressing Ctrl
            const preserveTransform = !this._pressedCtrl;

            var items = reparentedItems
            .map(reparented => {
                return {
                    entity: reparented.item.entity,
                    parent: reparented.newParent.entity,
                    index: reparented.newChildIndex
                };
            });

            editor.call('entities:reparent', items, preserveTransform);

            editor.call('viewport:render');
        }

        _onStartDrag(dragItems) {
            // activate the drop manager when we start dragging an entity
            editor.call('drop:set', 'entity', {
                resource_id: dragItems[0].entity.get('resource_id')
            });
            editor.call('drop:activate', true);
        }

        _onEndDrag() {
            // deactivate the drop manager when we stop dragging an entity
            editor.call('drop:activate', false);
            editor.call('drop:set');
        }

        _onSelectEntityItem(item) {
            if (this._suspendSelectionEvents) return;

            // add to selection
            editor.call('selector:add', 'entity', item.entity);
        }

        _onDeselectEntityItem(item) {
            if (this._suspendSelectionEvents) return;

            // remove from selection
            editor.call('selector:remove', item.entity);
        }

        _onSelectorChange(type, entities) {
            if (type !== 'entity') {
                this._suspendSelectionEvents = true;
                this.deselect();
                this._suspendSelectionEvents = false;
                return;
            }

            this._suspendSelectionEvents = true;

            // build index of new selection
            const index = {};
            entities.forEach(entity => {
                index[entity.get('resource_id')] = true;
            });

            // deselect entities no longer in the new selection
            const selected = this._selectedItems;
            let i = selected.length;
            while (i--) {
                if (!selected[i]) continue;
                if (!index[selected[i].entity.get('resource_id')]) {
                    selected[i].selected = false;
                }
            }

            // select entities in the new selection
            entities.forEach(entity => {
                const item = this.getTreeItemForEntity(entity.get('resource_id'));
                if (item && !item.selected) {
                    item.selected = true;
                }
            });

            this._suspendSelectionEvents = false;
        }

        // Called when we receive the selection of a remote user
        _onSelectorSync(user, data) {
            // remove existing selection markers for user
            if (this._userSelectionMarkers[user]) {
                this._userSelectionMarkers[user].markers.forEach(marker => {
                    // check if marker has already been destroyed
                    // before adding it to the pool (e.g. if selected entity was deleted)
                    if (!marker.destroyed) {
                        marker.parent.remove(marker);
                        this._userSelectionMarkers[user].pool.push(marker);
                    }
                });

                this._userSelectionMarkers[user].markers.length = 0;
            }

            if (data.type !== 'entity') return;

            // create new entry in userSelectionMarkers for user
            if (! this._userSelectionMarkers[user]) {
                this._userSelectionMarkers[user] = {
                    color: editor.call('users:color', user, 'hex'), // color we will use for this user's selections
                    markers: [], // holds markers for each entity the user has selected
                    pool: [] // pool of markers created for this user to reuse to avoid recreating them on every selection
                };
            }

            // create marker for each selection
            data.ids.forEach(resourceId => {
                const item = this.getTreeItemForEntity(resourceId);
                if (!item) return;

                let marker = this._userSelectionMarkers[user].pool.pop();
                if (!marker) {
                    marker = new pcui.Element(document.createElement('span'), {
                        class: CLASS_USER_SELECTION_MARKER
                    });
                    marker.style.backgroundColor = this._userSelectionMarkers[user].color;
                }

                this._userSelectionMarkers[user].markers.push(marker);
                item._containerUsers.append(marker);
            });
        }

        _onUserOffline(userId) {
            if (! this._userSelectionMarkers[userId])
                return;

            this._userSelectionMarkers[userId].markers.forEach(marker => {
                marker.destroy();
            });

            delete this._userSelectionMarkers[userId];
        }

        _onActivateDropManager() {
            if (!this._writePermissions) return;

            // remove event listeners just in case
            this.dom.removeEventListener('mouseenter', this._domEvtEntitiesMouseEnter);
            this.dom.removeEventListener('mouseleave', this._domEvtEntitiesMouseLeave);

            this.dom.addEventListener('mouseenter', this._domEvtEntitiesMouseEnter);
            this.dom.addEventListener('mouseleave', this._domEvtEntitiesMouseLeave);
        }

        _onDeactivateDropManager() {
            this.dom.removeEventListener('mouseenter', this._domEvtEntitiesMouseEnter);
            this.dom.removeEventListener('mouseleave', this._domEvtEntitiesMouseLeave);
        }

        _onEntitiesMouseEnter(evt) {
            this._dropType = this._dropManager.dropType;
            this._dropData = this._dropManager.dropData;
            if (!this._isDraggingValidAssetType(this._dropType, this._dropData)) return;

            if (this._dropData) {
                this.isDragging = true;
                window.removeEventListener('mouseup', this._domEvtEntitiesMouseUp);
                window.addEventListener('mouseup', this._domEvtEntitiesMouseUp);
            }
        }

        _onEntitiesMouseUp(evt) {
            window.removeEventListener('mouseup', this._domEvtEntitiesMouseUp);

            if (!this.isDragging) return;

            const dragOverItem = this._dragOverItem;
            const dragArea = this._dragArea;
            const dropType = this._dropType;
            const dropData = this._dropData;

            this._dropType = null;
            this._dropData = null;

            this.isDragging = false;

            if (!this.dom.contains(evt.target) || !dragOverItem) return;

            this._instantiateDraggedAssets(dragOverItem, dragArea, dropType, dropData);
        }

        _selectEntitiesById(entityIds) {
            const entities = entityIds.map(id => this._entities.get(id)).filter(entity => entity);
            if (entities.length) {
                editor.call('selector:history', false);
                editor.call('selector:set', 'entity', entities);
                editor.once('selector:change', () => {
                    editor.call('selector:history', true);
                });
            }
        }

        _instantiateDraggedAssets(dragOverItem, dragArea, dropType, dropData) {
            let parent = dragOverItem.entity;
            let childIndex;

            if (dragArea === 'before') {
                parent = dragOverItem.parent.entity;
                childIndex = Array.prototype.indexOf.call(dragOverItem.parent.dom.childNodes, dragOverItem.dom) - 1;
            } else if (dragArea === 'after') {
                parent = dragOverItem.parent.entity;
                childIndex = Array.prototype.indexOf.call(dragOverItem.parent.dom.childNodes, dragOverItem.dom) + 1;
            }

            let assets = [];
            if (dropType === 'assets') {
                assets = dropData.ids
                .map(id => this._assets.get(id))
                .filter(asset => {
                    if (!asset) return false;
                    const type = asset.get('type');
                    return type === 'template' || type === 'sprite' || type === 'model';
                });
            } else if (dropType === 'asset.template' ||
                       dropType === 'asset.sprite' ||
                       dropType === 'asset.model') {

                const asset = this._assets.get(dropData.id);
                if (asset) {
                    assets.push(asset);
                }
            }

            if (!assets.length) return;

            let newEntityIds;

            const undo = () => {
                newEntityIds.forEach(id => {
                    const entity = this._entities.get(id);
                    if (entity) {
                        entity.apiEntity.delete({ history: false });
                    }
                });

                newEntityIds = null;

                editor.call('viewport:render');
            };

            const redo = () => {
                newEntityIds = [];
                if (parent) {
                    parent = parent.latest();
                }
                if (!parent) return;

                const templates = [];
                assets.forEach(asset => {
                    try {
                        if (asset.get('type') === 'template') {
                            templates.push(asset);
                        } else if (asset.get('type') === 'model') {
                            newEntityIds.push(this._instantiateDraggedModelAsset(asset, parent, childIndex));
                        } else if (asset.get('type') === 'sprite') {
                            newEntityIds.push(this._instantiateDraggedSpriteAsset(asset, parent, childIndex));
                        }
                    } catch (err) {
                        log.error(err);
                    }
                });

                if (templates.length) {
                    this._instantiateDraggedTemplateAssets(templates, parent, childIndex, entityIds => {
                        if (newEntityIds) {
                            newEntityIds = newEntityIds.concat(entityIds);
                            this._selectEntitiesById(newEntityIds);
                        }
                    });
                }

                this._selectEntitiesById(newEntityIds);
            };

            if (this._history) {
                this._history.add({
                    name: 'drop assets',
                    undo: undo,
                    redo: redo
                });
            }

            redo();
        }

        _instantiateDraggedTemplateAssets(assets, parentEntity, childIndex, callback) {
            if (childIndex === null || childIndex === undefined) {
                childIndex = parentEntity.get('children').length;
            }

            editor.assets.instantiateTemplates(assets.map(a => a.apiAsset), parentEntity.apiEntity, {
                index: childIndex,
                history: false
            })
            .then(newEntities => {
                callback(newEntities.map(e => e.get('resource_id')));
            });
        }

        _instantiateDraggedModelAsset(asset, parentEntity, childIndex) {
            const component = editor.call('components:getDefault', 'model');
            component.type = 'asset';
            component.asset = parseInt(asset.get('id'), 10);

            let name = asset.get('name');
            if (/\.json$/i.test(name)) {
                name = name.slice(0, -5) || 'Untitled';
            } else if (/\.glb$/i.test(name)) {
                name = name.slice(0, -4) || 'Untitled';
            }

            // new entity
            const newEntity = editor.call('entities:new', {
                parent: parentEntity,
                index: childIndex,
                name: name,
                position: [0, 0, 0],
                components: {
                    model: component
                },
                noSelect: true,
                noHistory: true
            });

            return newEntity.get('resource_id');
        }

        _instantiateDraggedSpriteAsset(asset, parentEntity, childIndex) {
            const component = editor.call('components:getDefault', 'sprite');
            const name = asset.get('name') || 'Untitled';

            if (asset.get('data.frameKeys').length > 1) {
                component.type = 'animated';
                component.clips = {
                    '0': {
                        name: name,
                        fps: 10,
                        loop: true,
                        autoPlay: true,
                        spriteAsset: parseInt(asset.get('id'), 10)
                    }
                };
                component.autoPlayClip = name;
            } else {
                component.spriteAsset =  parseInt(asset.get('id'), 10);
            }

            const newEntity = editor.call('entities:new', {
                parent: parentEntity,
                name: name,
                position: [0, 0, 0],
                index: childIndex,
                components: {
                    sprite: component
                },
                noSelect: true,
                noHistory: true
            });

            return newEntity.get('resource_id');
        }

        _onEntitiesMouseLeave(evt) {
            window.removeEventListener('mouseup', this._domEvtEntitiesMouseUp);

            const dropType = this._dropType;
            const dropData = this._dropData;
            this._dropType = null;
            this._dropData = null;
            if (this._isDraggingValidAssetType(dropType, dropData)) {
                this.isDragging = false;
            }
        }

        _isDraggingValidAssetType(dropType, dropData) {
            if (!this._writePermissions) return false;

            if (dropType === 'assets') {
                const assets = dropData.ids.map(id => this._assets.get(id));
                return assets.filter(asset => {
                    if (!asset) return false;
                    const type = asset.get('type');
                    return type === 'template' ||
                           type === 'model' ||
                           type === 'sprite';
                }).length > 0;
            }
            return dropType === 'asset.template' ||
                   dropType === 'asset.model' ||
                   dropType === 'asset.sprite';
        }

        _onAddEntity(entity) {
            const resourceId = entity.get('resource_id');
            if (this._treeItemIndex[resourceId]) return this._treeItemIndex[resourceId];

            // new tree item for entity
            const treeViewItem = new pcui.TreeViewItem({
                allowSelect: true,
                allowDrop: true,
                text: entity.get('name'),
                enabled: entity.get('enabled')
            });

            treeViewItem.iconLabel.class.add(CLASS_COMPONENT_ICON);

            treeViewItem.entity = entity;

            const events = [];

            // add component icons
            this._componentList.forEach(component => {
                if (entity.has(`components.${component}`)) {
                    treeViewItem.iconLabel.class.add(`type-${component}`);
                }

                events.push(entity.on(`components.${component}:set`, () => {
                    treeViewItem.iconLabel.class.add(`type-${component}`);
                }));

                events.push(entity.on(`components.${component}:unset`, () => {
                    treeViewItem.iconLabel.class.remove(`type-${component}`);
                }));
            });

            // handle template icons
            if (entity.get('template_id')) {
                treeViewItem.class.add(CLASS_TEMPLATE_INSTANCE);
            } else if (editor.call('templates:isTemplateChild', entity, this._entities)) {
                treeViewItem.class.add(CLASS_TEMPLATE_INSTANCE_CHILD);
            }

            const resetTemplateIcons = () => {
                this._resetTemplateIcons(entity);
            };

            events.push(entity.on('template_ent_ids:set', resetTemplateIcons));
            events.push(entity.on('template_ent_ids:unset', resetTemplateIcons));
            events.push(entity.on('parent:set', resetTemplateIcons));

            // name change
            events.push(entity.on('name:set', name => {
                treeViewItem.text = name;
            }));

            // enabled change
            events.push(entity.on('enabled:set', enabled => {
                treeViewItem.enabled = enabled;
            }));

            // add child
            events.push(entity.on('children:insert', (childId, index) => {
                const item = this.getTreeItemForEntity(childId);
                if (!item) return;

                if (item.parent) {
                    item.parent.remove(item);
                }

                const next = this.getTreeItemForEntity(entity.get(`children.${index + 1}`));
                if (next) {
                    treeViewItem.appendBefore(item, next);
                } else {
                    treeViewItem.append(item);
                }
            }));

            // remove child
            events.push(entity.on('children:remove', childId => {
                const item = this.getTreeItemForEntity(childId);
                if (!item) return;

                treeViewItem.remove(item);
            }));

            // move child
            events.push(entity.on('children:move', (childId, index) => {
                var item = this.getTreeItemForEntity(childId);
                if (!item)
                    return;

                treeViewItem.remove(item);

                let next = this.getTreeItemForEntity(entity.get('children.' + (index + 1)));
                let after = null;
                if (next === item) {
                    next = null;

                    if (index > 0) {
                        after = this.getTreeItemForEntity(entity.get('children.' + index));
                    }
                }

                if (item.parent) {
                    item.parent.remove(item);
                }

                if (next) {
                    treeViewItem.appendBefore(item, next);
                } else if (after) {
                    treeViewItem.appendAfter(item, after);
                } else {
                    treeViewItem.append(item);
                }
            }));

            this._eventsEntity[resourceId] = events;

            // store tree item in index
            this._treeItemIndex[resourceId] = treeViewItem;

            const parent = entity.get('parent');
            if (!parent) {
                // root - wait for this and append it later
                // once we're done with all the children
                // to avoid multiple DOM operations
                this._rootItem = treeViewItem;
            }

            // add children
            entity.get('children').forEach(childId => {
                const item = this.getTreeItemForEntity(childId);
                if (item) {
                    treeViewItem.append(item);
                } else {
                    const child = this._entities.get(childId);
                    if (child) {
                        treeViewItem.append(this._onAddEntity(child));
                    } else {
                        const err = `Cannot find child entity ${childId} of parent "${entity.get('name')}" (${resourceId})`;
                        log.error(err);
                        editor.call('status:error', err);
                    }
                }
            });

            // container for user selection markers
            treeViewItem._containerUsers = new pcui.Container({
                class: CLASS_USER_SELECTION_MARKER_CONTAINER
            });
            treeViewItem._containerContents.append(treeViewItem._containerUsers);

            return treeViewItem;
        }

        _resetTemplateIcons(entity) {
            const item = this.getTreeItemForEntity(entity.get('resource_id'));

            if (item) {
                if (entity.get('template_id')) {
                    item.class.remove(CLASS_TEMPLATE_INSTANCE_CHILD);
                    item.class.add(CLASS_TEMPLATE_INSTANCE);
                    entity.emit('isPartOfTemplate', true);
                } else {
                    item.class.remove(CLASS_TEMPLATE_INSTANCE);
                    if (editor.call('templates:isTemplateChild', entity)) {
                        item.class.add(CLASS_TEMPLATE_INSTANCE_CHILD);
                        entity.emit('isPartOfTemplate', true);
                    } else {
                        item.class.remove(CLASS_TEMPLATE_INSTANCE_CHILD);
                        entity.emit('isPartOfTemplate', false);
                    }
                }
            }

            const children = entity.get('children');
            for (let i = 0; i < children.length; i++) {
                const child = this._entities.get(children[i]);
                if (child) {
                    this._resetTemplateIcons(child);
                }
            }
        }

        _onRemoveEntity(entity) {
            const resourceId = entity.get('resource_id');
            const events = this._eventsEntity[resourceId];
            if (events) {
                events.forEach(e => e.unbind());
                delete this._eventsEntity[resourceId];
            }

            const item = this.getTreeItemForEntity(resourceId);
            if (item) {
                delete this._treeItemIndex[resourceId];
                item.destroy();
            }
        }

        _unbindObserverListEvents() {
            this._eventsObserverList.forEach(e => e.unbind());
            this._eventsObserverList.length = 0;
        }

        _unbindEntityEvents() {
            for (const key in this._eventsEntity) {
                this._eventsEntity[key].forEach(e => e.unbind());
            }

            this._eventsEntity = {};
        }

        _unbindEditorEvents() {
            this._eventsEditor.forEach(e => e.unbind());
            this._eventsEditor.length = 0;
        }

        /**
         * @name pcui.EntitiesTreeView#getTreeItemForEntity
         * @description Gets the tree view item that displays the entity with the specified id.
         * @param {string} resourceId - The entity resource id
         * @returns {pcui.TreeViewItem} The tree view item.
         */
        getTreeItemForEntity(resourceId) {
            const item = this._treeItemIndex[resourceId];
            return item && !item.destroyed ? item : null;
        }

        /**
         * @name pcui.EntitiesTreeView#highlightEntity
         * @description Highlight the tree view item for the entity with the specified id
         * @param {string} resourceId - The entity resource id
         */
        highlightEntity(resourceId) {
            const item = this.getTreeItemForEntity(resourceId);
            if (item) {
                item.class.add(CLASS_HIGHLIGHT);
            }
        }

        /**
         * @name pcui.EntitiesTreeView#unhighlightEntity
         * @description Unhighlight the tree view item for the entity with the specified id
         * @param {string} resourceId - The entity resource id
         */
        unhighlightEntity(resourceId) {
            const item = this.getTreeItemForEntity(resourceId);
            if (item) {
                item.class.remove(CLASS_HIGHLIGHT);
            }
        }

        /**
         * @name pcui.EntitiesTreeView#createDropTarget
         * @description Creates a drop target for the tree view.
         * @param {pcui.Element} targetElement - The element that activates the drop target.
         * @returns {pcui.DropTarget} The drop target.
         */
        createDropTarget(targetElement) {
            var dropTarget = editor.call('drop:target', {
                ref: targetElement,
                filter: (dropType, dropData) => {
                    if (dropType === 'entity') return true;

                    return this._isDraggingValidAssetType(dropType, dropData);
                },
                hole: true,
                passThrough: true
            });
            dropTarget.style.outline = 'none';

            return dropTarget;
        }

        /**
         * @name pcui.EntitiesTreeView#getExpandedState
         * @description Gets dictionary with the expanded state the specified Entity and its children
         * @param {Observer} entity - The entity to query.
         * @returns {object} A dictionary with <resource_id, boolean> entries.
         */
        getExpandedState(entity) {
            const result = {};

            const recurse = (entity) => {
                if (!entity) return;

                const item = this.getTreeItemForEntity(entity.get('resource_id'));
                if (item) {
                    result[entity.get('resource_id')] = item.open;
                }

                const children = entity.get('children');
                for (let i = 0; i < children.length; i++) {
                    recurse(this._entities.get(children[i]));
                }
            };

            recurse(entity);

            return result;
        }

        /**
         * @name pcui.EntitiesTreeView#restoreExpandedState
         * @description Restores the expanded state of an entity and its children
         * @param {object} state - The expanded state returned from getExpandedState()
         */
        restoreExpandedState(state) {
            for (const resourceId in state) {
                const item = this.getTreeItemForEntity(resourceId);
                if (item) {
                    item.open = state[resourceId];
                }
            }
        }

        destroy() {
            if (this._destroyed) return;

            this._unbindObserverListEvents();
            this._unbindEntityEvents();
            this._unbindEditorEvents();

            this.dom.removeEventListener('mouseenter', this._domEvtEntitiesMouseEnter);
            this.dom.removeEventListener('mouseleave', this._domEvtEntitiesMouseLeave);
            window.removeEventListener('mouseup', this._domEvtEntitiesMouseUp);

            this._treeItemIndex = {};

            super.destroy();
        }

        get entities() {
            return this._entities;
        }

        set entities(value) {
            this.clearTreeItems();

            this._rootItem = null;
            this._treeItemIndex = {};
            this._unbindEntityEvents();
            this._unbindObserverListEvents();

            this._entities = value;

            if (this._entities) {
                this._eventsObserverList.push(this._entities.on('add', this._onAddEntity.bind(this)));
                this._eventsObserverList.push(this._entities.on('remove', this._onRemoveEntity.bind(this)));
                this._entities.forEach(entity => this._onAddEntity(entity));

                // append root in the end to avoid multiple DOM operations
                if (this._rootItem) {
                    this.append(this._rootItem);
                }
            }
        }

        get writePermissions() {
            return this._writePermissions;
        }

        set writePermissions(value) {
            if (this._writePermissions === value) return;

            this._writePermissions = value;

            this.allowDrag = value;
            this.allowRenaming = value;

        }
    }

    return {
        EntitiesTreeView: EntitiesTreeView
    };
})());
