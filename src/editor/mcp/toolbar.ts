import { Button, Panel } from '@playcanvas/pcui';
import type { Label, NumericInput } from '@playcanvas/pcui';

import { TooltipHandle } from '@/common/tooltips';
import { AttributesInspector } from '@/editor/inspector/attributes-inspector';

import { DEFAULT_PORT } from './connection';

editor.once('load', () => {
    const root = editor.call('layout.root');
    const toolbar = editor.call('layout.toolbar');

    // toolbar button, placed directly under the code editor button
    const button = new Button({
        class: ['pc-icon', 'mcp'],
        icon: 'E184' // ponytail: placeholder glyph, swap for a proper MCP icon
    });
    const publishButton = toolbar.dom.querySelector('.publish-download');
    if (publishButton) {
        toolbar.appendBefore(button, publishButton);
    } else {
        toolbar.append(button);
    }

    const tooltip = TooltipHandle.attach({
        target: button.dom,
        text: 'MCP Server',
        align: 'left',
        root
    });

    // connect popover, built with the inspector attribute layout
    const inspector = new AttributesInspector({
        attributes: [
            { label: 'Status', type: 'label', alias: 'mcpStatus' },
            { label: 'Port', type: 'number', alias: 'mcpPort', args: { min: 1, max: 65535, precision: 0 } },
            { label: '', type: 'button', alias: 'mcpToggle', args: { text: 'CONNECT' } }
        ]
    });
    inspector.link([]);

    const popover = new Panel({ class: 'mcp-popover', headerText: 'MCP SERVER', hidden: true });
    popover.append(inspector);
    root.append(popover);

    const status = inspector.getField<Label>('mcpStatus');
    const port = inspector.getField<NumericInput>('mcpPort');
    const toggle = inspector.getField('mcpToggle') as unknown as Button;

    port.value = DEFAULT_PORT;

    const render = (state: string) => {
        status.value = state.charAt(0).toUpperCase() + state.slice(1);
        status.class.remove('mcp-disconnected', 'mcp-connecting', 'mcp-connected');
        status.class.add(`mcp-${state}`);
        button.class[state === 'connected' ? 'add' : 'remove']('active');
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

    // toggle popover next to the button, close on outside click
    const onOutside = (evt: MouseEvent) => {
        const target = evt.target as Node;
        if (popover.dom.contains(target) || button.dom.contains(target)) {
            return;
        }
        popover.hidden = true;
    };
    button.on('click', () => {
        tooltip.hidden = true;
        if (popover.hidden) {
            const rect = button.dom.getBoundingClientRect();
            popover.dom.style.left = `${rect.right + 4}px`;
            popover.dom.style.top = `${rect.top}px`;
        }
        popover.hidden = !popover.hidden;
    });
    popover.on('show', () => window.addEventListener('mousedown', onOutside));
    popover.on('hide', () => window.removeEventListener('mousedown', onOutside));
});
