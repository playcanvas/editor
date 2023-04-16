import { BaseSettingsPanel } from './base.js';

const ATTRIBUTES = [
    {
        observer: 'projectSettings',
        label: 'Keyboard',
        type: 'boolean',
        alias: 'project.useKeyboard',
        path: 'useKeyboard'
    },
    {
        observer: 'projectSettings',
        label: 'Mouse',
        type: 'boolean',
        alias: 'project.useMouse',
        path: 'useMouse'
    },
    {
        observer: 'projectSettings',
        label: 'Touch',
        type: 'boolean',
        alias: 'project.useTouch',
        path: 'useTouch'
    },
    {
        observer: 'projectSettings',
        label: 'Gamepads',
        type: 'boolean',
        alias: 'project.useGamepads',
        path: 'useGamepads'
    }
];

class InputSettingsPanel extends BaseSettingsPanel {
    constructor(args) {
        args = Object.assign({}, args);
        args.headerText = 'INPUT';
        args.attributes = ATTRIBUTES;
        args.splitReferencePath = false;
        args._tooltipReference = 'settings:input';

        super(args);
    }
}

export { InputSettingsPanel };
