import { Button, Container, Label, Panel, TextInput } from '@playcanvas/pcui';

import { TooltipHandle } from '@/common/tooltips';

import { DEFAULT_PORT } from './connection';

// MCP mark from Hugeicons (mcp-server-solid-sharp), fills set to currentColor.
const MCP_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" class="mcp-icon" width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M11.3574 2.48548C12.8602 1.12772 15.1806 1.17296 16.6289 2.62122C17.4208 3.41316 17.7931 4.46597 17.7461 5.50306C18.7835 5.45572 19.8367 5.82907 20.6289 6.62122L20.7646 6.76478C22.0784 8.21914 22.0785 10.4384 20.7646 11.8927L20.6289 12.0353L13.6641 19.0001L15.7499 21.0859L14.3358 22.5L12.25 20.4142C11.4692 19.6332 11.4692 18.3671 12.25 17.5861L19.2148 10.6212L19.3398 10.4826C19.8866 9.8123 19.8864 8.84526 19.3398 8.17494L19.2148 8.03529C18.5454 7.36591 17.4857 7.32444 16.7676 7.91029L16.6289 8.03529L9.75 14.9142L8.33594 13.5001L15.2148 6.62122L15.3398 6.48255C15.9256 5.76438 15.8843 4.70474 15.2148 4.03529C14.5454 3.36591 13.4857 3.32444 12.7676 3.91029L12.6289 4.03529L3.66406 13.0001L2.25 11.5861L11.2148 2.62122L11.3574 2.48548Z" fill="currentColor"/><path d="M12.1426 16.5145C10.6398 17.8723 8.31936 17.8271 6.87109 16.3788C5.42285 14.9304 5.37768 12.6101 6.73535 11.1073L6.87109 10.9647L13.75 4.08581L15.1641 5.49987L8.28516 12.3788L8.16016 12.5174C7.57439 13.2356 7.61576 14.2953 8.28516 14.9647C8.95454 15.6341 10.0143 15.6755 10.7324 15.0897L10.8711 14.9647L17.75 8.08581L19.1641 9.49987L12.2852 16.3788L12.1426 16.5145Z" fill="currentColor"/></svg>';

editor.once('load', () => {
    const root = editor.call('layout.root');
    const toolbar = editor.call('layout.toolbar');

    // toolbar button, placed below the publish button (last item in the top group)
    const button = new Button({ class: ['pc-icon', 'mcp'] });
    button.dom.appendChild(new DOMParser().parseFromString(MCP_ICON, 'image/svg+xml').documentElement);
    toolbar.append(button);

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

    // shown when an app was launched before connecting, so its URL has no mcp_port
    const hint = new Label({ class: 'mcp-hint', text: 'Relaunch the open app to connect it', hidden: true });

    popover.append(statusRow);
    popover.append(portRow);
    popover.append(hint);
    popover.append(toggle);
    root.append(popover);

    const updateHint = () => {
        const last = editor.call('launch:window');
        hint.hidden = !(editor.call('mcp:status') === 'connected' && last && !last.window.closed && !last.mcp);
    };

    const render = (state: string) => {
        statusValue.text = state.charAt(0).toUpperCase() + state.slice(1);
        statusValue.class.remove('mcp-connecting', 'mcp-connected');
        if (state === 'connecting' || state === 'connected') {
            statusValue.class.add(`mcp-${state}`);
        }
        button.class[state === 'connected' ? 'add' : 'remove']('active');
        portField.enabled = state === 'disconnected';
        toggle.text = state === 'connecting' ? 'CANCEL' : state === 'connected' ? 'DISCONNECT' : 'CONNECT';
        updateHint();
    };
    render(editor.call('mcp:status') || 'disconnected');
    editor.on('mcp:status', render);

    toggle.on('click', () => {
        if (editor.call('mcp:status') === 'disconnected') {
            const port = parseInt(portField.value, 10) || DEFAULT_PORT;
            editor.call('localStorage:set', 'editor:mcp:connected', true);
            editor.call('localStorage:set', 'editor:mcp:port', port);
            editor.call('mcp:connect', port);
        } else {
            editor.call('localStorage:set', 'editor:mcp:connected', false);
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
        updateHint();
        window.addEventListener('mousedown', onOutside);
    });
    popover.on('hide', () => {
        tooltip.attach(button.dom);
        window.removeEventListener('mousedown', onOutside);
    });

    // reconnect automatically if the user was connected before a page reload
    // (branch switch / checkpoint restore reload the editor and drop the socket)
    if (editor.call('localStorage:get', 'editor:mcp:connected')) {
        const port = editor.call('localStorage:get', 'editor:mcp:port') || DEFAULT_PORT;
        portField.value = String(port);
        editor.call('mcp:connect', port);
    }
});
