import { driver } from '@/editor/driver/driver';
import '@/editor/driver/projects';

import { mcp } from './connection';
import { createMcpButton } from './popover';

mcp.method('ping', () => ({ data: 'pong' }));

for (const [name, fn] of driver.methods) {
    mcp.method(name, fn);
}

editor.once('load', () => {
    const button = createMcpButton('below');
    button.class.add('mcp-header');
    editor.call('picker:project:cms:addHeaderButton', button);
});
