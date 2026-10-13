import { createMcpButton } from './popover';

editor.once('load', () => {
    // toolbar button, below publish (last in the top group)
    const button = createMcpButton('right');
    editor.call('layout.toolbar').append(button);
    editor.call('toolbar:register', { id: 'mcp', label: 'MCP Server', group: 'main', button });
});
