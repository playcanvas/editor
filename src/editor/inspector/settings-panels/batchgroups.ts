import type { EventHandle, Observer } from '@playcanvas/observer';
import { Container } from '@playcanvas/pcui';
import type { TextInput } from '@playcanvas/pcui';

import type { Attribute } from '../attribute.type.d';

import { BaseSettingsPanel } from './base';
import type { BaseSettingsPanelArgs } from './base';
import { BatchGroupsSettingsPanelItem } from './batchgroups-item';

const CLASS_ROOT = 'batchgroups-settings-panel';
const CLASS_ITEM = `${CLASS_ROOT}-item`;

// components that can belong to a batch group
const BATCH_GROUP_COMPONENTS = ['model', 'render', 'element', 'sprite'];

const ATTRIBUTES: Attribute[] = [
    {
        label: '',
        alias: 'addGroupButton',
        type: 'button',
        args: {
            text: 'ADD GROUP',
            icon: 'E120'
        }
    }
];

class BatchGroupsSettingsPanel extends BaseSettingsPanel {
    _items: BatchGroupsSettingsPanelItem[] = [];

    _evts: EventHandle[] = [];

    _itemsContainer: Container;

    constructor(args: BaseSettingsPanelArgs) {
        args = Object.assign({}, args);
        args.headerText = 'BATCH GROUPS';
        args.attributes = ATTRIBUTES;
        args._tooltipReference = 'settings:batchGroups';

        super(args);

        this._itemsContainer = new Container();
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
        this._projectSettings.set(`batchGroups.${id}`, {
            id: id,
            name: 'New Batch Group',
            maxAabbSize: 100,
            dynamic: true
        });
    }

    removeItem(groupId: string) {
        let projectSettings = this._projectSettings;
        const oldValue = projectSettings.get(`batchGroups.${groupId}`);

        // entities store the id as a number, the settings key is its string
        const id = parseInt(groupId, 10);
        const affected: [Observer, string][] = [];

        const redo = () => {
            projectSettings = projectSettings.latest();
            const settingsHistory = projectSettings.history.enabled;
            projectSettings.history.enabled = false;
            projectSettings.unset(`batchGroups.${groupId}`);
            projectSettings.history.enabled = settingsHistory;

            // the panel's entities list is a snapshot from load, so read the current one
            const entities = editor.call('entities:list');
            for (let i = 0, len = entities.length; i < len; i++) {
                const entity = entities[i];

                for (const component of BATCH_GROUP_COMPONENTS) {
                    const path = `components.${component}.batchGroupId`;
                    if (entity.get(path) === id) {
                        const history = entity.history.enabled;
                        entity.history.enabled = false;
                        affected.push([entity, path]);
                        entity.set(path, null);
                        entity.history.enabled = history;
                    }
                }
            }
        };

        const undo = () => {
            projectSettings = projectSettings.latest();
            const settingsHistory = projectSettings.history.enabled;
            projectSettings.history.enabled = false;
            projectSettings.set(`batchGroups.${groupId}`, oldValue);
            projectSettings.history.enabled = settingsHistory;

            for (const [observer, path] of affected) {
                const entity = observer.latest();
                if (!entity) {
                    continue;
                }

                const history = entity.history.enabled;
                entity.history.enabled = false;
                entity.set(path, id);
                entity.history.enabled = history;
            }
            affected.length = 0;
        };

        if (this._args.history) {
            this._args.history.add({
                name: `remove projectSettings.batchGroups.${groupId}`,
                undo,
                redo,
                combine: false
            });
        }

        redo();
    }

    _removeItems() {
        this._items.forEach((item) => this._itemsContainer.remove(item));
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
            let item = this._items.find((item) => item.id === batchGroupId);
            if (!item) {
                // load new batch groups into this panel
                item = new BatchGroupsSettingsPanelItem({
                    history: this._args.history,
                    projectSettings: this._args.projectSettings,
                    id: batchGroupId,
                    class: CLASS_ITEM,
                    onRemove: () => this.removeItem(batchGroupId)
                });
                if (!initialLoad) {
                    item.collapsed = false;
                    this.collapsed = false;
                    (item._attributesInspector.getField(`batchGroups.${batchGroupId}.name`) as TextInput).focus();
                }
                item.id = batchGroupId;
                this._items.push(item);
                this._itemsContainer.append(item);
            }
        });
    }
}

export { BatchGroupsSettingsPanel };
