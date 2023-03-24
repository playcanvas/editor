editor.once('load', function () {

    // Loads all the store's items
    editor.method('store:list', function (
            search,
            skip,
            limit,
            selectedFilter,
            sortPolicy,
            sortDescending) {

        let url = `{{url.api}}/store?sort=${sortPolicy}&order=${sortDescending ? -1 : 1}&skip=${skip}&limit=${limit}}`;
        if (search && search.length) {
            url += `&regexp=true&search=${search}`;
        }
        if (selectedFilter && selectedFilter.length && selectedFilter !== 'FEATURED') {
            url += `&tags=${selectedFilter}`;
        }

        url += `&excludeTags=INTERNAL`;

        return new Promise((resolve, reject) => {
            Ajax({
                url: url,
                auth: false,
                method: 'GET'
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
    editor.method('store:assets:list', function (storeItemId) {
        return new Promise((resolve, reject) => {
            Ajax({
                url: `{{url.api}}/store/${storeItemId}/assets`,
                auth: false,
                method: 'GET'
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
    editor.method('store:clone', function (storeItemId, name, projectId) {
        return new Promise((resolve, reject) => {
            // create a target folder
            editor.call('assets:create:folder', {
                name: name,
                noSelect: true,
                fn: (err, id) => {
                    if (err) {
                        editor.call('status:error', err);
                        reject(err);
                    }
                    Ajax({
                        url: `{{url.api}}/store/${storeItemId}/clone`,
                        auth: false,
                        method: 'POST',
                        data: {
                            scope: {
                                type: 'project',
                                id: projectId
                            },
                            targetFolderId: id
                        }
                    })
                    .on('load', (status, response) => {
                        resolve(response);
                    })
                    .on('error', (status, error) => {
                        reject(error);
                    });
                }
            });
        });
    });

    // Load store item
    editor.method('store:loadStoreItem', function (id) {
        return new Promise((resolve, reject) => {
            Ajax({
                url: '{{url.api}}/store/' + id,
                auth: false
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
    editor.method('store:loadAsset', function (asset) {
        return new Promise((resolve, reject) => {
            const id = asset.id;
            Ajax({
                url: '{{url.api}}/store/assets/' + id + '/file/' + asset.file.filename,
                auth: false,
                notJson: true
            })
            .on('load', (status, response) => {
                // replace \r and \r\n with \n
                response = response.replace(/\r\n?/g, '\n');
                resolve(response);
            })
            .on('error', (status, error) => {
                reject(error);
            });
        });
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
});
