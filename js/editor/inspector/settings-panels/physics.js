import { BaseSettingsPanel } from './base.js';

const ATTRIBUTES = [
    {
        label: 'Physics Library',
        alias: 'ammo',
        type: 'button',
        args: {
            text: 'IMPORT AMMO',
            icon: 'E228'
        }
    },
    {
        observer: 'sceneSettings',
        label: 'Gravity',
        alias: 'gravity',
        path: 'physics.gravity',
        type: 'vec3',
        args: {
            placeholder: ['X', 'Y', 'Z']
        }
    }
];

class PhysicsSettingsPanel extends BaseSettingsPanel {
    constructor(args) {
        args = Object.assign({}, args);
        args.headerText = 'PHYSICS';
        args.attributes = ATTRIBUTES;
        args._tooltipReference = 'settings:physics';

        super(args);
        const clickAmmoEvt = this._attributesInspector.getField('ammo').on('click', () => {
            if (this._projectSettings) {
                // ensure legacy physics is disabled
                this._projectSettings.set('use3dPhysics', false);
                // add the module
                editor.call('project:module:addModule', 'ammo.js', 'ammo');
            }
        });
        this.once('destroy', () => {
            clickAmmoEvt.unbind();
        });
    }
}

export { PhysicsSettingsPanel };
