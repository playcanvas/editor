import type { BrowserContext, Page } from '@playwright/test';

import { CONSOLE_ALLOWLIST } from './constants';

export class ConsoleErrors {
    readonly list: string[] = [];

    private allowed: RegExp[] = [];

    allow(re: RegExp) {
        this.allowed.push(re);
    }

    get unexpected() {
        return this.list.filter(m => !CONSOLE_ALLOWLIST.some(re => re.test(m)) && !this.allowed.some(re => re.test(m)));
    }
}

export const attachConsoleCapture = (context: BrowserContext, errors: ConsoleErrors, log: string[]) => {
    const attach = (page: Page) => {
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                errors.list.push(msg.text());
            }
            log.push(`[${msg.type()}] ${msg.text()}`);
        });
        page.on('pageerror', (err) => {
            errors.list.push(err.message);
            log.push(`[pageerror] ${err.message}`);
        });
        page.on('response', (res) => {
            log.push(`[${res.request().method()}] ${res.status()} ${res.url()}`);
        });
    };
    context.pages().forEach(attach);
    context.on('page', attach);
};
