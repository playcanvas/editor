import { backend, UNSUPPORTED } from '@/common/backend';
import { createLog } from '@/common/sentry';

const log = createLog('<PATH>');

type StoreCloneResponse = {
    fontSources?: number[];
};

editor.once('load', () => {
    // Loads all the store's items
    editor.method('store:list', (search, skip, limit, selectedFilter, tags, sortPolicy, sortDescending) => {
        const searchTags = tags || [];
        if (selectedFilter && selectedFilter.length && selectedFilter !== 'ALL') {
            searchTags.push(selectedFilter);
        }

        const catalog = backend().storeCatalog;
        if (!catalog) {
            return Promise.reject(UNSUPPORTED);
        }
        return catalog
            .storeList({
                search: search && search.length ? encodeURIComponent(search) : null,
                regex: search && search.length,
                sort: sortPolicy,
                order: sortDescending ? -1 : 1,
                skip: skip,
                limit: limit,
                tags: searchTags.length && encodeURIComponent(searchTags.join(',')),
                excludeTags: 'INTERNAL'
            })
            .promisify();
    });

    const sortQuery = function (sortPolicy: string, sortDescending: boolean) {
        if (sortPolicy) {
            if (sortDescending) {
                return '&sort_by=-'.concat(sortPolicy);
            }
            return '&sort_by='.concat(sortPolicy);
        }
    };

    // Loads all the store's items
    editor.method(
        'store:sketchfab:list',
        async (
            search: string,
            skip: string,
            limit: number,
            tags: string[],
            sortPolicy: string,
            sortDescending: boolean
        ) => {
            if (!backend().sketchfabCatalog) {
                return Promise.reject(UNSUPPORTED);
            }

            // Calculate the date from a week ago
            const weekAgoDate = new Date();
            weekAgoDate.setDate(new Date().getDate() - 7);

            // sketch fab doesn't allow more than 24 items per page
            limit = Math.min(24, limit);

            let url = `https://api.sketchfab.com/v3/search?restricted=0&type=models&downloadable=true&count=${limit}`;

            if (skip) {
                url += `&cursor=${skip}`;
            }

            if (tags) {
                url += `&tags=${encodeURIComponent(tags.join(','))}`;
            }

            // if search query is not present, just show the models from the last week
            if ((search && search.length) || (tags && tags.length)) {
                url += `&q=${encodeURIComponent(search)}`;

                // log number of times sketchfab store was searched
                metrics.increment({ metricsName: 'store.search.count.sketchfab' });
            }

            url += sortQuery(sortPolicy, sortDescending);

            const response = await fetch(url);
            if (!response.ok) {
                void log.error`store search failed ${response.status}: ${response.statusText}`;
                return { result: [] };
            }
            return response.json();
        }
    );

    // Loads all the store's items
    editor.method(
        'store:assets:list',
        (search: string, skip: number, limit: number, tags: string[], sortPolicy: string, sortDescending: boolean) => {
            const searchTags = tags || [];
            const userAssets = backend().userAssets;
            if (!userAssets) {
                return Promise.reject(UNSUPPORTED);
            }
            return userAssets
                .assetsList({
                    search: search && search.length ? encodeURIComponent(search) : null,
                    regex: search && search.length,
                    sort: sortPolicy,
                    order: sortDescending ? -1 : 1,
                    skip: skip,
                    limit: limit,
                    tags: searchTags.length && encodeURIComponent(searchTags.join(','))
                })
                .promisify();
        }
    );

    // clone store item to the scene
    editor.method('store:clone', (storeItemId: string, name: string, license: string, projectId: string) => {
        return new Promise((resolve, reject) => {
            // get selected folder in assets panel
            const selectedFolder = editor.call('assets:panel:currentFolder');
            const service = backend().storeImport;
            if (!service) {
                reject(UNSUPPORTED);
                return;
            }
            service
                .storeClone(storeItemId, {
                    scope: {
                        type: 'project',
                        id: projectId
                    },
                    store: 'playcanvas',
                    targetFolderId: selectedFolder ? selectedFolder._data.id : null,
                    license: license
                })
                .on('load', (_status: number, response: unknown) => {
                    const data = response as StoreCloneResponse;
                    Promise.all((data.fontSources || []).map((id) => editor.call('fonts:unpack', id))).then(
                        () => resolve(response),
                        reject
                    );
                })
                .on('error', (_status: number, error: unknown) => {
                    reject(error);
                });
        });
    });

    // clone user-scoped asset to the scene
    editor.method('myassets:clone', (assetId: string, name: string, projectId: string) => {
        return new Promise((resolve, reject) => {
            // get selected folder in assets panel
            const selectedFolder = editor.call('assets:panel:currentFolder');
            const service = backend().storeImport;
            if (!service) {
                reject(UNSUPPORTED);
                return;
            }
            service
                .storeClone(assetId, {
                    scope: {
                        type: 'project',
                        id: projectId
                    },
                    store: 'myassets',
                    targetFolderId: selectedFolder ? selectedFolder._data.id : null,
                    license: ''
                })
                .on('load', (_status: number, response: unknown) => {
                    resolve(response);
                })
                .on('error', (_status: number, error: unknown) => {
                    reject(error);
                });
        });
    });

    // clone store item to the scene
    editor.method('store:clone:sketchfab', (storeItemId: string, name: string, license: string, projectId: string) => {
        return new Promise((resolve, reject) => {
            // get selected folder in assets panel
            const selectedFolder = editor.call('assets:panel:currentFolder');
            const service = backend().storeImport;
            if (!service) {
                reject(UNSUPPORTED);
                return;
            }
            service
                .storeClone(storeItemId, {
                    scope: {
                        type: 'project',
                        id: projectId
                    },
                    name: name,
                    store: 'sketchfab',
                    targetFolderId: selectedFolder ? selectedFolder._data.id : null,
                    license: license
                })
                .on('load', (_status: number, response: unknown) => {
                    resolve(response);
                })
                .on('error', (_status: number, error: unknown) => {
                    reject(error);
                });
        });
    });

    // Load asset file contents and call callback
    editor.method('store:loadAsset', (asset: { id: string; name: string }) => {
        const catalog = backend().storeCatalog;
        return catalog ? catalog.storeAssetFile(asset.id, asset.name).promisify() : Promise.reject(UNSUPPORTED);
    });

    // Upload specified export
    editor.method('store:uploadStoreItems', (file: File, progressHandler?: (progress: unknown) => void) => {
        return new Promise((resolve, reject) => {
            const service = backend().storePublishing;
            if (!service) {
                reject(UNSUPPORTED);
                return;
            }
            service
                .storeUpload(file, 'multipart/form-data')
                .on('progress', (progress: unknown) => {
                    if (progressHandler) {
                        progressHandler(progress);
                    }
                })
                .on('load', (_status: number, response: unknown) => {
                    resolve(response);
                })
                .on('error', (_status: number, error: unknown) => {
                    reject(error);
                });
        });
    });

    // Loads all the store's items
    editor.method('store:license:list', async () => {
        const catalog = backend().storeCatalog;
        if (!catalog) {
            throw UNSUPPORTED;
        }
        const results = await catalog.storeLicenses().promisify();
        return results.result;
    });
});
