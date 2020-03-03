Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'batchgroups-settings-panel';
    const CLASS_ITEM = CLASS_ROOT + '-item';

    const ATTRIBUTES = [{
        label: '',
        alias: 'addGroupButton',
        type: 'button',
        args: {
            text: 'ADD GROUP',
            icon: 'E120'
        }
    }];

    class BatchgroupsSettingsPanel extends pcui.BaseSettingsPanel {
        constructor(args) {
            args = Object.assign({}, args);
            args.headerText = 'BATCH GROUPS';
            args.attributes = ATTRIBUTES;

            super(args);

            this._items = [];
            this._evts = [];

            this._itemsContainer = new pcui.Container();
            this.prepend(this._itemsContainer);

            this._attributesInspector.getField('addGroupButton').on('click', () => {
                this._addItem();
            });
        }

        _addItem() {
            const batchGroups = this._projectSettings.get('batchGroups');
            // calculate id of new group and new name
            let id = 100000;
            for (const key in batchGroups) {
                id = Math.max(parseInt(key, 10) + 1, id);
            }
            this._projectSettings.set('batchGroups.' + id, {
                id: id,
                name: 'New Batch Group',
                maxAabbSize: 100,
                dynamic: true
            });
        }

        removeItem(groupId) {
            const projectSettings = this._projectSettings;
            const oldValue = projectSettings.get('batchGroups.' + groupId);
            const affectedModels = [];
            const affectedElements = [];

            const redo = () => {
                projectSettings.latest();
                const settingsHistory = projectSettings.history.enabled;
                projectSettings.history.enabled = false;
                projectSettings.unset('batchGroups.' + groupId);
                projectSettings.history.enabled = settingsHistory;

                const entities = editor.call('entities:list');
                for (let i = 0, len = entities.length; i < len; i++) {
                    const entity = entities[i];

                    if (entity.get('components.model.batchGroupId') === groupId) {
                        const history = entity.history.enabled;
                        entity.history.enabled = false;
                        affectedModels.push(entity.get('resource_id'));
                        entity.set('components.model.batchGroupId', null);
                        entity.history.enabled = history;
                    }

                    if (entity.get('components.element.batchGroupId') === groupId) {
                        const history = entity.history.enabled;
                        entity.history.enabled = false;
                        affectedElements.push(entity.get('resource_id'));
                        entity.set('components.element.batchGroupId', null);
                        entity.history.enabled = history;
                    }
                }
            };

            const undo = () => {
                projectSettings.latest();
                var settingsHistory = projectSettings.history.enabled;
                projectSettings.history.enabled = false;
                projectSettings.set('batchGroups.' + groupId, oldValue);
                projectSettings.history.enabled = settingsHistory;

                for (let i = 0, len = affectedModels.length; i < len; i++) {
                    const entity = editor.call('entities:get', affectedModels[i]);
                    if (! entity) continue;

                    const history = entity.history.enabled;
                    entity.history.enabled = false;
                    entity.set('components.model.batchGroupId', groupId);
                    entity.history.enabled = history;
                }
                affectedModels.length = 0;

                for (let i = 0, len = affectedElements.length; i < len; i++) {
                    const entity = editor.call('entities:get', affectedElements[i]);
                    if (! entity) continue;

                    const history = entity.history.enabled;
                    entity.history.enabled = false;
                    entity.set('components.element.batchGroupId', groupId);
                    entity.history.enabled = history;
                }
                affectedElements.length = 0;
            };

            this._args.history.add({
                name: `remove projectSettings.batchGroups.${groupId}`,
                undo,
                redo
            });

            redo();
        }

        _removeItems() {
            this._items.forEach(item => this._itemsContainer.remove(item));
            this._items = [];
        }

        _loadItems(initialLoad = false) {
            // remove batch group panel items that are no longer in project settings
            const keepItems = [];
            this._items.forEach(item => {
                if (this._projectSettings.get('batchGroups')[item.id]) {
                    keepItems.push(item);
                } else {
                    this._itemsContainer.remove(item);
                }
            });
            this._items = keepItems;

            Object.keys(this._projectSettings.get('batchGroups')).forEach(batchGroupId => {

                let item = this._items.find(item => item.id === batchGroupId);
                if (!item) {
                    // load new batch groups into this panel
                    item = new pcui.BatchgroupsSettingsPanelItem({ history: this._args.history, id: batchGroupId, class: CLASS_ITEM, onRemove: () => this.removeItem(batchGroupId) });
                    item.id = batchGroupId;
                    this._items.push(item);
                    item.link({ projectSettings: this._projectSettings }, initialLoad);
                    this._itemsContainer.append(item);
                } else {
                    // relink old batchgroups
                    item.link({ projectSettings: this._projectSettings });
                }
            });
        }

        link(observers) {
            super.link(observers);
            this._loadItems(true);

            const evtNewBatchGroup = this._projectSettings.on('*:set', (path, value) => {
                if (/^batchGroups\.\d+$/.test(path)) {
                    this._loadItems();
                }
            });

            const evtDeleteBatchGroup = this._projectSettings.on('*:unset', (path, value) => {
                if (/^batchGroups\.\d+$/.test(path)) {
                    this._loadItems();
                }
            });
            this._evts.push(evtNewBatchGroup);
            this._evts.push(evtDeleteBatchGroup);

            // reference
            if (!this._panelTooltip) {
                this._panelTooltip = editor.call('attributes:reference:attach', 'settings:batchGroups', this.header, this.header.dom);
            }
        }

        unlink() {
            super.unlink();

            if (this._items.length > 0) {
                this._removeItems();
            }
            if (this._evts.length > 0) {
                this._evts.forEach(evt => evt.unbind());
                this._evts = [];
            }
        }
    }

    return {
        BatchgroupsSettingsPanel: BatchgroupsSettingsPanel
    };
})());
