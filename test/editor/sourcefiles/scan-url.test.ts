import { expect } from 'chai';
import { describe, it } from 'mocha';

import { isScanUrlAllowed } from '../../../src/editor/sourcefiles/sourcefiles-scan-url';

const API = new URL('https://playcanvas.com/api');

describe('legacy script scan url', () => {
    it('allows code.playcanvas.com, the local engine server and the api', () => {
        for (const url of [
            'https://code.playcanvas.com/playcanvas-stable.js',
            'http://code.playcanvas.com/a.js',
            'http://localhost:51000/a.js',
            'https://playcanvas.com/api/projects/1/repositories/directory/sourcefiles/a.js?access_token=x'
        ]) {
            expect(isScanUrlAllowed(url, API), url).to.equal(true);
        }
    });

    it('rejects other hosts that only contain an allowed name', () => {
        for (const url of [
            'https://code.playcanvas.com.example.test/a.js',
            'https://codexplaycanvas.com/a.js',
            'https://code.playcanvas.com@example.test/a.js',
            'https://example.test/a.js?u=https://playcanvas.com/api',
            'https://example.test/https://playcanvas.com/api/a.js',
            'https://localhost:510001/a.js',
            'https://playcanvas.com.example.test/api/a.js'
        ]) {
            expect(isScanUrlAllowed(url, API), url).to.equal(false);
        }
    });

    it('rejects paths outside the api, other schemes and relative urls', () => {
        for (const url of [
            'https://playcanvas.com/apix/a.js',
            'https://playcanvas.com/api/../editor/a.js',
            'https://playcanvas.com/editor/a.js',
            'javascript:alert(1)//https://playcanvas.com/api',
            'data:text/javascript,1//https://code.playcanvas.com',
            '/api/assets/1/file/a.js'
        ]) {
            expect(isScanUrlAllowed(url, API), url).to.equal(false);
        }
    });
});
