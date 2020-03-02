Object.assign(pcui, (function () {
    'use strict';

    const ATTRIBUTES = args => [
        {
            observer: 'projectSettings',
            label: 'Name',
            type: 'string',
            alias: 'batchGroups.name',
            path: `batchGroups.${args.id}.name`
        },
        {
            observer: 'projectSettings',
            label: 'Dynamic',
            type: 'boolean',
            alias: 'batchGroups.dynamic',
            path: `batchGroups.${args.id}.dynamic`
        },
        {
            observer: 'projectSettings',
            label: 'Max AABB',
            type: 'number',
            alias: 'batchGroups.maxAabbSize',
            path: `batchGroups.${args.id}.maxAabbSize`,
            args: {
                min: 0
            }
        },
        {
            observer: 'projectSettings',
            label: 'Layers',
            type: 'tags',
            alias: 'batchGroups.layers',
            path: `batchGroups.${args.id}.layers`,
            args: {
                type: 'number',
                placeholder: 'Add Layer',
                multiSelect: true
            }
        }
    ];

    class BatchgroupsSettingsPanelItem extends pcui.BaseSettingsPanel {
        constructor(args) {
            args = Object.assign({}, args);
            args.attributes = ATTRIBUTES(args);
            args.removable = true;
            args.splitReferencePath = false;

            super(args);
            this._args = args;

            const evtRemove = this.on('click:remove', args.onRemove);
            this._evts = [];

            this.once('destroy', () => {
                evtRemove.unbind();
                evtName.unbind();
            });
        }

        link(observers, oldItem = true) {
            super.link(observers);
            const batchGroup = this._projectSettings.get(`batchGroups.${this._args.id}`);
            this.headerText = batchGroup.name;
            this.collapsed = oldItem;

            if (!oldItem) {
                this._attributesInspector.getField(`batchGroups.${this._args.id}.name`).focus();
            }

            const layerOptions = [];
            for (const key in this._projectSettings.get('layers')) {
                if (![LAYERID_DEPTH, LAYERID_SKYBOX, LAYERID_IMMEDIATE].includes(parseInt(key, 10))) {
                    layerOptions.push({
                        v: parseInt(key, 10),
                        t: this._projectSettings.get('layers')[key].name
                    });
                }
            }
            this._attributesInspector.getField(`batchGroups.${this._args.id}.layers`).options = layerOptions;

            this._evts.push(this._projectSettings.on('batchGroups.' + this._args.id + '.name:set', (value) => {
                this.headerText = value;
            }));
        }

        unlink() {
            super.unlink();
            if (this._evts.length > 0) {
                this._evts.forEach(evt => evt.unbind());
            }
            this._evts = [];
        }
    }

    return {
        BatchgroupsSettingsPanelItem: BatchgroupsSettingsPanelItem
    };
})());
