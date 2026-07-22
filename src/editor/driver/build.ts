import { config } from '@/editor/config';

import { driver } from './driver';
import { api, log } from './shared';

const BUILD_PAGE_SIZE = 500;

type Scene = { id: number | string };
type Filters = { type?: string; status?: string; format?: string; branch?: string; actor?: string };
type Options = {
    name: string;
    sceneIds: number[];
    primarySceneId?: number;
    engineVersion?: string;
    description?: string;
    version?: string;
    releaseNotes?: string;
    concatenate?: boolean;
    minify?: boolean;
    sourceMaps?: boolean;
    optimizeSceneFormat?: boolean;
    format?: string;
};

const scenes = () => new Promise<Scene[]>((resolve, reject) => editor.call('scenes:list', resolve, reject));

const payload = async (options: Options, format = 'playcanvas') => {
    if (!options.name || typeof options.name !== 'string' || options.name.length > 1000) {
        throw new Error('Build name is required and must not exceed 1000 characters.');
    }
    const available = await scenes();
    const ids = [...new Set((options.sceneIds || []).map(Number))] as number[];
    const missing = ids.filter((id) => !available.some((scene) => Number(scene.id) === id));
    if (!ids.length) {
        throw new Error('At least one scene id is required.');
    }
    if (missing.length) {
        throw new Error(`Scenes not found in the designated project: ${missing.join(', ')}.`);
    }
    if (options.primarySceneId !== undefined) {
        const primary = Number(options.primarySceneId);
        if (!ids.includes(primary)) {
            throw new Error('primarySceneId must be included in sceneIds.');
        }
        ids.splice(ids.indexOf(primary), 1);
        ids.unshift(primary);
    }
    const key = options.engineVersion || editor.call('settings:session').get('engineVersion');
    const engine = config.engineVersions[key as keyof typeof config.engineVersions]?.version || key;
    const versions = Object.values(config.engineVersions).map((item) => item?.version);
    if (!versions.includes(engine)) {
        throw new Error(`Unknown engine version: ${key}.`);
    }
    const npm = format === 'npm';
    return {
        name: options.name,
        project_id: config.project.id,
        branch_id: config.self.branch.id,
        scenes: ids,
        ...(options.description ? { description: options.description } : {}),
        ...(options.version ? { version: options.version } : {}),
        ...(options.releaseNotes ? { release_notes: options.releaseNotes } : {}),
        scripts_concatenate: !npm && !!options.concatenate,
        scripts_minify: !npm && !!options.minify,
        scripts_sourcemaps: !npm && !!options.minify && !!options.sourceMaps,
        optimize_scene_format: !npm && !!options.optimizeSceneFormat,
        engine_version: engine,
        format
    };
};

driver.method('builds:list', async (options: { limit?: number; cursor?: string; filters?: Filters } = {}) => {
    const limit = options.limit ?? 50;
    const offset = Number(options.cursor || 0);
    const data = await api.rest.projects.projectBuilds(limit, offset, options.filters).promisify();
    const total = data.pagination?.total ?? data.result.length;
    const end = offset + data.result.length;
    log(`Listed builds (${data.result.length}/${total})`);
    return {
        data: data.result,
        meta: {
            total,
            count: data.result.length,
            hasMore: end < total,
            nextCursor: end < total ? String(end) : null
        }
    };
});

driver.method('builds:get', async (id) => {
    let offset = 0;
    while (true) {
        const data = await api.rest.projects.projectBuilds(BUILD_PAGE_SIZE, offset).promisify();
        const build = data.result.find((item) => Number(item.id) === Number(id));
        if (build) {
            return { data: build };
        }
        offset += data.result.length;
        if (!data.result.length || offset >= data.pagination.total) {
            return { error: `Build not found in the designated project: ${id}.` };
        }
    }
});

driver.method('builds:create', async (options) => {
    if (!editor.call('permissions:write')) {
        return { error: 'Write permission is required to create a build.' };
    }
    const data = await api.rest.apps.appCreate(await payload(options)).promisify();
    log(`Created build: ${options.name}`);
    return { data };
});

driver.method('builds:download', async (options) => {
    if (!editor.call('permissions:write')) {
        return { error: 'Write permission is required to create a download build.' };
    }
    const data = await api.rest.apps.appDownload(await payload(options, options.format)).promisify();
    log(`Created ${options.format} download build: ${options.name}`);
    return { data };
});

driver.method('builds:delete', async (id) => {
    if (!editor.call('permissions:write')) {
        return { error: 'Write permission is required to delete a build.' };
    }
    const data = await api.rest.projects.projectBuildDelete(Number(id)).promisify();
    log(`Deleted build(${id})`);
    return { data };
});
