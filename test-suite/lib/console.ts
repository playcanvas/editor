import type { BrowserContext, ConsoleMessage, Page, Response } from '@playwright/test';

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

/**
 * Records console errors and page errors of every page in the context, including ones opened
 * later. Returns the detach, which a caller whose context outlives the capture must call.
 *
 * @param context - The context to capture.
 * @param errors - The collector the errors land in.
 * @param log - The full console and response log, for the report attachment.
 * @returns The function that takes every listener back off.
 */
export const attachConsoleCapture = (context: BrowserContext, errors: ConsoleErrors, log: string[]) => {
    const onConsole = (msg: ConsoleMessage) => {
        if (msg.type() === 'error') {
            errors.list.push(msg.text());
        }
        log.push(`[${msg.type()}] ${msg.text()}`);
    };
    const onPageError = (err: Error) => {
        errors.list.push(err.message);
        log.push(`[pageerror] ${err.message}`);
    };
    const onResponse = (res: Response) => {
        log.push(`[${res.request().method()}] ${res.status()} ${res.url()}`);
    };

    const pages: Page[] = [];
    const attach = (page: Page) => {
        pages.push(page);
        page.on('console', onConsole);
        page.on('pageerror', onPageError);
        page.on('response', onResponse);
    };
    context.pages().forEach(attach);
    context.on('page', attach);

    return () => {
        context.off('page', attach);
        pages.forEach((page) => {
            page.off('console', onConsole);
            page.off('pageerror', onPageError);
            page.off('response', onResponse);
        });
    };
};
