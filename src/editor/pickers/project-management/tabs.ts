import { config } from '../../config';

/** The tab the projects page runs in; projects never open in it. */
export const PROJECTS_TAB = 'editor:projects';

// local builds the next page should keep loading
const LOCAL_FLAGS = ['use_local_frontend', 'use_local_engine'];

/**
 * The tab an editor for a project runs in, so other tabs can switch to it instead of opening another.
 */
export const projectTab = (id: number | string) => `editor:${id}`;

const withLocalFlags = (url: string) => {
    const params = new URLSearchParams(location.search);
    const keep = new URLSearchParams();
    for (const flag of LOCAL_FLAGS) {
        if (params.has(flag)) {
            keep.set(flag, params.get(flag));
        }
    }
    const query = keep.toString();
    return query ? `${url}?${query}` : url;
};

/**
 * The editor url for a project, or for one of its scenes, keeping any local build flags.
 */
export const editorUrl = (id: number | string, sceneId?: number | string) =>
    withLocalFlags(`${config.url.home}/editor/${sceneId ? `scene/${sceneId}` : `project/${id}`}`);

// switches to the named tab, or opens it at url; a tab that's already open keeps its page unless navigate is set.
// browsers only allow this straight after a click
const openTab = (name: string, url: string, navigate = false) => {
    const tab = window.open('', name);
    if (tab && (navigate || tab.location.href === 'about:blank')) {
        tab.location.href = url;
    }
};

/**
 * Switches to the projects page tab, opening it if needed.
 */
export const openProjects = () => openTab(PROJECTS_TAB, withLocalFlags(`${config.url.home}/editor`));

/**
 * Switches to a project's editor tab, opening it if needed. With a scene, an open tab moves to that scene.
 */
export const openProject = (id: number | string, sceneId?: number | string) =>
    openTab(projectTab(id), editorUrl(id, sceneId), !!sceneId);
