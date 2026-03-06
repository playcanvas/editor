import type { Observer, ObserverList, EventHandle } from '@playcanvas/observer';
import { Element, TreeView, TreeViewItem, type TreeViewArgs, type ReparentedItem, Container } from '@playcanvas/pcui';

import type { DropManager } from '@/common/pcui/element/element-drop-manager';
import type { DropTarget } from '@/common/pcui/element/element-drop-target';
import type { History } from '@/editor-api';

import { getMap, searchItems } from '../search/search-advanced';

const CLASS_ROOT = 'entities-treeview';
const CLASS_COMPONENT_ICON = 'component-icon-postfix';
const CLASS_TEMPLATE_INSTANCE = 'template-instance';
const CLASS_TEMPLATE_INSTANCE_CHILD = `${CLASS_TEMPLATE_INSTANCE}-child`;
const CLASS_HIGHLIGHT = `${CLASS_ROOT}-highlight`;
const CLASS_USER_SELECTION_MARKER = `${CLASS_ROOT}-user-marker`;
const CLASS_USER_SELECTION_MARKER_CONTAINER = `${CLASS_USER_SELECTION_MARKER}-container`;
const CLASS_FILTERING = 'pcui-treeview-filtering';
const CLASS_FILTER_RESULT = `${CLASS_FILTERING}-result`;

const DROPPABLE_ASSET_TYPES = new Set(['template', 'model', 'sprite']);
const DROPPABLE_DROP_TYPES = new Set([...DROPPABLE_ASSET_TYPES].map(t => `asset.${t}`));

interface EntityTreeViewItem extends TreeViewItem {
    entity: Observer;
    _containerUsers: Container;
}

interface EntitiesTreeViewArgs extends TreeViewArgs {
    entities?: ObserverList;
    assets: ObserverList;
    history?: History;
    dropManager?: DropManager;
    writePermissions?: boolean;
}

/**
 * Represents the Entity TreeView that shows the Scene hierarchy.
 */
class EntitiesTreeView extends TreeView {
    private _eventsEditor: EventHandle[] = [];

    private _eventsObserverList: EventHandle[] = [];

    private _eventsEntity = new Map<string, EventHandle[]>();

    private _rootItem: EntityTreeViewItem | null = null;

    private _treeItemIndex = new Map<string, EntityTreeViewItem>();

    private _userSelectionMarkers: Record<string, { color: string; markers: Element[]; pool: Element[] }> = {};

    private _componentList: string[];

    private _suspendSelectionEvents = false;

    private _entities: ObserverList | null = null;

    private _assets: ObserverList;

    private _history: History | undefined;

    private _dropManager: DropManager | undefined;

    private _dropType: string | null = null;

    private _dropData: any = null;

    private _writePermissions!: boolean;

    private _searchFilters = new Set<string>();

    private _fuzzy = true;

    constructor(args: Readonly<EntitiesTreeViewArgs>) {
        super(args);

        this.class.add(CLASS_ROOT);

        this._componentList = editor.call('components:list');

        if (args.entities) {
            this.entities = args.entities;
        }

        this._assets = args.assets;

        this._history = args.history;
        this._dropManager = args.dropManager;

        this.on('rename', this._onRename);

        this.on('dragstart', this._onStartDrag);
        this.on('dragend', this._onEndDrag);

        this.on('select', this._onSelectEntityItem);
        this.on('deselect', this._onDeselectEntityItem);

        this._onReparentFn = this._onReparent;

        this._eventsEditor.push(editor.on('selector:change', this._onSelectorChange));
        this._eventsEditor.push(editor.on('selector:sync', this._onSelectorSync));
        this._eventsEditor.push(editor.on('whoisonline:remove', this._onUserOffline));

        if (this._dropManager) {
            this._eventsEditor.push(this._dropManager.on('activate', this._onActivateDropManager));
            this._eventsEditor.push(this._dropManager.on('deactivate', this._onDeactivateDropManager));
        }

        this.writePermissions = !!args.writePermissions;
    }

    _onRename = (item: EntityTreeViewItem, name: string) => {
        if (item.entity) {
            item.entity.set('name', name);
        }
    };

    _onReparent = (reparentedItems: ReparentedItem[]) => {
        const newParentTemplates: Record<string, Observer> = {};

        for (let i = 0; i < reparentedItems.length; i++) {
            const item = reparentedItems[i].item as EntityTreeViewItem;
            const newParent = reparentedItems[i].newParent as EntityTreeViewItem;
            const templateRoot = editor.call('templates:isTemplateChild', item.entity, this._entities);
            if (templateRoot) {
                const newParentId = newParent.entity.get('resource_id');
                if (!newParentTemplates.hasOwnProperty(newParentId)) {
                    if (newParent.entity.get('template_id')) {
                        newParentTemplates[newParentId] = newParent.entity;
                    } else {
                        newParentTemplates[newParentId] = editor.call('templates:isTemplateChild', newParent.entity, this._entities);
                    }
                }

                if (templateRoot !== newParentTemplates[newParentId]) {
                    editor.call(
                        'picker:confirm',
                        'Entities that are part of a Template cannot be reparented outside the Template.',
                        () => {},
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

        const items = reparentedItems
        .map((reparented) => {
            return {
                entity: (reparented.item as EntityTreeViewItem).entity,
                parent: (reparented.newParent as EntityTreeViewItem).entity,
                index: reparented.newChildIndex
            };
        });

        editor.call('entities:reparent', items, preserveTransform);

        editor.call('viewport:render');
    };

    _onStartDrag = (dragItems: EntityTreeViewItem[]) => {
        editor.call('drop:set', 'entity', {
            resource_id: dragItems[0].entity.get('resource_id')
        });
        editor.call('drop:activate', true);
    };

    _onEndDrag = () => {
        editor.call('drop:activate', false);
        editor.call('drop:set');
    };

    _onSelectEntityItem = (item: EntityTreeViewItem) => {
        if (this._suspendSelectionEvents) {
            return;
        }

        editor.call('selector:add', 'entity', item.entity);
    };

    _onDeselectEntityItem = (item: EntityTreeViewItem) => {
        if (this._suspendSelectionEvents) {
            return;
        }

        editor.call('selector:remove', item.entity);
    };

    _onSelectorChange = (type: string, entities: Observer[]) => {
        if (type !== 'entity') {
            this._suspendSelectionEvents = true;
            this.deselect();
            this._suspendSelectionEvents = false;
            return;
        }

        this._suspendSelectionEvents = true;

        const selectedIds = new Set(entities.map(e => e.get('resource_id')));

        // deselect entities no longer in the new selection
        const selected = this._selectedItems as EntityTreeViewItem[];
        let i = selected.length;
        while (i--) {
            if (!selected[i]) {
                continue;
            }
            if (!selectedIds.has(selected[i].entity.get('resource_id'))) {
                selected[i].selected = false;
            }
        }

        // select entities in the new selection
        let lastItem: TreeViewItem | null = null;
        entities.forEach((entity) => {
            const item = this.getTreeItemForEntity(entity.get('resource_id'));
            if (item) {
                if (!item.selected) {
                    item.selected = true;
                }
                lastItem = item;
            }
        });

        this._suspendSelectionEvents = false;

        if (lastItem) {
            // preserve scrollLeft to prevent horizontal scrolling (#1859)
            const scrollEl = this._dragScrollElement.dom;
            const prevScrollLeft = scrollEl.scrollLeft;
            lastItem.content.dom.scrollIntoView({ block: 'nearest' });
            scrollEl.scrollLeft = prevScrollLeft;
        }
    };

    _onSelectorSync = (user: string, data: { type?: string; ids?: string[] }) => {
        if (this._userSelectionMarkers[user]) {
            this._userSelectionMarkers[user].markers.forEach((marker) => {
                if (!marker.destroyed) {
                    (marker.parent as Container).remove(marker);
                    this._userSelectionMarkers[user].pool.push(marker);
                }
            });

            this._userSelectionMarkers[user].markers.length = 0;
        }

        if (data.type !== 'entity') {
            return;
        }

        if (!this._userSelectionMarkers[user]) {
            this._userSelectionMarkers[user] = {
                color: editor.call('users:color', user, 'hex'),
                markers: [],
                pool: []
            };
        }

        if (!data.ids) {
            return;
        }

        data.ids.forEach((resourceId) => {
            const item = this.getTreeItemForEntity(resourceId);
            if (!item) {
                return;
            }

            let marker = this._userSelectionMarkers[user].pool.pop();
            if (!marker) {
                marker = new Element({
                    dom: 'span',
                    class: CLASS_USER_SELECTION_MARKER
                });
                marker.style.backgroundColor = this._userSelectionMarkers[user].color;
            }

            this._userSelectionMarkers[user].markers.push(marker);
            (item as EntityTreeViewItem)._containerUsers.append(marker);
        });
    };

    _onUserOffline = (userId: string) => {
        if (!this._userSelectionMarkers[userId]) {
            return;
        }

        this._userSelectionMarkers[userId].markers.forEach((marker) => {
            marker.destroy();
        });

        delete this._userSelectionMarkers[userId];
    };

    _onActivateDropManager = () => {
        if (!this._writePermissions) {
            return;
        }

        this.dom.removeEventListener('mouseenter', this._onEntitiesMouseEnter);
        this.dom.removeEventListener('mouseleave', this._onEntitiesMouseLeave);

        this.dom.addEventListener('mouseenter', this._onEntitiesMouseEnter);
        this.dom.addEventListener('mouseleave', this._onEntitiesMouseLeave);
    };

    _onDeactivateDropManager = () => {
        this.dom.removeEventListener('mouseenter', this._onEntitiesMouseEnter);
        this.dom.removeEventListener('mouseleave', this._onEntitiesMouseLeave);
    };

    _onEntitiesMouseEnter = (evt: MouseEvent) => {
        this._dropType = this._dropManager!.dropType;
        this._dropData = this._dropManager!.dropData;
        if (!this._isDraggingValidAssetType(this._dropType, this._dropData)) {
            return;
        }

        if (this._dropData) {
            this.isDragging = true;
            window.removeEventListener('mouseup', this._onEntitiesMouseUp);
            window.addEventListener('mouseup', this._onEntitiesMouseUp);
        }
    };

    _onEntitiesMouseUp = (evt: MouseEvent) => {
        window.removeEventListener('mouseup', this._onEntitiesMouseUp);

        if (!this.isDragging) {
            return;
        }

        let dragOverItem = this._dragOverItem as EntityTreeViewItem | null;
        const dragArea = this._dragArea;
        const dropType = this._dropType;
        const dropData = this._dropData;

        this._dropType = null;
        this._dropData = null;

        this.isDragging = false;

        if (!this.dom.contains(evt.target as Node)) {
            return;
        }

        if (!dragOverItem) {
            if (!this._rootItem) {
                return;
            }

            dragOverItem = this._rootItem;
        }

        if (!dropType || !dropData) {
            return;
        }

        this._instantiateDraggedAssets(dragOverItem, dragArea, dropType, dropData);
    };

    _selectEntitiesById(entityIds: string[]) {
        const entities = entityIds.map(id => this._entities.get(id)).filter(entity => entity);
        if (entities.length) {
            editor.call('selector:history', false);
            editor.call('selector:set', 'entity', entities);
            editor.once('selector:change', () => {
                editor.call('selector:history', true);
            });
        }
    }

    _getSearchFilterMap(searchArr: [string, TreeViewItem][], key: string) {
        return getMap(searchArr, key);
    }

    // Override PCUI function
    _searchItems(rawArray: TreeViewItem[], filter: string) {
        const searchArr: [string, TreeViewItem][] = rawArray.map(item => [item.text, item]);

        let results: TreeViewItem[] = [];

        for (const key of this._searchFilters) {
            if (this._searchFilters.size === 1) {
                results = searchItems(this._getSearchFilterMap(searchArr, key), filter, { fuzzy: this._fuzzy });
            } else {
                results = results.concat(searchItems(this._getSearchFilterMap(searchArr, key), filter, { fuzzy: this._fuzzy }));
            }
        }

        if (!results.length) {
            return;
        }
        results.forEach((item) => {
            this._filterResults.push(item);
            item.class.add(CLASS_FILTER_RESULT);
        });
    }

    setFilter(key: string, value: boolean) {
        if (value) {
            this._searchFilters.add(key);
        } else {
            this._searchFilters.delete(key);
        }
    }

    setFuzzy(value: boolean) {
        this._fuzzy = value;
    }

    getFilter(key: string) {
        return this._searchFilters.has(key);
    }

    _instantiateDraggedAssets(dragOverItem: EntityTreeViewItem, dragArea: string, dropType: string, dropData: { id?: string; ids?: string[] }) {
        let parent = dragOverItem.entity;
        let childIndex;

        if (dragArea === 'before') {
            const parentItem = dragOverItem.parent as EntityTreeViewItem;
            parent = parentItem.entity;
            childIndex = Array.prototype.indexOf.call(parentItem.dom.childNodes, dragOverItem.dom) - 1;
        } else if (dragArea === 'after') {
            const parentItem = dragOverItem.parent as EntityTreeViewItem;
            parent = parentItem.entity;
            childIndex = Array.prototype.indexOf.call(parentItem.dom.childNodes, dragOverItem.dom) + 1;
        }

        let assets: Observer[] = [];
        if (dropType === 'assets') {
            if (!dropData.ids) {
                return;
            }
            assets = dropData.ids
            .map(id => this._assets.get(id))
            .filter((asset): asset is Observer => {
                return asset ? DROPPABLE_ASSET_TYPES.has(asset.get('type')) : false;
            });
        } else if (DROPPABLE_DROP_TYPES.has(dropType)) {

            const asset = this._assets.get(dropData.id);
            if (asset) {
                assets.push(asset);
            }
        }

        if (!assets.length) {
            return;
        }

        let newEntityIds: string[] | null;

        const undo = () => {
            newEntityIds!.forEach((id) => {
                const entity = this._entities.get(id);
                if (entity) {
                    (entity as any).apiEntity.delete({ history: false });
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
            if (!parent) {
                return;
            }

            const templates: Observer[] = [];
            assets.forEach((asset) => {
                try {
                    if (asset.get('type') === 'template') {
                        templates.push(asset);
                    } else if (asset.get('type') === 'model') {
                        newEntityIds!.push(this._instantiateDraggedModelAsset(asset, parent, childIndex));
                    } else if (asset.get('type') === 'sprite') {
                        newEntityIds!.push(this._instantiateDraggedSpriteAsset(asset, parent, childIndex));
                    }
                } catch (err) {
                    log.error(err);
                }
            });

            if (templates.length) {
                this._instantiateDraggedTemplateAssets(templates, parent, childIndex, (entityIds) => {
                    if (newEntityIds) {
                        newEntityIds = newEntityIds.concat(entityIds);
                        this._selectEntitiesById(newEntityIds);
                    }
                });
            }

            this._selectEntitiesById(newEntityIds!);
        };

        if (this._history) {
            this._history.add({
                name: 'drop assets',
                undo: undo,
                redo: redo,
                combine: false
            });
        }

        redo();
    }

    _instantiateDraggedTemplateAssets(assets: Observer[], parentEntity: Observer, childIndex: number | undefined, callback: (entityIds: string[]) => void) {
        if (childIndex === null || childIndex === undefined) {
            childIndex = parentEntity.get('children').length;
        }

        editor.api.globals.assets.instantiateTemplates(assets.map(a => (a as any).apiAsset), (parentEntity as any).apiEntity, {
            index: childIndex,
            history: false
        })
        .then((newEntities) => {
            callback(newEntities.map(e => e.get('resource_id')));
        });
    }

    _instantiateDraggedModelAsset(asset: Observer, parentEntity: Observer, childIndex: number) {
        const component = editor.call('components:getDefault', 'model');
        component.type = 'asset';
        component.asset = parseInt(asset.get('id'), 10);

        const name = (asset.get('name') as string).replace(/\.(json|glb)$/i, '') || 'Untitled';

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

    _instantiateDraggedSpriteAsset(asset: Observer, parentEntity: Observer, childIndex: number) {
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

    _onEntitiesMouseLeave = (evt: MouseEvent) => {
        window.removeEventListener('mouseup', this._onEntitiesMouseUp);

        const dropType = this._dropType;
        const dropData = this._dropData;
        this._dropType = null;
        this._dropData = null;
        if (this._isDraggingValidAssetType(dropType, dropData)) {
            this.isDragging = false;
        }
    };

    _isDraggingValidAssetType(dropType: string | null, dropData: { id?: string; ids?: string[] } | null) {
        if (!this._writePermissions) {
            return false;
        }

        if (dropType === 'assets') {
            if (!dropData?.ids) {
                return false;
            }
            return dropData.ids.some((id) => {
                const asset = this._assets.get(id);
                return asset && DROPPABLE_ASSET_TYPES.has(asset.get('type'));
            });
        }
        return DROPPABLE_DROP_TYPES.has(dropType!);
    }

    /**
     * Returns whether any parent in the entity's hierarchy is disabled.
     *
     * @param entity - The entity to check.
     * @returns True if a parent is disabled, false otherwise.
     */
    _isParentDisabled(entity: Observer): boolean {
        let parentId = entity.get('parent');
        while (parentId) {
            const parent = this._entities.get(parentId);
            if (!parent) {
                break;
            }
            if (!parent.get('enabled')) {
                return true;
            }
            parentId = parent.get('parent');
        }
        return false;
    }

    /**
     * Updates the visual enabled state of an entity's tree item and optionally its descendants.
     * The visual state reflects whether the entity is effectively enabled in the hierarchy
     * (its own enabled flag AND all parents being enabled).
     *
     * @param entity - The entity whose tree item to update.
     * @param parentDisabled - Whether a parent in the hierarchy is disabled.
     * If not provided, it will be calculated.
     * @param recurse - Whether to recursively update descendants.
     */
    _updateTreeItemEnabledState(entity: Observer, parentDisabled?: boolean, recurse: boolean = false): void {
        const item = this.getTreeItemForEntity(entity.get('resource_id'));
        if (!item) {
            return;
        }

        const effectiveParentDisabled = parentDisabled ?? this._isParentDisabled(entity);

        item.enabled = entity.get('enabled') && !effectiveParentDisabled;

        if (recurse) {
            const childParentDisabled = !entity.get('enabled') || effectiveParentDisabled;
            entity.get('children').forEach((childId: string) => {
                const child = this._entities.get(childId);
                if (child) {
                    this._updateTreeItemEnabledState(child, childParentDisabled, true);
                }
            });
        }
    }

    _onAddEntity(entity: Observer) {
        const resourceId = entity.get('resource_id');
        if (this._treeItemIndex.has(resourceId)) {
            return this._treeItemIndex.get(resourceId)!;
        }

        const parentDisabled = this._isParentDisabled(entity);
        const treeViewItem = new TreeViewItem({
            allowSelect: true,
            allowDrop: true,
            text: entity.get('name'),
            enabled: entity.get('enabled') && !parentDisabled
        }) as EntityTreeViewItem;

        treeViewItem.iconLabel.class.add(CLASS_COMPONENT_ICON);

        treeViewItem.entity = entity;

        const events: EventHandle[] = [];

        this._componentList.forEach((component) => {
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

        events.push(entity.on('name:set', (name: string) => {
            treeViewItem.text = name;
        }));

        events.push(entity.on('enabled:set', () => {
            this._updateTreeItemEnabledState(entity, undefined, true);
        }));

        events.push(entity.on('parent:set', () => {
            this._updateTreeItemEnabledState(entity, undefined, true);
        }));

        events.push(entity.on('children:insert', (childId: string, index: number) => {
            const item = this.getTreeItemForEntity(childId);
            if (!item) {
                return;
            }

            if (item.parent) {
                (item.parent as Container).remove(item);
            }

            const next = this.getTreeItemForEntity(entity.get(`children.${index + 1}`));
            if (next) {
                treeViewItem.appendBefore(item, next);
            } else {
                treeViewItem.append(item);
            }
        }));

        events.push(entity.on('children:remove', (childId: string) => {
            const item = this.getTreeItemForEntity(childId);
            if (!item) {
                return;
            }

            treeViewItem.remove(item);
        }));

        events.push(entity.on('children:move', (childId: string, index: number) => {
            const item = this.getTreeItemForEntity(childId);
            if (!item) {
                return;
            }

            treeViewItem.remove(item);

            let next = this.getTreeItemForEntity(entity.get(`children.${index + 1}`));
            let after: EntityTreeViewItem | null = null;
            if (next === item) {
                next = null;

                if (index > 0) {
                    after = this.getTreeItemForEntity(entity.get(`children.${index}`));
                }
            }

            if (item.parent) {
                (item.parent as Container).remove(item);
            }

            if (next) {
                treeViewItem.appendBefore(item, next);
            } else if (after) {
                treeViewItem.appendAfter(item, after);
            } else {
                treeViewItem.append(item);
            }
        }));

        this._eventsEntity.set(resourceId, events);

        this._treeItemIndex.set(resourceId, treeViewItem);

        const parent = entity.get('parent');
        if (!parent) {
            this._rootItem = treeViewItem;

            this._rootItem.open = true;
        }

        entity.get('children').forEach((childId: string) => {
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

        treeViewItem._containerUsers = new Container({
            class: CLASS_USER_SELECTION_MARKER_CONTAINER
        });
        treeViewItem.content.append(treeViewItem._containerUsers);

        return treeViewItem;
    }

    _resetTemplateIcons(entity: Observer) {
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

    _onRemoveEntity(entity: Observer) {
        const resourceId = entity.get('resource_id');
        const events = this._eventsEntity.get(resourceId);
        if (events) {
            events.forEach(e => e.unbind());
            this._eventsEntity.delete(resourceId);
        }

        const item = this.getTreeItemForEntity(resourceId);
        if (item) {
            this._treeItemIndex.delete(resourceId);
            item.destroy();
        }
    }

    _unbindObserverListEvents() {
        this._eventsObserverList.forEach(e => e.unbind());
        this._eventsObserverList.length = 0;
    }

    _unbindEntityEvents() {
        for (const events of this._eventsEntity.values()) {
            events.forEach(e => e.unbind());
        }

        this._eventsEntity.clear();
    }

    _unbindEditorEvents() {
        this._eventsEditor.forEach(e => e.unbind());
        this._eventsEditor.length = 0;
    }

    /**
     * Gets the tree view item that displays the entity with the specified id.
     *
     * @param resourceId - The entity resource id.
     * @returns The tree view item.
     */
    getTreeItemForEntity(resourceId: string): EntityTreeViewItem | null {
        const item = this._treeItemIndex.get(resourceId);
        return item && !item.destroyed ? item : null;
    }

    /**
     * Highlight the tree view item for the entity with the specified id.
     *
     * @param resourceId - The entity resource id.
     */
    highlightEntity(resourceId: string): void {
        const item = this.getTreeItemForEntity(resourceId);
        if (item) {
            item.class.add(CLASS_HIGHLIGHT);
        }
    }

    /**
     * Unhighlight the tree view item for the entity with the specified id.
     *
     * @param resourceId - The entity resource id.
     */
    unhighlightEntity(resourceId: string): void {
        const item = this.getTreeItemForEntity(resourceId);
        if (item) {
            item.class.remove(CLASS_HIGHLIGHT);
        }
    }

    /**
     * Creates a drop target for the tree view.
     *
     * @param targetElement - The element that activates the drop target.
     * @returns The drop target.
     */
    createDropTarget(targetElement: Element): DropTarget {
        const dropTarget = editor.call('drop:target', {
            ref: targetElement,
            filter: (dropType: string, dropData: any) => {
                if (dropType === 'entity') {
                    return true;
                }

                return this._isDraggingValidAssetType(dropType, dropData);
            },
            hole: true,
            passThrough: true
        });
        dropTarget.style.outline = 'none';

        return dropTarget;
    }

    /**
     * Gets dictionary with the expanded state the specified Entity and its children.
     *
     * @param entity - The entity to query.
     * @returns A dictionary with <resource_id, boolean> entries.
     */
    getExpandedState(entity: Observer): Record<string, boolean> {
        const result: Record<string, boolean> = {};

        const recurse = (entity: Observer) => {
            if (!entity) {
                return;
            }

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
     * Restores the expanded state of an entity and its children.
     *
     * @param state - The expanded state returned from getExpandedState()
     */
    restoreExpandedState(state: Record<string, boolean>): void {
        for (const resourceId in state) {
            const item = this.getTreeItemForEntity(resourceId);
            if (item) {
                item.open = state[resourceId];
            }
        }
    }

    destroy() {
        if (this._destroyed) {
            return;
        }

        this._unbindObserverListEvents();
        this._unbindEntityEvents();
        this._unbindEditorEvents();

        this.dom.removeEventListener('mouseenter', this._onEntitiesMouseEnter);
        this.dom.removeEventListener('mouseleave', this._onEntitiesMouseLeave);
        window.removeEventListener('mouseup', this._onEntitiesMouseUp);

        this._treeItemIndex.clear();

        super.destroy();
    }

    /**
     * The entities observer list.
     */
    set entities(value: ObserverList | null) {
        this.clearTreeItems();

        this._rootItem = null;
        this._treeItemIndex.clear();
        this._unbindEntityEvents();
        this._unbindObserverListEvents();

        this._entities = value;

        if (this._entities) {
            this._eventsObserverList.push(this._entities.on('add', this._onAddEntity.bind(this)));
            this._eventsObserverList.push(this._entities.on('remove', this._onRemoveEntity.bind(this)));
            this._entities.forEach(entity => this._onAddEntity(entity));

            if (this._rootItem) {
                this.append(this._rootItem);
            }
        }
    }

    get entities() {
        return this._entities;
    }

    set writePermissions(value: boolean) {
        if (this._writePermissions === value) {
            return;
        }

        this._writePermissions = value;

        this.allowDrag = value;
        this.allowRenaming = value;

    }

    get writePermissions() {
        return this._writePermissions;
    }
}

export { EntitiesTreeView };
