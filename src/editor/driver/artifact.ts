const PAGE_SIZE = 500;

/**
 * Pages through a project's builds for one id.
 *
 * @param builds - The backend builds service.
 * @param id - The build id.
 * @returns The build, or undefined when no page holds it.
 */
const findBuild = async (builds: any, id: number | string) => {
    let offset = 0;
    while (true) {
        const data = await builds.projectBuilds(PAGE_SIZE, offset).promisify();
        const build = data.result.find((item: any) => Number(item.id) === Number(id));
        offset += data.result.length;
        if (build || !data.result.length || offset >= data.pagination.total) {
            return build;
        }
    }
};

/**
 * Picks the artifact to download from a complete build.
 *
 * @param build - The build record.
 * @returns The artifact, preferring type download.
 */
const pickArtifact = (build: any) => {
    if (build.status !== 'complete') {
        throw new Error(`Build ${build.id} is not complete (status: ${build.status}).`);
    }
    const list = build.artifacts || [];
    const artifact = list.find((item: any) => item.type === 'download') || list[0];
    if (!artifact?.url) {
        throw new Error(`Build ${build.id} has no downloadable artifact.`);
    }
    return artifact;
};

/**
 * Decoded last path segment of a url.
 *
 * @param url - The artifact url.
 * @returns The filename.
 */
const artifactName = (url: string) => {
    const name = url.split(/[?#]/)[0].split('/').pop() || '';
    return decodeURIComponent(name) || 'download.zip';
};

export { artifactName, findBuild, pickArtifact };
