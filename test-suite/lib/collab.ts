import type { BrowserContext, Page } from '@playwright/test';

import { HOST, editorSceneUrl } from './config';
import type { Project } from './fixtures';
import { waitForEditor } from './ready';

/** Reads the account behind a context's cookie; a collaborator's id is never known up front. */
const identity = async (context: BrowserContext) => {
    const res = await context.request.get(`https://${HOST}/api/id`);
    const { id } = await res.json();
    const user = await context.request.get(`https://${HOST}/api/users/${id}`);
    const { username } = await user.json();
    return { id: id as number, username: username as string };
};

// the invitee field is `user`, as the editor's own picker sends it (picker-team-management.ts)
const grant = (page: Page, projectId: number, username: string, level: string) => page.evaluate(({ projectId, username, level }) => {
    const collab = { user: username, access_level: level } as any;
    return window.editor.api.globals.rest.projects.projectCollabCreate(projectId, collab).promisify();
}, { projectId, username, level });

// a 204 carries no body and promisify() rejects parsing it, so settle on either outcome
export const revoke = (page: Page, projectId: number, userId: number) => page.evaluate(({ projectId, userId }) => new Promise<void>((resolve) => {
    const req = window.editor.api.globals.rest.projects.projectCollabDelete(projectId, userId);
    req.on('load', () => resolve());
    req.on('error', () => resolve());
}), { projectId, userId });

/** Grants the second account access, then opens the same scene in its context. */
export const join = async (host: Page, context: BrowserContext, project: Project, level: 'read' | 'write') => {
    const who = await identity(context);
    await grant(host, project.id, who.username, level);
    const page = await context.newPage();
    await page.goto(editorSceneUrl(project.sceneId, { disableBubbles: true }));
    await waitForEditor(page);
    return { ...who, page };
};
