import { Button } from '@playcanvas/pcui';

import { TooltipHandle } from '@/common/tooltips';
import { MCP_SETTINGS_HEADER } from '@/editor/inspector/settings-panels/mcp';

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

    // open the settings panel with only the MCP section expanded
    button.on('click', () => {
        editor.call('selector:set', 'editorSettings', [editor.call('settings:projectUser')]);
        editor.call('settings:expandOnly', MCP_SETTINGS_HEADER);
    });

    // reflect connection status on the button
    const setActive = (state: string) => button.class[state === 'connected' ? 'add' : 'remove']('active');
    setActive(editor.call('mcp:status') || 'disconnected');
    editor.on('mcp:status', setActive);

    TooltipHandle.attach({
        target: button.dom,
        text: 'MCP Server',
        align: 'left',
        root
    });
});
