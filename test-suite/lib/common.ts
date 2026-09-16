import { type Page } from '@playwright/test';

import { arm } from './arm';
import { JOB_TIMEOUT, STALE_PROJECT_AGE, WORKER_INIT_TIMEOUT } from './constants';
import { RUN_ID } from './utils';

type Messages = { next: (name: string, id: number) => Promise<any> };
type Resolve = (data: any) => void;

/** Buffers completion events before a request can start its job. */
const withMessages = async <T, A>(page: Page, run: (args: A & { messages: Messages }) => Promise<T>, args: A) => {
    const messages = await page.evaluateHandle((timeout) => {
        const pending = new Map<string, Resolve>();
        const received = new Map<string, any>();
        const timers = new Set<ReturnType<typeof setTimeout>>();
        const handle = window.editor.api.globals.messenger.on('message', (name: string, data: any) => {
            if (!['project.create', 'job.update', 'app.update', 'app.delete'].includes(name)) return;
            const key = `${name}:${data.project_id ?? data.job?.id ?? data.app?.id}`;
            const done = pending.get(key);
            if (done) done(data);
            else received.set(key, data);
        });
        return {
            next(name: string, id: number) {
                const key = `${name}:${id}`;
                if (received.has(key)) return Promise.resolve(received.get(key));
                return new Promise<any>((resolve, reject) => {
                    const timer = setTimeout(() => {
                        pending.delete(key);
                        timers.delete(timer);
                        reject(new Error(`timed out waiting for ${key}`));
                    }, timeout);
                    timers.add(timer);
                    pending.set(key, (data) => {
                        clearTimeout(timer);
                        timers.delete(timer);
                        pending.delete(key);
                        resolve(data);
                    });
                });
            },
            dispose() {
                handle.unbind();
                timers.forEach(clearTimeout);
                pending.clear();
                received.clear();
            }
        };
    }, JOB_TIMEOUT);
    const dispose = async () => {
        await messages.evaluate(value => value.dispose());
        await messages.dispose();
    };
    return page.evaluate(run, { ...args, messages } as any).then(
        async (result) => {
            await dispose(); return result;
        },
        async (error) => {
            await dispose(); throw error;
        }
    );
};

export interface EsmBuildOptions {
    scripts_concatenate?: boolean;
    scripts_minify?: boolean;
    scripts_sourcemaps?: boolean;
    optimize_scene_format?: boolean;
    format?: 'static' | 'npm' | 'web_lens';
}

/**
 * Check if the "Accept All Cookies" button is present and click it.
 * This is necessary to ensure that the test can proceed without being blocked by cookie consent banners.
 *
 * @param page - The page to check for the cookie consent button.
 */
export const checkCookieAccept = async (page: Page) => {
    const cookie = page.getByRole('button', { name: 'Accept All Cookies' });
    if (await cookie.count() > 0) {
        await cookie.click();
    }
};

/**
 * Check if a reCAPTCHA is found on the page.
 *
 * @param page - The page to check for reCAPTCHA.
 * @returns A boolean indicating whether reCAPTCHA is found.
 */
export const checkCaptchaFound = async (page: Page) => {
    const form = page.locator('#login-form div');
    if (await form.count() === 0) {
        return false;
    }
    const block = await form.first();
    if ((await block.getAttribute('class'))?.includes('captcha')) {
        return true;
    }
    return false;
};

/**
 * Create a project. If masterProjectId is provided, the project will be forked from the master project.
 *
 * @param page - The page.
 * @param projectName - The project name.
 * @param masterProjectId - The master project id.
 * @returns The data result.
 */
export const createProject = async (page: Page, projectName: string, masterProjectId?: number) => {
    const projectId: number = await withMessages(page, async ({ name, fork_from, messages }) => {
        const res: any = await window.editor.api.globals.rest.projects.projectCreate({
            name,
            fork_from
        }).promisify();

        // check if not forked (no job created)
        if (!fork_from && res.id) {
            // wait for pipeline job to complete (version control documents)
            const completed = await messages.next('project.create', res.id);
            if (completed.status !== 'success') {
                throw new Error(`Project creation failed: ${completed.error}`);
            }

            // return project id
            return res.id;
        }

        // wait for job to complete
        const job: any = await messages.next('job.update', res.id).then((data: any) => {
            return window.editor.api.globals.rest.jobs.jobGet({ jobId: data.job.id }).promisify();
        });

        // check for errors
        if (job.error) {
            throw new Error(`Create error: ${job.error}`);
        }

        // return project id
        return job.data?.forked_id ?? 0;
    }, { name: projectName, fork_from: masterProjectId });
    return projectId;
};

/**
 * Delete a project.
 *
 * @param page - The page.
 * @param projectId - The project id.
 * @returns The errors.
 */
export const deleteProject = async (page: Page, projectId: number) => {
    const removed = await arm(page, (id) => {
        const globals = window.editor.api.globals;
        let event: { unbind(): void };
        return {
            done: new Promise<void>((resolve, reject) => {

                // project.delete currently omits its id; verify the target on each notification
                event = globals.messenger.on('message', (name: string) => {
                    if (name !== 'project.delete') return;
                    globals.rest.users.userProjects(window.config.self.id, '').promisify().then((projects: any) => {
                        if (!(projects.result ?? []).some((project: any) => Number(project.id) === id)) resolve();
                    }, reject);
                });
            }),
            dispose: () => event.unbind()
        };
    }, projectId, { what: `project ${projectId} deletion`, timeout: JOB_TIMEOUT });
    await page.evaluate(id => window.editor.api.globals.rest.projects.projectDelete({ projectId: id }).promisify(), projectId);
    await removed();
};

/** Deletes owned ids that still exist, including after a partially completed test. */
export const deleteProjects = async (page: Page, ids: number[]) => {
    const live = await page.evaluate(async () => {
        const res: any = await window.editor.api.globals.rest.users.userProjects(window.config.self.id, '').promisify();
        return (res.result ?? []).map((project: any) => Number(project.id)) as number[];
    });
    for (const id of new Set(ids)) {
        if (live.includes(id)) {
            await deleteProject(page, id);
        }
    }
};

/**
 * Delete the leftovers of earlier runs: the current user's projects whose name starts with the
 * given prefix, were not created by this run, and are older than `STALE_PROJECT_AGE`. A run in
 * flight beside this one owns projects that are both younger than the threshold and stamped with
 * a different run id, so it keeps them.
 *
 * @param page - The page.
 * @param prefix - The project name prefix.
 */
export const deleteProjectsByPrefix = async (page: Page, prefix: string) => {
    const projects = await page.evaluate(async ({ prefix, runId, maxAge }) => {
        const res: any = await window.editor.api.globals.rest.users.userProjects(window.config.self.id, '').promisify();
        return (res.result ?? []).filter((project: any) => {
            if (!project.name?.startsWith(prefix) || project.name.includes(runId)) {
                return false;
            }

            // the api serves a naive utc stamp, which Date otherwise reads as local time; an
            // unreadable one is left alone, since the age is what proves the project is dead
            const stamp = String(project.created ?? '');
            const created = Date.parse(/(?:Z|[+-]\d\d:?\d\d)$/.test(stamp) ? stamp : `${stamp}Z`);
            return !Number.isNaN(created) && Date.now() - created > maxAge;
        }) as { id: number; name: string }[];
    }, { prefix, runId: RUN_ID, maxAge: STALE_PROJECT_AGE });
    for (const project of projects) {
        await deleteProject(page, project.id);
    }
};

/**
 * Import a project.
 *
 * @param page - The page.
 * @param importPath - The path to the import file.
 * @returns The data result.
 */
export const importProject = async (page: Page, importPath: string) => {
    // import project
    const fileChooserPromise = page.waitForEvent('filechooser');
    const importProjectPromise = withMessages(page, async ({ messages }) => {
        const filePicker = document.createElement('input');
        filePicker.id = 'file-picker';
        filePicker.type = 'file';
        filePicker.accept = 'application/zip';
        filePicker.click();
        const files = await new Promise<FileList | null>((resolve) => {
            filePicker.addEventListener('change', () => {
                resolve(filePicker.files);
            });
        });
        filePicker.remove();

        if (!files || files.length === 0) {
            throw new Error('No files selected');
        }
        const file = files[0];

        const form = new FormData();
        form.append('file', file);

        // calculate chunk count
        const chunkSize = 20 * 1024 * 1024;
        const chunkCount = Math.ceil(file.size / chunkSize);

        // start upload
        const startRes = await fetch('/api/upload/start-upload', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${window.config.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fileName: file.name
            })
        });
        const startJson = await startRes.json();

        // get signed urls
        const signedRes = await fetch('/api/upload/signed-urls', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${window.config.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uploadId: startJson.uploadId,
                parts: chunkCount,
                key: startJson.key
            })
        });
        const signedJson = await signedRes.json();

        // upload chunks
        let chunk = 1;
        const promises = [];
        for (let start = 0; start < file.size; start += chunkSize) {
            const end = Math.min(start + chunkSize, file.size);
            const blob = file.slice(start, end);
            const url = signedJson.signedUrls[chunk - 1];
            promises.push(fetch(url, {
                method: 'PUT',
                body: blob,
                headers: {
                    'Content-Type': 'application/zip'
                }
            }));
            chunk++;
        }
        const uploadRes = await Promise.all(promises);

        // get etags
        const parts = [];
        for (let i = 0; i < uploadRes.length; i++) {
            const res = uploadRes[i];
            const etag = res.headers.get('ETag') ?? '';
            const cleanEtag = etag.replace(/^"|"$/g, '');
            parts.push({ PartNumber: i + 1, ETag: cleanEtag });
        }

        // complete upload
        await fetch('/api/upload/complete-upload', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${window.config.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uploadId: startJson.uploadId,
                parts: parts,
                key: startJson.key
            })
        });

        // import project
        const job: any = await window.editor.api.globals.rest.projects.projectImport({
            export_url: startJson.key,
            owner: window.config.self.id
        }).promisify();

        // wait for job to complete
        return messages.next('job.update', job.id).then((data: any) => {
            return window.editor.api.globals.rest.jobs.jobGet({ jobId: data.job.id }).promisify();
        });
    }, {});
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(importPath);
    const job: any = await importProjectPromise;
    if (job.error) {
        throw new Error(`Import error: ${job.error}`);
    }
    return job.data?.project_id ?? 0;
};

/**
 * Export a project.
 *
 * @param page - The page.
 * @param projectId - The project id.
 */
export const exportProject = async (page: Page, projectId: number) => {
    await withMessages(page, async ({ projectId, messages }) => {
        const job: any = await window.editor.api.globals.rest.projects.projectExport({ projectId }).promisify();
        if (job.error) {
            throw new Error(`Export error: ${job.error}`);
        }

        // wait for job to complete
        const res: any = await messages.next('job.update', job.id).then((data: any) => {
            return window.editor.api.globals.rest.jobs.jobGet({ jobId: data.job.id }).promisify();
        });

        // check for errors
        if (res.error) {
            throw new Error(`Export error: ${res.error}`);
        }

        // download the exported project
        const download = document.createElement('a');
        download.href = res.data.url;
        document.body.appendChild(download);
        download.click();
        document.body.removeChild(download);
    }, { projectId });
};

/**
 * Download project app.
 *
 * @param page - The page.
 * @param sceneId - The scene id.
 * @param esmOptions - Optional ESM build options.
 * @returns The errors.
 */
export const downloadApp = async (page: Page, sceneId: number, esmOptions?: EsmBuildOptions): Promise<{ download_url: string }> => {
    const job: any = await withMessages(page, async ({ sceneId, esmOptions, messages }) => {
        // order scenes so that the scene with the given id is first
        const { result: scenes = [] } = await window.editor.api.globals.rest.projects.projectScenes().promisify() as any;
        if (!scenes.length) {
            throw new Error('Scenes not found');
        }
        const sceneIds = scenes.reduce((ids: number[], scene: any) => {
            if (scene.id !== sceneId) {
                ids.unshift(scene.id);
            } else  {
                ids.push(scene.id);
            }
            return ids;
        }, []);

        // start download
        const data: Record<string, any> = {
            name: 'TEST',
            project_id: window.config.project.id,
            branch_id: window.config.self.branch.id,
            scenes: sceneIds,
            engine_version: window.config.engineVersions.current.version
        };
        if (esmOptions) Object.assign(data, esmOptions);
        const job: any = await window.editor.api.globals.rest.apps.appDownload(data).promisify();

        // wait for job to complete
        return messages.next('job.update', job.id).then((data: any) => {
            return window.editor.api.globals.rest.jobs.jobGet({ jobId: data.job.id }).promisify();
        });
    }, { sceneId, esmOptions });
    if (job.error) {
        throw new Error(`Download error: ${job.error}`);
    }
    return {
        download_url: job.data.download_url
    };
};

/**
 * Publish a project app.
 *
 * @param page - The page.
 * @param sceneId - The scene id.
 * @param esmOptions - Optional ESM build options.
 * @returns The errors.
 */
export const publishApp = async (page: Page, sceneId: number, esmOptions?: EsmBuildOptions): Promise<{ id: number; url: string }> => {
    const app: any = await withMessages(page, async ({ sceneId, esmOptions, messages }) => {
        // order scenes so that the scene with the given id is first
        const { result: scenes = [] } = await window.editor.api.globals.rest.projects.projectScenes().promisify() as any;
        if (!scenes.length) {
            throw new Error('Scenes not found');
        }
        const sceneIds = scenes.reduce((ids: number[], scene: any) => {
            if (scene.id !== sceneId) {
                ids.unshift(scene.id);
            } else  {
                ids.push(scene.id);
            }
            return ids;
        }, []);

        // start publish
        const data: Record<string, any> = {
            name: 'TEST',
            project_id: window.config.project.id,
            branch_id: window.config.self.branch.id,
            scenes: sceneIds,
            engine_version: window.config.engineVersions.current.version
        };
        if (esmOptions) Object.assign(data, esmOptions);
        const app: any = await window.editor.api.globals.rest.apps.appCreate(data).promisify();

        // wait for app to complete
        return messages.next('app.update', app.id).then((data: any) => {
            return window.editor.api.globals.rest.apps.appGet(data.app.id).promisify();
        });
    }, { sceneId, esmOptions });
    if (app.task.error) {
        throw new Error(`Publish error: ${app.task.error}`);
    }
    return {
        id: app.id,
        url: app.url
    };
};

/**
 * Delete an app.
 *
 * @param page - The page.
 * @param appId - The app id.
 */
export const deleteApp = async (page: Page, appId: number) => {
    const job = await withMessages(page, async ({ appId, messages }) => {
        const app: any = await window.editor.api.globals.rest.apps.appDelete(appId).promisify();
        await messages.next('app.delete', appId);
        return app.task ?? { error: 'Job not found' };
    }, { appId });
    if (job.error) {
        throw new Error(`Delete error: ${job.error}`);
    }
};

/**
 * Waits for the esm parse path. It is registered from the script worker's init callback, and
 * a Caller.call for a missing method is dropped silently, so a script created before then never
 * gets parsed and createScript hangs. The registration ends with `scripts:parser:ready`.
 */
export const waitForParser = async (page: Page) => {
    const ready = await arm(page, () => {
        if ((window.editor as any).methods.has('scripts:handleParse')) {
            return { done: Promise.resolve() };
        }
        return { done: new Promise<void>((resolve) => {
            window.editor.once('scripts:parser:ready', () => resolve());
        }) };
    }, undefined, { what: 'the script parser worker', timeout: WORKER_INIT_TIMEOUT });
    await ready();
};

/**
 * Create an ESM script asset.
 *
 * @param page - The page.
 * @param filename - The script filename (e.g. 'test-esm.mjs').
 * @param text - The script contents. Leave undefined for the ESM boilerplate.
 * @returns The asset id.
 */
export const createEsmScript = async (page: Page, filename: string, text?: string, attempts = 3): Promise<number> => {
    let lastError = '';
    for (let attempt = 0; attempt < attempts; attempt++) {
        await waitForParser(page);
        const result = await page.evaluate(({ filename, text }) => {
            const assets = window.editor.api.globals.assets;

            // reuse a script left by a prior partial attempt — the upload succeeds even
            // when the parse step times out, so the asset (with file) already exists
            const existing = assets.list().find((a: any) => a.get('type') === 'script' && a.get('name') === filename && a.get('file'));
            if (existing) {
                return { id: existing.get('id') as number };
            }

            return assets.createScript({ filename, text }).then(async (asset: any) => {
                if (!asset.get('file')) {
                    await new Promise<void>((resolve) => {
                        asset.once('file:set', () => resolve());
                    });
                }
                return { id: asset.get('id') as number };
            }).catch((err: any) => {
                return { error: err?.message ?? String(err) };
            });
        }, { filename, text });

        if ('id' in result) {
            return result.id;
        }
        lastError = result.error;
    }
    throw new Error(`createEsmScript failed after ${attempts} attempts: ${lastError}`);
};
