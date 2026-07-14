import { Button, Container, Label, Panel, TextInput } from '@playcanvas/pcui';

import { TooltipHandle } from '@/common/tooltips';

import { DEFAULT_PORT } from './connection';

// MCP mark. ponytail: hand-drawn recreation — drop in the official MCP logo SVG to swap.
const MCP_ICON =
    '<svg class="mcp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12.8 10 5.3a3 3 0 0 1 4.3 4.3l-6.4 6.4"/><path d="M6.3 12.8 13.8 5.3a3 3 0 0 1 4.3 4.3l-6.4 6.4a2.4 2.4 0 0 0 3.4 3.4l4.5-4.5"/></svg>';

editor.once('load', () => {
    const root = editor.call('layout.root');
    const toolbar = editor.call('layout.toolbar');

    // toolbar button, placed directly under the code editor button
    const button = new Button({ class: ['pc-icon', 'mcp'] });
    button.dom.appendChild(new DOMParser().parseFromString(MCP_ICON, 'image/svg+xml').documentElement);
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

    // connect popover
    const popover = new Panel({ class: 'mcp-popover', headerText: 'MCP SERVER', collapsible: true, hidden: true });

    const statusValue = new Label({ class: 'mcp-status-value', text: 'Disconnected' });
    const statusRow = new Container({ class: 'mcp-row' });
    statusRow.append(new Label({ class: 'mcp-row-label', text: 'Status' }));
    statusRow.append(statusValue);

    const portField = new TextInput({ class: 'mcp-field', value: String(DEFAULT_PORT) });
    const portRow = new Container({ class: 'mcp-row' });
    portRow.append(new Label({ class: 'mcp-row-label', text: 'Port' }));
    portRow.append(portField);

    const toggle = new Button({ class: 'mcp-toggle', text: 'CONNECT' });

    popover.append(statusRow);
    popover.append(portRow);
    popover.append(toggle);
    root.append(popover);

    const render = (state: string) => {
        statusValue.text = state.charAt(0).toUpperCase() + state.slice(1);
        statusValue.class.remove('mcp-connecting', 'mcp-connected');
        if (state === 'connecting' || state === 'connected') {
            statusValue.class.add(`mcp-${state}`);
        }
        button.class[state === 'connected' ? 'add' : 'remove']('active');
        portField.enabled = state === 'disconnected';
        toggle.text = state === 'connecting' ? 'CANCEL' : state === 'connected' ? 'DISCONNECT' : 'CONNECT';
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

    // toggle popover, centered vertically on the button, close on outside click
    const onOutside = (evt: MouseEvent) => {
        const target = evt.target as Node;
        if (popover.dom.contains(target) || button.dom.contains(target)) {
            return;
        }
        popover.hidden = true;
    };
    button.on('click', () => {
        if (!popover.hidden) {
            popover.hidden = true;
            return;
        }
        popover.hidden = false;
        const rect = button.dom.getBoundingClientRect();
        const top = rect.top + rect.height / 2 - popover.dom.offsetHeight / 2;
        popover.dom.style.left = `${rect.right + 4}px`;
        popover.dom.style.top = `${Math.max(4, top)}px`;
    });
    popover.on('show', () => {
        // suppress the hover tooltip while open so its arrow doesn't poke out from under the popover
        tooltip.detach();
        tooltip.hidden = true;
        window.addEventListener('mousedown', onOutside);
    });
    popover.on('hide', () => {
        tooltip.attach(button.dom);
        window.removeEventListener('mousedown', onOutside);
    });
});
