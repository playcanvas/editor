import { BaseSettingsPanel } from './base.ts';
import { LAYERID_DEPTH, LAYERID_SKYBOX, LAYERID_IMMEDIATE } from '../../../core/constants.ts';

/**
 * @import { Attribute } from '../attribute.type.d.ts'
 */

/**
 * @param {object} args - The attribute args
 * @returns {Attribute[]} - The attributes
 */
const ATTRIBUTES = args => [
    {
        observer: 'projectSettings',
        label: 'Name',
        type: 'string',
        alias: 'batchGroups.name',
        reference: 'settings:batchGroups:name',
        path: `batchGroups.${args.id}.name`
    },
    {
        observer: 'projectSettings',
        label: 'Dynamic',
        type: 'boolean',
        alias: 'batchGroups.dynamic',
        reference: 'settings:batchGroups:dynamic',
        path: `batchGroups.${args.id}.dynamic`
    },
    {
        observer: 'projectSettings',
        label: 'Max AABB',
        type: 'number',
        alias: 'batchGroups.maxAabbSize',
        reference: 'settings:batchGroups:maxAabbSize',
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
        reference: 'settings:batchGroups:layers',
        path: `batchGroups.${args.id}.layers`,
        args: {
            type: 'number',
            placeholder: 'Add Layer',
            multiSelect: true
        }
    }
];

class BatchGroupsSettingsPanelItem extends BaseSettingsPanel {
    constructor(args) {
        args = Object.assign({}, args);
        args.attributes = ATTRIBUTES(args);
        args.removable = true;
        args.hideIcon = true;

        super(args);
        this._args = args;
        this._projectSettings = this._args.projectSettings;

        const evtRemove = this.on('click:remove', args.onRemove);
        this._evts = [];

        this.once('destroy', () => {
            evtRemove.unbind();
        });

        const batchGroup = this._projectSettings.get(`batchGroups.${this._args.id}`);
        this.headerText = batchGroup.name;

        this._updateLayerOptions();

        this._evts.push(this._projectSettings.on(`batchGroups.${this._args.id}.name:set`, (value) => {
            this.headerText = value;
        }));

        this._evts.push(this._projectSettings.on('*:set', (path) => {
            if (path.includes('layers')) {
                this._updateLayerOptions();
            }
        }));

        this._evts.push(this._projectSettings.on('*:unset', (path) => {
            if (path.includes('layers')) {
                this._updateLayerOptions();
            }
        }));
    }

    _updateLayerOptions() {
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
    }
}

export { BatchGroupsSettingsPanelItem };
