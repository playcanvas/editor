editor.once('load', function () {
    var projectSettings = editor.call('settings:project');

    editor.method('editorSettings:batchGroups:create', (name) => {
        const batchGroups = projectSettings.get('batchGroups');

        // calculate id of new group and new name
        let id = 100000;
        for (const key in batchGroups) {
            id = Math.max(parseInt(key, 10) + 1, id);
        }

        projectSettings.set('batchGroups.' + id, {
            id: id,
            name: name || 'New Batch Group',
            maxAabbSize: 100,
            dynamic: true
        });

        return id;
    });
});

Object.assign(pcui, (function () {
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
            args._tooltipReference = 'settings:batchGroups';

            super(args);

            this._items = [];
            this._evts = [];

            this._itemsContainer = new pcui.Container();
            this.prepend(this._itemsContainer);

            this._attributesInspector.getField('addGroupButton').on('click', () => {
                this._addItem();
            });

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
            let projectSettings = this._projectSettings;
            const oldValue = projectSettings.get('batchGroups.' + groupId);
            const affectedModels = [];
            const affectedElements = [];

            const redo = () => {
                projectSettings = projectSettings.latest();
                const settingsHistory = projectSettings.history.enabled;
                projectSettings.history.enabled = false;
                projectSettings.unset('batchGroups.' + groupId);
                projectSettings.history.enabled = settingsHistory;

                const entities = this._entities;
                for (let i = 0, len = entities.length; i < len; i++) {
                    const entity = entities[i];

                    if (entity.get('components.model.batchGroupId') === groupId) {
                        const history = entity.history.enabled;
                        entity.history.enabled = false;
                        affectedModels.push(entity);
                        entity.set('components.model.batchGroupId', null);
                        entity.history.enabled = history;
                    }

                    if (entity.get('components.element.batchGroupId') === groupId) {
                        const history = entity.history.enabled;
                        entity.history.enabled = false;
                        affectedElements.push(entity);
                        entity.set('components.element.batchGroupId', null);
                        entity.history.enabled = history;
                    }
                }
            };

            const undo = () => {
                projectSettings = projectSettings.latest();
                var settingsHistory = projectSettings.history.enabled;
                projectSettings.history.enabled = false;
                projectSettings.set('batchGroups.' + groupId, oldValue);
                projectSettings.history.enabled = settingsHistory;

                for (let i = 0, len = affectedModels.length; i < len; i++) {
                    const entity = affectedModels[i].latest();
                    if (!entity) continue;

                    const history = entity.history.enabled;
                    entity.history.enabled = false;
                    entity.set('components.model.batchGroupId', groupId);
                    entity.history.enabled = history;
                }
                affectedModels.length = 0;

                for (let i = 0, len = affectedElements.length; i < len; i++) {
                    const entity = affectedElements[i].latest();
                    if (!entity) continue;

                    const history = entity.history.enabled;
                    entity.history.enabled = false;
                    entity.set('components.element.batchGroupId', groupId);
                    entity.history.enabled = history;
                }
                affectedElements.length = 0;
            };

            if (this._args.history) {
                this._args.history.add({
                    name: `remove projectSettings.batchGroups.${groupId}`,
                    undo,
                    redo
                });
            }

            redo();
        }

        _removeItems() {
            this._items.forEach(item => this._itemsContainer.remove(item));
            this._items = [];
        }

        _loadItems(initialLoad = false) {
            const batchGroups = this._projectSettings.get('batchGroups') || {};
            // remove batch group panel items that are no longer in project settings
            const keepItems = [];
            this._items.forEach((item) => {
                if (batchGroups[item.id]) {
                    keepItems.push(item);
                } else {
                    this._itemsContainer.remove(item);
                }
            });
            this._items = keepItems;

            Object.keys(batchGroups).forEach((batchGroupId) => {

                let item = this._items.find(item => item.id === batchGroupId);
                if (!item) {
                    // load new batch groups into this panel
                    item = new pcui.BatchgroupsSettingsPanelItem({ history: this._args.history, projectSettings: this._args.projectSettings, id: batchGroupId, class: CLASS_ITEM, onRemove: () => this.removeItem(batchGroupId) });
                    if (!initialLoad) {
                        item.collapsed = false;
                        this.collapsed = false;
                        item._attributesInspector.getField(`batchGroups.${batchGroupId}.name`).focus();
                    }
                    item.id = batchGroupId;
                    this._items.push(item);
                    this._itemsContainer.append(item);
                }
            });
        }
    }

    return {
        BatchgroupsSettingsPanel: BatchgroupsSettingsPanel
    };
})());
