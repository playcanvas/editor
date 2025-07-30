import { BaseSettingsPanel } from './base.ts';

/**
 * @import { Attribute } from '../attribute.type.d.ts'
 */

/**
 * @type {Attribute[]}
 */
const ATTRIBUTES = [
    {
        observer: 'projectSettings',
        label: 'Keyboard',
        type: 'boolean',
        alias: 'project.useKeyboard',
        reference: 'settings:project:useKeyboard',
        path: 'useKeyboard'
    },
    {
        observer: 'projectSettings',
        label: 'Mouse',
        type: 'boolean',
        alias: 'project.useMouse',
        reference: 'settings:project:useMouse',
        path: 'useMouse'
    },
    {
        observer: 'projectSettings',
        label: 'Touch',
        type: 'boolean',
        alias: 'project.useTouch',
        reference: 'settings:project:useTouch',
        path: 'useTouch'
    },
    {
        observer: 'projectSettings',
        label: 'Gamepads',
        type: 'boolean',
        alias: 'project.useGamepads',
        reference: 'settings:project:useGamepads',
        path: 'useGamepads'
    }
];

class InputSettingsPanel extends BaseSettingsPanel {
    constructor(args) {
        args = Object.assign({}, args);
        args.headerText = 'INPUT';
        args.attributes = ATTRIBUTES;
        args._tooltipReference = 'settings:input';

        super(args);
    }
}

export { InputSettingsPanel };
