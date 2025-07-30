import confetti from 'canvas-confetti';

import { BaseSettingsPanel } from './base.ts';

/**
 * @import { Attribute } from '../attribute.type.js'
 */

/**
 * @type {Attribute[]}
 */
const ATTRIBUTES = [
    {
        label: '',
        type: 'button',
        alias: 'clickMe',
        args: {
            text: 'SURPRISE ME',
            icon: 'E304'
        }
    }
];


class CustomSettingsPanel extends BaseSettingsPanel {
    constructor(args) {
        args = Object.assign({
            collapsed: false
        }, args);
        args.headerText = 'CUSTOM';
        args.attributes = ATTRIBUTES;
        args.userOnlySettings = false;
        args._tooltipReference = 'settings:custom';

        super(args);

        this._attributesInspector.getField('clickMe').on('click', () => {
            confetti({
                scalar: 2,
                particleCount: 600,
                spread: 360,
                origin: { y: 0.4 }
            });
        });
    }
}

export { CustomSettingsPanel };
