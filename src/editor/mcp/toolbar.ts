import { Button, Label, Panel, TextInput } from '@playcanvas/pcui';

import { TooltipHandle } from '@/common/tooltips';

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

    // connect popover
    const popover = new Panel({
        class: 'mcp-popover',
        headerText: 'MCP SERVER',
        hidden: true
    });
    const status = new Label({ class: 'mcp-status', text: 'Disconnected' });
    const portField = new TextInput({ class: 'mcp-port', value: String(DEFAULT_PORT), placeholder: 'Port' });
    const toggle = new Button({ class: 'mcp-toggle', text: 'CONNECT' });
    popover.append(status);
    popover.append(portField);
    popover.append(toggle);
    root.append(popover);

    const render = (state: string) => {
        status.class.remove('disconnected', 'connecting', 'connected');
        status.class.add(state);
        button.class[state === 'connected' ? 'add' : 'remove']('active');
        switch (state) {
            case 'connecting':
                status.text = 'Connecting';
                portField.enabled = false;
                toggle.text = 'CANCEL';
                break;
            case 'connected':
                status.text = 'Connected';
                portField.enabled = false;
                toggle.text = 'DISCONNECT';
                break;
            default:
                status.text = 'Disconnected';
                portField.enabled = true;
                toggle.text = 'CONNECT';
                break;
        }
    };
    render(editor.call('mcp:status') || 'disconnected');
    editor.on('mcp:status', render);

    toggle.on('click', () => {
        if (editor.call('mcp:status') === 'disconnected') {
            editor.call('mcp:connect', parseInt(portField.value, 10) || DEFAULT_PORT);
        } else {
            editor.call('mcp:disconnect');
        }
    });

    // toggle popover, close on outside click
    const onOutside = (evt: MouseEvent) => {
        const target = evt.target as Node;
        if (popover.dom.contains(target) || button.dom.contains(target)) {
            return;
        }
        popover.hidden = true;
    };
    button.on('click', () => {
        popover.hidden = !popover.hidden;
    });
    popover.on('show', () => window.addEventListener('mousedown', onOutside));
    popover.on('hide', () => window.removeEventListener('mousedown', onOutside));

    TooltipHandle.attach({
        target: button.dom,
        text: 'MCP Server',
        align: 'left',
        root
    });
});
