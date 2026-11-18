import { driver } from '@/editor/driver/driver';
import '@/editor/driver/projects';
import { mcp } from '@/editor/mcp/connection';
import { createMcpButton } from '@/editor/mcp/popover';

mcp.method('ping', () => ({ data: 'pong' }));

for (const [name, fn] of driver.methods) {
    mcp.method(name, fn);
}

editor.once('load', () => {
    const button = createMcpButton('account');
    button.class.add('mcp-account');
    editor.call('picker:project:cms:addAccountButton', button);
});
