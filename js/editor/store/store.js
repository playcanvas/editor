import { Ajax } from '../../common/ajax.js';

editor.once('load', function () {

    // Loads all the store's items
    editor.method('store:list', async function (
            search,
            skip,
            limit,
            selectedFilter,
            tags,
            sortPolicy,
            sortDescending) {

        let url = `${config.url.api}/store?sort=${sortPolicy}&order=${sortDescending ? -1 : 1}&skip=${skip}&limit=${limit}}`;
        if (search && search.length) {
            url += `&regexp=true&search=${encodeURIComponent(search)}`;
        }
        const searchTags = tags || [];
        if (selectedFilter && selectedFilter.length && selectedFilter !== 'ALL') {
            searchTags.push(selectedFilter);
        }

        if (searchTags.length) {
            url += `&tags=${encodeURIComponent(searchTags.join(','))}`;
        }

        url += `&excludeTags=INTERNAL`;

        const response = await fetch(url);
        return response.json();
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
    editor.method('store:sketchfab:list', async function (
            search,
            skip,
            limit,
            tags,
            sortPolicy,
            sortDescending) {

        // Calculate the date from a week ago
        var weekAgoDate = new Date();
        weekAgoDate.setDate(new Date().getDate() - 7);

        // sketch fab doesn't allow more than 24 items per page
        limit = Math.min(24, limit);

        let url = `https://api.sketchfab.com/v3/search?type=models&downloadable=true&count=${limit}`;

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
        } else {
            url += '&date=7';
        }

        url += sortQuery(sortPolicy, sortDescending);

        const response = await fetch(url);
        return response.json();
    });

    // clone store item to the scene
    editor.method('store:clone', function (storeItemId, name, license, projectId) {
        return new Promise((resolve, reject) => {

            // get selected folder in assets panel
            const selectedFolder = editor.call('assets:panel:currentFolder');
            Ajax({
                url: `{{url.api}}/store/${storeItemId}/clone`,
                auth: false,
                method: 'POST',
                data: {
                    scope: {
                        type: 'project',
                        id: projectId
                    },
                    store: 'playcanvas',
                    targetFolderId: selectedFolder ? selectedFolder._data.id : null,
                    license: license
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

    // clone store item to the scene
    editor.method('store:clone:sketchfab', function (storeItemId, name, license, projectId) {
        return new Promise((resolve, reject) => {

            // get selected folder in assets panel
            const selectedFolder = editor.call('assets:panel:currentFolder');
            Ajax({
                url: `{{url.api}}/store/${storeItemId}/clone`,
                auth: false,
                method: 'POST',
                data: {
                    scope: {
                        type: 'project',
                        id: projectId
                    },
                    name: name,
                    store: 'sketchfab',
                    targetFolderId: selectedFolder ? selectedFolder._data.id : null,
                    license: license
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

    // Load asset file contents and call callback
    editor.method('store:loadAsset', async function (asset) {
        const id = asset.id;
        const url = `${config.url.api}/store/assets/${id}/file/${asset.name}`;
        const response = await fetch(url);
        return response.text();
    });

    // Upload specified export
    editor.method('store:uploadStoreItems', function (file, progressHandler) {

        return new Promise((resolve, reject) => {
            Ajax({
                'url': `{{url.api}}/store/upload`,
                'data': file,
                'method': "POST",
                'auth': true,
                'mimeType': 'multipart/form-data'
            })
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
    editor.method('store:license:list', async function () {
        const response = await fetch(`${config.url.api}/store/licenses`);
        const results = await response.json();
        return results.result;
    });
});
