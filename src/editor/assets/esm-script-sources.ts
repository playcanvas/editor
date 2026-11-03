type Asset = { get: (path: string) => unknown };

type Deps = {
    list: () => Asset[];
    isModule: (asset: Asset) => boolean;
    virtualPath: (asset: Asset) => string;
    realPath: (asset: Asset) => string;
    fetchText: (url: string) => Promise<string>;
};

/**
 * Tracks which esm script files the parser already has, so each parse only sends what changed.
 * Calls run one at a time: concurrent calls would each see an empty cache and refetch every file.
 *
 * @param deps - The editor lookups and the file fetch.
 * @returns A function resolving to the new or changed `[path, content]` files and the deleted paths.
 */
export const createScriptSources = ({ list, isModule, virtualPath, realPath, fetchText }: Deps) => {
    const cache = new Map<string, unknown>();
    let tail: Promise<unknown> = Promise.resolve();

    const load = async (pathFilter: string[]) => {
        const assets = list();

        // files in the cache that are no longer esm script assets
        const deletedFiles: string[] = [];
        const paths = new Set(assets.filter(isModule).map(virtualPath));
        for (const path of cache.keys()) {
            if (!paths.has(path)) {
                deletedFiles.push(path);
                cache.delete(path);
            }
        }

        const scripts = await Promise.all(
            assets.map(async (asset) => {
                if (!isModule(asset)) {
                    return;
                }

                const path = virtualPath(asset);
                if (pathFilter.includes(path)) {
                    return;
                }

                const hash = asset.get('file.hash');
                if (cache.get(path) === hash) {
                    return;
                }

                try {
                    const content = await fetchText(realPath(asset));
                    cache.set(path, hash);
                    return [path, content];
                } catch (e) {
                    console.error(`Failed to fetch ESM script ${path}`, e);
                }
            })
        );

        return [scripts.filter((script) => !!script), deletedFiles] as const;
    };

    return (pathFilter: string[] = []) => {
        const next = tail.then(() => load(pathFilter));
        tail = next.catch(() => undefined);
        return next;
    };
};
