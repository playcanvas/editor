import { config } from '@/editor/config';
import { mcp } from '@/editor/mcp/connection';

import { driver } from './driver';
import { pickProjectFields } from './project-fields';

const api = editor.api.globals;

// a new project can't be opened until the backend has set it up (messenger project.create)
const CREATE_READY_MS = 30_000;

const NO_PROJECT = 'No project is open. Pass a project id, or call list_projects and open_project first.';

const currentId = () => config.project?.id ?? null;

const summary = (p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? '',
    private: !!p.private,
    owner: p.owner,
    ownerId: p.owner_id,
    modified: p.modified
});

const getProject = (projectId: number) =>
    api.rest.projects.projectGet({ projectId } as any).promisify() as Promise<any>;

driver.method('project:list', async (ownerId?: number) => {
    try {
        const res: any = await api.rest.users.userProjects(ownerId ?? config.self.id, 'profile').promisify();
        const result = (res?.result ?? []).map(summary);
        return { data: result, meta: { total: result.length, count: result.length } };
    } catch (e: any) {
        return { error: e.message };
    }
});

driver.method('project:get', async (projectId?: number) => {
    const id = projectId ?? currentId();
    if (id === null) {
        return { error: NO_PROJECT };
    }
    try {
        const project = await getProject(id);
        return { data: { ...summary(project), open: project.id === currentId() } };
    } catch (e: any) {
        return { error: e.message };
    }
});

driver.method('project:create', async (input: Record<string, unknown>) => {
    const { fields, error } = pickProjectFields(input, 'create');
    if (error) {
        return { error };
    }

    // listen before creating so a fast setup event isn't missed
    const ready = new Set<number>();
    let onReady: ((id: number) => void) | null = null;
    const evt = editor.on('messenger:project.create', (msg: any) => {
        ready.add(msg.project_id);
        onReady?.(msg.project_id);
    });

    try {
        // match the New Project dialog: the user owns it and it uses the current script system
        const project: any = await api.rest.projects
            .projectCreate({
                owner: config.self.id,
                ...fields,
                settings: { useLegacyScripts: false, vr: false }
            } as any)
            .promisify();

        const initialized =
            ready.has(project.id) ||
            (await new Promise<boolean>((resolve) => {
                const timer = setTimeout(() => resolve(false), CREATE_READY_MS);
                onReady = (id) => {
                    if (id === project.id) {
                        clearTimeout(timer);
                        resolve(true);
                    }
                };
            }));
        return { data: summary(project), meta: initialized ? {} : { initializing: true } };
    } catch (e: any) {
        return { error: e.message };
    } finally {
        evt.unbind();
    }
});

driver.method('project:update', async (projectId: number, input: Record<string, unknown>) => {
    const { fields, error } = pickProjectFields(input, 'update');
    if (error) {
        return { error };
    }
    try {
        const project: any = await api.rest.projects.projectUpdate({ projectId, ...fields } as any).promisify();
        editor.call('picker:project:cms:refreshProjects');
        return { data: summary(project) };
    } catch (e: any) {
        return { error: e.message };
    }
});

driver.method('project:open', async (projectId: number) => {
    if (projectId === currentId()) {
        return { data: { id: projectId, reloading: false } };
    }
    try {
        await getProject(projectId);
    } catch (e: any) {
        return { error: e.message };
    }

    // reply first: navigating drops the socket, and the editor reconnects on load
    mcp.flushed().then(() => window.location.assign(`/editor/project/${projectId}`));
    return { data: { id: projectId, reloading: true } };
});
