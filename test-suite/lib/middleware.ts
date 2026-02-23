import { type BrowserContext } from '@playwright/test';

import { HEADER_NAME, HEADER_VALUE } from './config';

export const middleware = async (context: BrowserContext) => {
    // mock OneTrust script to prevent cookie popups interfering with tests
    await context.route(/otSDKStub\.js$/, (route) => {
        return route.fulfill({
            status: 200,
            contentType: 'application/javascript',
            body: 'console.log(\'OneTrust mocked for testing\');'
        });
    });

    // cloudfront header injection
    await context.route(/playcanvas\.com/, (route, request) => {
        return route.continue({
            headers: {
                ...request.headers(),
                [HEADER_NAME]: HEADER_VALUE
            }
        });
    });
};
