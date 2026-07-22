import { driver } from '@/editor/driver';

import { mcp } from './connection';
import './launch';

mcp.method('ping', () => ({ data: 'pong' }));

for (const [name, fn] of driver.methods) {
    mcp.method(name, fn);
}
