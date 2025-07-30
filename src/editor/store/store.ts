editor.once('load', () => {

    // Loads all the store's items
    editor.method('store:list', (
        search,
        skip,
        limit,
        selectedFilter,
        tags,
        sortPolicy,
        sortDescending) => {

        const searchTags = tags || [];
        if (selectedFilter && selectedFilter.length && selectedFilter !== 'ALL') {
            searchTags.push(selectedFilter);
        }

        return editor.api.globals.rest.store.storeList({
            search: search && search.length ? encodeURIComponent(search) : null,
            regex: search && search.length,
            sort: sortPolicy,
            order: sortDescending ? -1 : 1,
            skip: skip,
            limit: limit,
            tags: searchTags.length && encodeURIComponent(searchTags.join(',')),
            excludeTags: 'INTERNAL'
        }).promisify();
    });


    const sortQuery = function (sortPolicy, sortDescending) {
        if (sortPolicy) {
            if (sortDescending) {
                return '&sort_by=-'.concat(sortPolicy);
            }
            return '&sort_by='.concat(sortPolicy);
        }
    };

    // Loads all the store's items
    editor.method('store:sketchfab:list', async (
        search,
        skip,
        limit,
        tags,
        sortPolicy,
        sortDescending) => {

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
        return response.json();
    });


    // Loads all the store's items
    editor.method('store:assets:list', (
        search,
        skip,
        limit,
        tags,
        sortPolicy,
        sortDescending) => {

        const searchTags = tags || [];
        return editor.api.globals.rest.assets.assetsList({
            search: search && search.length ? encodeURIComponent(search) : null,
            regex: search && search.length,
            sort: sortPolicy,
            order: sortDescending ? -1 : 1,
            skip: skip,
            limit: limit,
            tags: searchTags.length && encodeURIComponent(searchTags.join(','))
        }).promisify();
    });

    // clone store item to the scene
    editor.method('store:clone', (storeItemId, name, license, projectId) => {
        return new Promise((resolve, reject) => {

            // get selected folder in assets panel
            const selectedFolder = editor.call('assets:panel:currentFolder');
            editor.api.globals.rest.store.storeClone(storeItemId, {
                scope: {
                    type: 'project',
                    id: projectId
                },
                store: 'playcanvas',
                targetFolderId: selectedFolder ? selectedFolder._data.id : null,
                license: license
            })
            .on('load', (status, response) => {
                resolve(response);
            })
            .on('error', (status, error) => {
                reject(error);
            });
        });
    });


    // clone user-scoped asset to the scene
    editor.method('myassets:clone', (assetId, name, projectId) => {
        return new Promise((resolve, reject) => {

            // get selected folder in assets panel
            const selectedFolder = editor.call('assets:panel:currentFolder');
            editor.api.globals.rest.store.storeClone(assetId, {
                scope: {
                    type: 'project',
                    id: projectId
                },
                store: 'myassets',
                targetFolderId: selectedFolder ? selectedFolder._data.id : null,
                license: ''
            })
            .on('load', (status, response) => {
                resolve(response);
            })
            .on('error', (status, error) => {
                reject(error);
            });
        });
    });

    // clone store item to the scene
    editor.method('store:clone:sketchfab', (storeItemId, name, license, projectId) => {
        return new Promise((resolve, reject) => {

            // get selected folder in assets panel
            const selectedFolder = editor.call('assets:panel:currentFolder');
            editor.api.globals.rest.store.storeClone(storeItemId, {
                scope: {
                    type: 'project',
                    id: projectId
                },
                name: name,
                store: 'sketchfab',
                targetFolderId: selectedFolder ? selectedFolder._data.id : null,
                license: license
            })
            .on('load', (status, response) => {
                resolve(response);
            })
            .on('error', (status, error) => {
                reject(error);
            });
        });
    });

    // Load asset file contents and call callback
    editor.method('store:loadAsset', (asset) => {
        return editor.api.globals.rest.store.storeAssetFile(asset.id, asset.name).promisify();
    });

    // Upload specified export
    editor.method('store:uploadStoreItems', (file, progressHandler) => {

        return new Promise((resolve, reject) => {
            editor.api.globals.rest.store.storeUpload(file, 'multipart/form-data')
            .on('progress', (progress) => {
                if (progressHandler) {
                    progressHandler(progress);
                }
            })
            .on('load', (status, response) => {
                resolve(response);
            })
            .on('error', (status, error) => {
                reject(error);
            });
        });
    });

    // Loads all the store's items
    editor.method('store:license:list', async () => {
        const results = await editor.api.globals.rest.store.storeLicenses().promisify();
        return results.result;
    });
});
