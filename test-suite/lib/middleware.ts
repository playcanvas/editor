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

    // analytics availability must not affect editor tests
    await context.route('https://www.googletagmanager.com/gtag/js?*', (route) => {
        return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
    });

    // cloudfront header injection; skip when unset (local backend has no waf) as an
    // empty header name stalls the request and hangs navigation
    if (HEADER_NAME) {
        await context.route(/playcanvas\.com/, (route, request) => {
            return route.continue({
                headers: {
                    ...request.headers(),
                    [HEADER_NAME]: HEADER_VALUE
                }
            });
        });
    }
};
