import { tmpdir } from 'os';

import { expect, test, type Page } from '@playwright/test';

import { capture } from '../../lib/capture';
import {
    checkCookieAccept,
    createProject,
    deleteApp,
    deleteProject,
    downloadApp,
    exportProject,
    importProject,
    publishApp
} from '../../lib/common';
import { codeEditorUrl, editorBlankUrl, editorSceneUrl, editorUrl, launchSceneUrl } from '../../lib/config';
import { middleware } from '../../lib/middleware';
import { uniqueName } from '../../lib/utils';

test.describe.configure({
    mode: 'serial'
});

test.describe('create/delete', () => {
    const projectName = uniqueName('api-project');
    const forkedProjectName = uniqueName('api-project');
    let projectId: number;
    let forkedProjectId: number;
    let page: Page;

    test.describe.configure({
        mode: 'serial'
    });

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await middleware(page.context());
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('create project', async () => {
        expect(await capture('create-project', page, async () => {
            await page.goto(editorBlankUrl(), { waitUntil: 'networkidle' });
            projectId = await createProject(page, projectName);
        })).toStrictEqual([]);
    });

    test('fork project', async () => {
        expect(await capture('create-project', page, async () => {
            forkedProjectId = await createProject(page, forkedProjectName, projectId);
        })).toStrictEqual([]);
    });

    test('delete forked project', async () => {
        expect(await capture('delete-project', page, async () => {
            await deleteProject(page, forkedProjectId);
        })).toStrictEqual([]);
    });

    test('delete project', async () => {
        expect(await capture('delete-project', page, async () => {
            await deleteProject(page, projectId);
        })).toStrictEqual([]);
    });
});

test.describe('export/import', () => {
    const projectName = uniqueName('api-export');
    const exportPath = `${tmpdir()}/${uniqueName('exported-project')}.zip`;
    let projectId: number;
    let importedProjectId: number;
    let page: Page;

    test.describe.configure({
        mode: 'serial'
    });

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await middleware(page.context());

        // create a temporary project
        await page.goto(editorBlankUrl(), { waitUntil: 'networkidle' });
        await checkCookieAccept(page);
        projectId = await createProject(page, projectName);
    });

    test.afterAll(async () => {
        // delete temporary project
        await page.goto(editorBlankUrl(), { waitUntil: 'networkidle' });
        await deleteProject(page, projectId);

        await page.close();
    });

    test('export project', async () => {
        test.setTimeout(4 * 60 * 1000);
        expect(await capture('export-project', page, async () => {
            const downloadPromise = page.waitForEvent('download');
            await exportProject(page, projectId);
            const download = await downloadPromise;
            await download.saveAs(exportPath);
        })).toStrictEqual([]);
    });

    test('import project', async () => {
        test.setTimeout(4 * 60 * 1000);
        expect(await capture('import-project', page, async () => {
            importedProjectId = await importProject(page, exportPath);
        })).toStrictEqual([]);
    });

    test('delete imported project', async () => {
        expect(await capture('delete-imported-project', page, async () => {
            await deleteProject(page, importedProjectId);
        })).toStrictEqual([]);
    });
});

test.describe('navigation', () => {
    const projectName = uniqueName('api-nav');
    let projectId: number;
    let sceneId: number;
    let engineVersions: typeof window.config.engineVersions;
    let page: Page;

    test.describe.configure({
        mode: 'serial'
    });

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await middleware(page.context());

        // create a temporary project
        await page.goto(editorBlankUrl(), { waitUntil: 'networkidle' });
        await checkCookieAccept(page);
        projectId = await createProject(page, projectName);
    });

    test.afterAll(async () => {
        // delete temporary project
        await page.goto(editorBlankUrl(), { waitUntil: 'networkidle' });
        await deleteProject(page, projectId);

        await page.close();
    });

    test('goto editor', async () => {
        expect(await capture('editor', page, async () => {
            await page.goto(editorUrl(projectId), { waitUntil: 'networkidle' });
            sceneId = parseInt(await page.evaluate(() => window.config.scene.id), 10);
            engineVersions = await page.evaluate(() => window.config.engineVersions);
        })).toStrictEqual([]);
    });

    test('goto code editor', async () => {
        expect(await capture('code-editor', page, async () => {
            await page.goto(codeEditorUrl(projectId), { waitUntil: 'networkidle' });
        })).toStrictEqual([]);
    });

    for (const version of ['current', 'previous', 'releaseCandidate'] as const) {
        for (const type of ['debug', 'profiler', 'release'] as const) {
            for (const device of ['webgpu', 'webgl2'] as const) {
                test(`goto launcher (version: ${version}, type: ${type}, device: ${device})`, async () => {
                    expect(await capture('launcher', page, async () => {
                        const { current, previous, releaseCandidate } = engineVersions;
                        const args: Record<string, string> = { device };

                        // select version number
                        args.version = current.version;
                        switch (version) {
                            case 'previous': {
                                if (!previous) {
                                    test.skip(true, `no previous version available for ${version}`);
                                    return;
                                }
                                args.version = previous.version;
                                break;
                            }
                            case 'releaseCandidate': {
                                if (!releaseCandidate) {
                                    test.skip(true, `no release candidate version available for ${version}`);
                                    return;
                                }
                                args.version = releaseCandidate.version;
                                break;
                            }
                        }

                        // select type
                        switch (type) {
                            case 'debug': {
                                args.debug = 'true';
                                break;
                            }
                            case 'profiler': {
                                args.profile = 'true';
                                break;
                            }
                        }

                        // launch page
                        const url = launchSceneUrl(sceneId, args);
                        await page.goto(url, { waitUntil: 'networkidle' });
                    })).toStrictEqual([]);
                });
            }
        }
    }
});

test.describe('publish/download', () => {
    const projectName = uniqueName('api-apps');
    let projectId: number;
    let sceneId: number;
    let page: Page;

    test.describe.configure({
        mode: 'serial'
    });

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await middleware(page.context());

        // create a temporary project
        await page.goto(editorBlankUrl(), { waitUntil: 'networkidle' });
        await checkCookieAccept(page);
        projectId = await createProject(page, projectName);
    });

    test.afterAll(async () => {
        // delete temporary project
        await page.goto(editorBlankUrl(), { waitUntil: 'networkidle' });
        await deleteProject(page, projectId);

        await page.close();
    });

    test('goto editor', async () => {
        expect(await capture('editor', page, async () => {
            await page.goto(editorUrl(projectId), { waitUntil: 'networkidle' });
            sceneId = parseInt(await page.evaluate(() => window.config.scene.id), 10);
        })).toStrictEqual([]);
    });

    test('download app', async () => {
        test.setTimeout(4 * 60 * 1000);
        expect(await capture('download-project', page, async () => {
            // download app
            const job = await downloadApp(page, sceneId);

            // check download URL
            expect(job.download_url).toBeDefined();
        })).toStrictEqual([]);
    });

    test('publish app', async () => {
        test.setTimeout(4 * 60 * 1000);
        expect(await capture('publish-project', page, async () => {
            // publish app
            const app = await publishApp(page, sceneId);

            // launch app
            await page.goto(app.url, { waitUntil: 'networkidle' });

            // delete app
            await page.goto(editorSceneUrl(sceneId), { waitUntil: 'networkidle' });
            await deleteApp(page, app.id);
        })).toStrictEqual([]);
    });
});
