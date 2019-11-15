Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'template-entity-inspector';
    const CLASS_HEADER = CLASS_ROOT + '-header';
    const CLASS_CONTAINER = CLASS_ROOT + '-container';
    const CLASS_CONTAINER_TOP = CLASS_ROOT + '-container-top';
    const CLASS_CONTAINER_MIDDLE = CLASS_ROOT + '-container-middle';
    const CLASS_TEMPLATE_ROOT = CLASS_ROOT + '-root';
    const CLASS_OVERRIDES = CLASS_ROOT + '-overrides';
    const CLASS_OVERRIDES_POSITIVE = CLASS_ROOT + '-overrides-positive';
    const CLASS_ENTITY_LIST = CLASS_ROOT + '-entity-list';
    const CLASS_ENTITY_LIST_CLICKED = CLASS_ROOT + '-entity-list-clicked';
    const CLASS_ENTITY_LIST_NAME = CLASS_ROOT + '-entity-list-name';
    const CLASS_ENTITY_LIST_ICON = CLASS_ROOT + '-entity-list-icon';
    const CLASS_ENTITY_LIST_ICON_FONT = CLASS_ROOT + '-entity-list-icon-font';
    const CLASS_BUTTON_VIEW = CLASS_ENTITY_LIST + '-btn-view';
    const CLASS_BUTTON_DROPDOWN = CLASS_ENTITY_LIST + '-btn-dropdown';
    const CLASS_ENTITY_DROPDOWN = CLASS_ENTITY_LIST + '-dropdown';

    class TemplatesEntityInspector extends pcui.Container {
        constructor(args) {
            super(args);
            this.class.add(CLASS_ROOT);

            this._entities = args.entities;
            this._assets = args.assets;
            this._entity = null;
            this._overrides = null;
            this._templateAsset = null;
            this._refreshTimeout = null;

            this._entityEvents = {};

            this._diffView = args.templateOverridesDiffView;

            this.append(new pcui.Label({
                text: 'TEMPLATE INSTANCE',
                class: CLASS_HEADER
            }));

            this._innerContainer = new pcui.Container({
                flex: true,
                class: CLASS_CONTAINER
            });
            this.append(this._innerContainer);

            const containerTop = new pcui.Container({
                flex: true,
                flexDirection: 'row',
                class: CLASS_CONTAINER_TOP
            });
            this._innerContainer.append(containerTop);

            this._labelTemplate = new pcui.Label({
                class: CLASS_TEMPLATE_ROOT,
                binding: new pcui.BindingObserversToElement()
            });
            containerTop.append(this._labelTemplate);

            this._labelTemplate.on('click', this._onTemplateClick.bind(this));

            this._labelOverrides = new pcui.Label({
                class: CLASS_OVERRIDES
            });
            containerTop.append(this._labelOverrides);

            const containerMiddle = new pcui.Container({
                flex: true,
                flexDirection: 'row',
                class: CLASS_CONTAINER_MIDDLE
            });
            this._innerContainer.append(containerMiddle);

            this._btnViewDiff = new pcui.Button({
                text: 'VIEW DIFF',
                size: 'small',
                flexGrow: 1
            });
            this._btnViewDiff.on('click', this._onViewDiffClick.bind(this));
            containerMiddle.append(this._btnViewDiff);

            this._btnRevertAll = new pcui.Button({
                text: 'REVERT ALL',
                size: 'small',
                flexGrow: 1
            });
            this._btnRevertAll.on('click', this._onRevertAllClick.bind(this));
            containerMiddle.append(this._btnRevertAll);

            this._btnApplyAll = new pcui.Button({
                text: 'APPLY ALL',
                size: 'small',
                flexGrow: 1
            });
            this._btnApplyAll.on('click', this._onApplyAllClick.bind(this));
            containerMiddle.append(this._btnApplyAll);

            this._containerEntitiesList = new pcui.Container({
                flex: true,
                class: CLASS_ENTITY_LIST,
                scrollable: true
            });

            this._innerContainer.append(this._containerEntitiesList);

            this._containerEntitiesList.on('scroll', this._onEntitiesListScroll.bind(this));

            this._entityDropdownMenu = new pcui.Container({
                class: CLASS_ENTITY_DROPDOWN,
                flex: true,
                hidden: true
            });
            this._entityDropdownTarget = null;
            this._innerContainer.append(this._entityDropdownMenu);

            this._domEventClickAnywhere = this._onClickWindow.bind(this);
            this._entityDropdownMenu.on('show', () => {
                window.addEventListener('click', this._domEventClickAnywhere);
            });

            this._entityDropdownMenu.on('hide', () => {
                window.removeEventListener('click', this._domEventClickAnywhere);
                this._deselectEntityListItem();
            });

            this._selectedEntityListItem = null;

            this._entities.on('add', this._onEntityAdd.bind(this));
            this._entities.on('remove', this._onEntityRemove.bind(this));

            this._deferRefreshOverrides = () => {
                if (this._refreshTimeout) {
                    clearTimeout(this._refreshTimeout);
                }

                this._refreshTimeout = setTimeout(this._refreshOverrides.bind(this), 50);
            };

            this._eventMessenger = editor.on('messenger:template.apply', this._onTemplateApply.bind(this));
        }

        _onTemplateClick() {
            // select template asset
            if (this._entity) {
                const asset = this._assets.get(this._entity.get('template_id'));
                if (!asset) return;

                editor.call('selector:set', 'asset', [asset]);

                let folder = null;
                if (!folder) {
                    const path = asset.get('path');
                    if (path.length) {
                        folder = this._assets.get(path[path.length - 1]);
                    }
                }

                editor.call('assets:panel:currentFolder', folder);
            }
        }

        _onViewDiffClick() {
            this._showOverrides();
        }

        _onRevertAllClick() {
            editor.call('templates:revertAll', this._entity);
        }

        _onApplyAllClick() {
            this._btnApplyAll.enabled = false;
            if (!editor.call('templates:apply', this._entity)) {
                this._btnApplyAll.enabled = true;
            }
        }

        _onEntitiesListScroll() {
            this._dismissEntityDropdownMenu();
        }

        _onClickWindow(e) {
            if (this._entityDropdownMenu.dom.contains(e.target)) return;

            this._dismissEntityDropdownMenu();
        }

        _deselectEntityListItem() {
            if (!this._selectedEntityListItem) return;
            this._selectedEntityListItem.class.remove(CLASS_ENTITY_LIST_CLICKED);
            this._selectedEntityListItem = null;
        }

        _dismissEntityDropdownMenu() {
            this._entityDropdownMenu.hidden = true;
        }

        _positionEntityDropdownMenu() {
            const rect = this._entityDropdownTarget.dom.getBoundingClientRect();
            const parentRect = this._innerContainer.dom.getBoundingClientRect();
            this._entityDropdownMenu.style.top = `${rect.bottom - parentRect.top}px`;
            this._entityDropdownMenu.style.right = '20px';
        }

        _getOverrideCount() {
            return this._overrides ? this._overrides.totalOverrides : 0;
        }

        _createEntityListItem(data) {
            const container = new pcui.Container({
                flex: true,
                flexDirection: 'row'
            });

            const label = new pcui.Label({
                text: data.name,
                class: CLASS_ENTITY_LIST_NAME
            });
            container.append(label);

            const icon = new pcui.Label({
                class: CLASS_ENTITY_LIST_ICON,
                unsafe: true
            });

            if (data.removed) {
                icon.text = '&#58256;';
                icon.class.add(CLASS_ENTITY_LIST_ICON_FONT);
            } else if (data.added) {
                icon.text = '&#58257;';
                icon.class.add(CLASS_ENTITY_LIST_ICON_FONT);
            } else {
                icon.text = data.overrides.length;
            }
            container.append(icon);

            const btnView = new pcui.Button({
                icon: 'E117',
                class: CLASS_BUTTON_VIEW
            });

            btnView.style.marginLeft = 'auto';
            container.append(btnView);

            btnView.on('click', () => {
                if (!data.resourceId) return;
                const entity = editor.call('entities:get', data.resourceId);
                if (!entity) return;

                editor.call('selector:set', 'entity', [entity]);
            });

            const btnDropdown = new pcui.Button({
                icon: 'E159',
                class: CLASS_BUTTON_DROPDOWN
            });
            // TODO: do not add the dropdown for now
            // because it complicates applying and reverting when done per
            // entity instead of per conflict
            // container.append(btnDropdown);

            if (!data.resourceId) {
                btnView.style.visibility = 'hidden';
                btnDropdown.style.marginLeft = 'auto';
            }

            // find all parent templates where overrides can be applied
            let parentTemplates;
            if (data.added) {
                parentTemplates = editor.call('templates:findApplyCandidatesForNewEntity', this._entity, data.added, this._entities);
            } else if (data.removed) {
                parentTemplates = editor.call('templates:findApplyCandidatesForDeletedEntity', this._entity, data.removed, this._entities);
            } else {
                parentTemplates = editor.call('templates:findApplyCandidatesForOverride', data.overrides[0], this._entities, this._entity);
            }

            btnDropdown.on('click', (e) => {
                e.stopPropagation();

                this._deselectEntityListItem();

                if (this._entityDropdownTarget === btnDropdown) {
                    this._entityDropdownMenu.hidden = !this._entityDropdownMenu.hidden;
                } else {
                    this._entityDropdownMenu.hidden = false;
                    this._entityDropdownTarget = btnDropdown;
                }

                if (!this._entityDropdownMenu.hidden) {

                    this._selectedEntityListItem = container;
                    this._selectedEntityListItem.class.add(CLASS_ENTITY_LIST_CLICKED);

                    this._entityDropdownMenu.clear();

                    parentTemplates.forEach(entity => {
                        const menuItem = new pcui.Label({
                            text: `Apply to ${entity.get('name')}`
                        });
                        menuItem.on('click', () => {
                            // TODO
                        });
                        this._entityDropdownMenu.append(menuItem);
                    });

                    const revert = new pcui.Label({
                        text: 'Revert'
                    });
                    revert.on('click', () => {
                        if (data.added) {
                            editor.call('templates:revertNewEntity', data.added.resource_id, this._entities);
                        } else if (data.removed) {
                            // TODO
                        } else {
                            editor.call('templates:revertOverrides', data.overrides, this._entities);
                        }
                    });

                    this._entityDropdownMenu.append(revert);

                    this._positionEntityDropdownMenu();
                }
            });

            return {
                item: container,
                name: data.name.toLowerCase()
            };
        }

        _refreshOverrides() {
            if (this._refreshTimeout) {
                clearTimeout(this._refreshTimeout);
                this._refreshTimeout = null;
            }

            this._btnApplyAll.enabled = true;

            // check if entity is no longer linked to template
            if (this._entity && !this._entity.get('template_id')) {
                this._overrides = null;
                this.hidden = true;
                return;
            }

            this.hidden = false;

            if (!this._entity) {
                this._overrides = null;
            } else {
                this._overrides = editor.call('templates:computeFilteredOverrides', this._entity);
                console.log(this._overrides);
            }

            const count = this._getOverrideCount();
            if (count === 0) {
                this._labelOverrides.text = 'No Overrides';
            } else if (count === 1) {
                this._labelOverrides.text = '1 Override';
            } else {
                this._labelOverrides.text = count + ' Overrides';
            }

            this._entityDropdownMenu.hidden = true;
            this._containerEntitiesList.clear();

            if (count) {
                this._btnApplyAll.hidden = false;
                this._btnViewDiff.hidden = false;
                this._btnRevertAll.hidden = false;

                this.class.add(CLASS_OVERRIDES_POSITIVE);
                const entities = {};
                this._overrides.conflicts.forEach(override => {
                    if (!entities[override.resource_id]) {
                        entities[override.resource_id] = [];
                    }

                    entities[override.resource_id].push(override);
                });

                const listItems = [];

                // show entities with overrides
                for (const key in entities) {
                    const entity = this._entities.get(key);
                    listItems.push(this._createEntityListItem({
                        name: entity.get('name'),
                        resourceId: key,
                        overrides: entities[key]
                    }));
                }

                // show new entities
                this._overrides.addedEntities.forEach(entity => {
                    listItems.push(this._createEntityListItem({
                        name: entity.name,
                        resourceId: entity.resource_id,
                        added: entity
                    }));
                });

                // show deleted entities
                this._overrides.deletedEntities.forEach(entity => {
                    listItems.push(this._createEntityListItem({
                        name: entity.name,
                        removed: entity
                    }));
                });

                // sort list items by name and add them to the container
                listItems.sort((a, b) => {
                    if (a.name < b.name) return -1;
                    if (a.name > b.name) return 1;
                    return 0;
                })
                .forEach(l => {
                    this._containerEntitiesList.append(l.item);
                });

                if (!this._diffView.hidden) {
                    this._showOverrides();
                }

            } else {
                this.class.remove(CLASS_OVERRIDES_POSITIVE);

                this._btnApplyAll.hidden = true;
                this._btnViewDiff.hidden = true;
                this._btnRevertAll.hidden = true;

                this._diffView.hidden = true;
            }
        }

        _onTemplateApply(data) {
            if (this.hidden) return;

            if (this._entity.get('resource_id') !== data.entity_id) return;

            this._deferRefreshOverrides();
        }

        _isDescendant(entity, parent) {
            while (true) {
                if (!entity || !entity.get('parent')) {
                    break;
                }

                if (parent.get('children').indexOf(entity.get('resource_id')) !== -1) {
                    return true;
                }

                if (entity.get('parent')) {
                    entity = this._entities.get(entity.get('parent'));
                }
            }

            return false;
        }

        _onEntityAdd(entity) {
            if (!this._entity) return;

            if (this._isDescendant(entity, this._entity)) {
                this._bindEntityEvents(entity);
            }
        }

        _onEntityRemove(entity) {
            this._unbindEntityEvents(entity);
        }

        _bindEntityEvents(entity) {
            if (this._entityEvents[entity.get('resource_id')]) return;

            const entry = [];
            this._entityEvents[entity.get('resource_id')] = entry;

            if (entity === this._entity) {
                const onTemplateChange = () => {
                    this._unbindEntityEvents(this._entity);
                    this._bindEntityEventsRecursively(this._entity);
                };

                entry.push(entity.on('template_ent_ids:set', onTemplateChange));
                entry.push(entity.on('template_ent_ids:unset', onTemplateChange));

                if (!entity.get('template_id')) return;
            }

            entry.push(entity.on('*:set', this._deferRefreshOverrides));
            entry.push(entity.on('*:unset', this._deferRefreshOverrides));
            entry.push(entity.on('*:insert', this._deferRefreshOverrides));
            entry.push(entity.on('*:remove', this._deferRefreshOverrides));
            entry.push(entity.on('*:move', this._deferRefreshOverrides));
        }

        _bindEntityEventsRecursively(entity) {
            this._bindEntityEvents(entity);

            if (entity === this._entity && !entity.get('template_id')) return;

            for (const id of entity.get('children')) {
                const child = this._entities.get(id);
                if (child) {
                    this._bindEntityEventsRecursively(child);
                }
            }
        }

        _unbindEntityEvents(entity) {
            // if entity is null then unbind all events
            if (!entity) {
                for (const key in this._entityEvents) {
                    this._entityEvents[key].forEach(e => e.unbind());
                }
                this._entityEvents = {};
                return;
            }

            const entry = this._entityEvents[entity.get('resource_id')];
            if (entry) {
                entry.forEach(e => e.unbind());
                delete this._entityEvents[entity.get('resource_id')];
            }
        }

        _showOverrides() {
            if (!this._getOverrideCount()) return;
            this._diffView.hidden = false;
            this._diffView.showOverrides(this._overrides, this._templateAsset, this._entity);
        }

        destroy() {
            if (this._destroyed) return;

            this._eventMessenger.unbind();
            this._eventMessenger = null;

            window.removeEventListener('click', this._domEventClickAnywhere);
            super.destroy();
        }

        set entity(value) {
            if (this._entity) {
                this._unbindEntityEvents();
            }

            this._entity = value;

            if (this._entity) {
                this.hidden = false;
                if (this._entity.get('template_id')) {
                    this._templateAsset = this._assets.get(this._entity.get('template_id'));
                    this._labelTemplate.link(this._templateAsset, 'name');
                }
                this._bindEntityEventsRecursively(this._entity);
            } else {
                this._entity = null;
                this.hidden = true;
                this._labelTemplate.unlink();
            }

            this._refreshOverrides();
        }
    }

    return {
        TemplatesEntityInspector: TemplatesEntityInspector
    };
})());
