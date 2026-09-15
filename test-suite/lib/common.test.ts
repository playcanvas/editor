import { deepEqual } from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import type { Page } from '@playwright/test';

import { deleteProjects, deleteProjectsByPrefix } from './common';
import { STALE_PROJECT_AGE } from './constants';
import { RUN_ID } from './utils';

const OLD = new Date(Date.now() - STALE_PROJECT_AGE - 60_000).toISOString();
const NOW = new Date().toISOString();

const setup = (projects: { id: number; name: string; created: string }[]) => {
    const removed: number[] = [];
    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: {
            config: { self: { id: 1 } },
            editor: { api: { globals: { rest: {
                users: { userProjects: () => ({ promisify: () => Promise.resolve({ result: projects }) }) },
                projects: { projectDelete: ({ projectId }: { projectId: number }) => ({ promisify: () => Promise.resolve(removed.push(projectId)) }) }
            } } } }
        }
    });
    const page = { evaluate: (fn: any, arg: any) => Promise.resolve(fn(arg)) } as Page;
    return { page, removed };
};

afterEach(() => Reflect.deleteProperty(globalThis, 'window'));

test('teardown deletes current-run ids, skipping missing and repeated ids', async () => {
    const { page, removed } = setup([
        { id: 42, name: `e2e-${RUN_ID}-w0-api-export-1`, created: NOW },
        { id: 43, name: 'unrelated', created: OLD }
    ]);
    await deleteProjects(page, [42, 42, 99]);
    deepEqual(removed, [42]);
});

test('stale cleanup preserves current runs, recent projects and unknown ages', async () => {
    const { page, removed } = setup([
        { id: 1, name: 'e2e-previous-run-project', created: OLD },
        { id: 2, name: `e2e-${RUN_ID}-project`, created: OLD },
        { id: 3, name: 'e2e-other-run-project', created: NOW },
        { id: 4, name: 'e2e-unknown-age', created: '' },
        { id: 5, name: 'user-project', created: OLD }
    ]);
    await deleteProjectsByPrefix(page, 'e2e-');
    deepEqual(removed, [1]);
});
