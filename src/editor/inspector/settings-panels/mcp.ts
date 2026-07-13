import type { Button, Label, NumericInput } from '@playcanvas/pcui';

import { DEFAULT_PORT } from '@/editor/mcp/connection';

import type { Attribute } from '../attribute.type.d';

import { BaseSettingsPanel } from './base';
import type { BaseSettingsPanelArgs } from './base';

const ATTRIBUTES: Attribute[] = [
    {
        label: 'Status',
        type: 'label',
        alias: 'mcpStatus'
    },
    {
        label: 'Port',
        type: 'number',
        alias: 'mcpPort',
        args: {
            min: 1,
            max: 65535,
            precision: 0
        }
    },
    {
        label: '',
        type: 'button',
        alias: 'mcpToggle',
        args: {
            text: 'CONNECT'
        }
    }
];

class MCPSettingsPanel extends BaseSettingsPanel {
    constructor(args: BaseSettingsPanelArgs) {
        args = Object.assign({ collapsed: false }, args);
        args.headerText = 'MCP SERVER';
        args.attributes = ATTRIBUTES;
        args.hideIcon = true;

        super(args);

        const status = this._attributesInspector.getField<Label>('mcpStatus');
        const port = this._attributesInspector.getField<NumericInput>('mcpPort');
        const toggle = this._attributesInspector.getField('mcpToggle') as unknown as Button;

        port.value = DEFAULT_PORT;

        const render = (state: string) => {
            status.value = state.charAt(0).toUpperCase() + state.slice(1);
            port.enabled = state === 'disconnected';
            toggle.text = state === 'connecting' ? 'CANCEL' : state === 'connected' ? 'DISCONNECT' : 'CONNECT';
        };
        render(editor.call('mcp:status') || 'disconnected');
        editor.on('mcp:status', render);

        toggle.on('click', () => {
            if (editor.call('mcp:status') === 'disconnected') {
                editor.call('mcp:connect', port.value || DEFAULT_PORT);
            } else {
                editor.call('mcp:disconnect');
            }
        });
    }
}

export { MCPSettingsPanel };
