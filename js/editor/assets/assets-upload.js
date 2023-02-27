editor.once('load', function () {
    var uploadJobs = 0;
    var userSettings = editor.call('settings:projectUser');
    var legacyScripts = editor.call('settings:project').get('useLegacyScripts');

    var targetExtensions = {
        'jpg': true,
        'jpeg': true,
        'png': true,
        'gif': true,
        'css': true,
        'html': true,
        'json': true,
        'xml': true,
        'txt': true,
        'vert': true,
        'frag': true,
        'glsl': true,
        'mp3': true,
        'ogg': true,
        'opus': true,
        'wav': true,
        'mp4': true,
        'm4a': true,
        'js': true,
        'atlas': true
    };

    var typeToExt = {
        'scene': ['fbx', 'dae', 'obj', '3ds', 'glb'],
        'text': ['txt', 'xml', 'atlas'],
        'html': ['html'],
        'css': ['css'],
        'json': ['json'],
        'texture': ['tif', 'tga', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'dds', 'hdr', 'exr'],
        'audio': ['m4a', 'mp3', 'mp4', 'ogg', 'opus', 'wav'],
        'shader': ['glsl', 'frag', 'vert'],
        'script': ['js'],
        'font': ['ttf', 'ttc', 'otf', 'dfont']
    };

    var extToType = {};
    for (const type in typeToExt) {
        for (let i = 0; i < typeToExt[type].length; i++) {
            extToType[typeToExt[type][i]] = type;
        }
    }

    // returns true if the filename is recognized as a scene file and false otherwise
    editor.method('assets:isSceneFilename', function (filename) {
        for (let i = 0; i < typeToExt.scene.length; ++i) {
            if (filename.match(new RegExp(`.${typeToExt.scene[i]}$`, 'i')))
                return true;
        }
        return false;
    });

    editor.method('assets:canUploadFiles', function (files) {
        // check usage first
        var totalSize = 0;
        for (let i = 0; i < files.length; i++) {
            totalSize += files[i].size;
        }

        return config.owner.size + totalSize <= config.owner.diskAllowance;
    });

    var appendCommon = function (form, args) {
        // NOTE
        // non-file form data should be above file,
        // to make it parsed on back-end first

        form.append('branchId', config.self.branch.id);

        // parent folder
        if (args.parent) {
            if (args.parent instanceof Observer) {
                form.append('parent', args.parent.get('id'));
            } else {
                var id = parseInt(args.parent, 10);
                if (!isNaN(id))
                    form.append('parent', id + '');
            }
        }

        // conversion pipeline specific parameters
        var settings = editor.call('settings:projectUser');
        switch (args.type) {
            case 'texture':
            case 'textureatlas':
                form.append('pow2', settings.get('editor.pipeline.texturePot'));
                form.append('searchRelatedAssets', settings.get('editor.pipeline.searchRelatedAssets'));
                break;
            case 'scene':
                form.append('searchRelatedAssets', settings.get('editor.pipeline.searchRelatedAssets'));
                form.append('overwriteModel', settings.get('editor.pipeline.overwriteModel'));
                form.append('overwriteAnimation', settings.get('editor.pipeline.overwriteAnimation'));
                form.append('overwriteMaterial', settings.get('editor.pipeline.overwriteMaterial'));
                form.append('overwriteTexture', settings.get('editor.pipeline.overwriteTexture'));
                form.append('pow2', settings.get('editor.pipeline.texturePot'));
                form.append('preserveMapping', settings.get('editor.pipeline.preserveMapping'));
                form.append('useGlb', settings.get('editor.pipeline.useGlb'));
                form.append('animSampleRate', settings.get('editor.pipeline.animSampleRate'));
                form.append('animCurveTolerance', settings.get('editor.pipeline.animCurveTolerance'));
                form.append('animEnableCubic', settings.get('editor.pipeline.animEnableCubic'));
                form.append('animUseFbxFilename', settings.get('editor.pipeline.animUseFbxFilename'));
                form.append('useContainers', settings.get('editor.pipeline.useContainers'));
                form.append('meshCompression', settings.get('editor.pipeline.meshCompression'));
                form.append('unwrapUv', settings.get('editor.pipeline.unwrapUv'));
                form.append('unwrapUvTexelsPerMeter', settings.get('editor.pipeline.unwrapUvTexelsPerMeter'));
                break;
            case 'font':
                break;
            default:
                break;
        }

        // filename
        if (args.filename) {
            form.append('filename', args.filename);
        }

        // file
        if (args.file && args.file.size) {
            form.append('file', args.file, (args.filename || args.name));
        }

        return form;
    };

    var create = function (args) {
        var form = new FormData();

        // scope
        form.append('projectId', config.project.id);

        // type
        if (!args.type) {
            log.error('\"type\" required for upload request');
        }
        form.append('type', args.type);

        // name
        if (args.name) {
            form.append('name', args.name);
        }

        // tags
        if (args.tags) {
            form.append('tags', args.tags.join('\n'));
        }

        // source_asset_id
        if (args.source_asset_id) {
            form.append('source_asset_id', args.source_asset_id);
        }

        // data
        if (args.data) {
            form.append('data', JSON.stringify(args.data));
        }

        // meta
        if (args.meta) {
            form.append('meta', JSON.stringify(args.meta));
        }

        // preload
        var defaultAssetPreload = editor.call('settings:projectUser').get('editor.pipeline.defaultAssetPreload');

        // default preload scripts to true
        if (args.type === 'script') {
            defaultAssetPreload = true;
        }

        form.append('preload', args.preload === undefined ? defaultAssetPreload : args.preload);

        form = appendCommon(form, args);
        return form;
    };

    var update = function (assetId, args) {
        var form = new FormData();
        form = appendCommon(form, args);
        return form;
    };

    editor.method('assets:uploadFile', function (args, fn) {
        var method = 'POST';
        var url = '/api/assets';
        var form = null;
        if (args.asset) {
            var assetId = args.asset.get('id');
            method = 'PUT';
            url = '/api/assets/' + assetId;
            form = update(assetId, args);
        } else {
            form = create(args);
        }

        var job = ++uploadJobs;
        editor.call('status:job', 'asset-upload:' + job, 0);

        var data = {
            url: url,
            method: method,
            auth: true,
            data: form,
            ignoreContentType: true,
            headers: {
                Accept: 'application/json'
            }
        };

        Ajax(data)
        .on('load', function (status, data) {
            editor.call('status:job', 'asset-upload:' + job);
            if (fn) {
                fn(null, data);
            }
        })
        .on('progress', function (progress) {
            editor.call('status:job', 'asset-upload:' + job, progress);
        })
        .on('error', function (status, data) {
            if (/Disk allowance/.test(data)) {
                data += '. <a href="/upgrade" target="_blank">UPGRADE</a> to get more disk space.';
            }

            editor.call('status:error', data);
            editor.call('status:job', 'asset-upload:' + job);
            if (fn) {
                fn(data);
            }
        });
    });

    function getPathFromFolder(folder) {
        var path = [];
        if (folder && folder.get)
            path = folder.get('path').concat(parseInt(folder.get('id'), 10));
        return path;
    }

    function createFolder(currentFolder, name, callback) {
        editor.call('assets:create', {
            name: name,
            type: 'folder',
            source: true,
            preload: false,
            data: null,
            parent: currentFolder,
            scope: {
                type: 'project',
                id: config.project.id
            }
        }, (err, assetId) => {
            if (err) return;
            var currentFolder;
            var interval = setInterval(() => {
                var asset = editor.assets.get(assetId);
                if (asset) {
                    currentFolder = asset._observer;
                    clearInterval(interval);
                    callback(currentFolder);
                }
            }, 200);
        });
    }

    function uploadFile(currentFolder, file, multipleFiles) {
        var path = getPathFromFolder(currentFolder);

        var ext = file.name.split('.');
        if (ext.length === 1) return;

        ext = ext[ext.length - 1].toLowerCase();

        if (legacyScripts && ext === 'js') {
            editor.call('status:error', 'Cannot upload scripts in this project because it uses a deprecated scripting system that is now read-only.');
            return;
        }

        if (file.size === 0) {
            editor.call('status:error', `Cannot upload empty file '${file.name}'.`);
            return;
        }

        var type = extToType[ext] || 'binary';

        var source = type !== 'binary' && !targetExtensions[ext];

        // check if we need to convert textures to texture atlases
        if (type === 'texture' && userSettings.get('editor.pipeline.textureDefaultToAtlas')) {
            type = 'textureatlas';
        }

        // can we overwrite another asset?
        var sourceAsset = null;
        const fileNameLowerCase = file.name.toLowerCase();
        var candidates = editor.call('assets:find', function (item) {
            // check to see if the file to upload is already in one of the folders in the current directory
            if (item.get('type') === 'scene' && item.get('source') === source && item.get('name').toLowerCase() === fileNameLowerCase) {
                const itemPath = item.get('path');
                const parentId = itemPath[itemPath.length - 1];
                if (parentId) {
                    const itemParent = editor.assets.get(parentId);
                    // the file's parent folder must be named the same as the uploaded file and be in the current directory
                    if (JSON.stringify(itemParent.get('path')) === JSON.stringify(path) && itemParent.get('name').toLowerCase() === fileNameLowerCase) {
                        return true;
                    }
                }
            }
            // check files in current folder only
            if (!item.get('path').equals(path))
                return false;

            // try locate source when dropping on its targets
            if (source && !item.get('source') && item.get('source_asset_id')) {
                var itemSource = editor.call('assets:get', item.get('source_asset_id'));
                if (itemSource && itemSource.get('type') === type && itemSource.get('name').toLowerCase() === fileNameLowerCase) {
                    sourceAsset = itemSource;
                    return false;
                }
            }


            if (item.get('source') === source && item.get('name').toLowerCase() === fileNameLowerCase) {
                // we want the same type or try to replace a texture atlas with the same name if one exists
                if (item.get('type') === type || (type === 'texture' && item.get('type') === 'textureatlas')) {
                    return true;
                }
            }

            return false;
        });

        // candidates contains [index, asset] entries. Each entry
        // represents an asset that could be overwritten by the uploaded asset.
        // Use the first candidate by default (or undefined if the array is empty).
        // If we are uploading a texture try to find a textureatlas candidate and
        // if one exists then overwrite the textureatlas instead.
        var asset = candidates[0];
        if (type === 'texture') {
            for (var j = 0; j < candidates.length; j++) {
                if (candidates[j][1].get('type') === 'textureatlas') {
                    asset = candidates[j];
                    type = 'textureatlas';
                    break;
                }
            }
        }

        var data = null;
        if (ext === 'js') {
            data = {
                order: 100,
                scripts: {}
            };
        }

        const uploadToFolder = (folder) => {
            editor.call('assets:uploadFile', {
                asset: asset ? asset[1] : sourceAsset,
                file: file,
                type: type,
                name: file.name,
                parent: folder,
                pipeline: true,
                data: data,
                meta: asset ? asset[1].get('meta') : null
            }, function (err, data) {
                if (err || ext !== 'js') return;

                var onceAssetLoad = function (asset) {
                    var url = asset.get('file.url');
                    if (url) {
                        editor.call('scripts:parse', asset);
                    } else {
                        asset.once('file.url:set', function () {
                            editor.call('scripts:parse', asset);
                        });
                    }
                };

                var asset = editor.call('assets:get', data.id);
                if (asset) {
                    onceAssetLoad(asset);
                } else {
                    editor.once('assets:add[' + data.id + ']', onceAssetLoad);
                }
            });
        };

        var settings = editor.call('settings:projectUser');
        // if we're not replacing a current file, the file is of type FBX and the user has the createFBXFolder option enabled,
        // we should create a folder for the contents of the FBX
        if (!asset && editor.call('assets:isSceneFilename', file.name) && settings.get('editor.pipeline.createFBXFolder')) {
            createFolder(currentFolder, file.name, (folder) => {
                if (!multipleFiles) {
                    currentFolder = editor.call('assets:panel:currentFolder', folder);
                }
                uploadToFolder(folder);
            });
        } else {
            uploadToFolder(currentFolder);
        }
    }

    editor.method('assets:upload:files', function (files) {
        if (!editor.call('assets:canUploadFiles', files)) {
            var msg = 'Disk allowance exceeded. <a href="/upgrade" target="_blank">UPGRADE</a> to get more disk space.';
            editor.call('status:error', msg);
            return;
        }

        var currentFolder = editor.call('assets:panel:currentFolder');
        for (var i = 0; i < files.length; i++) {
            uploadFile(currentFolder, files[i], files.length > 1);
        }
    });

    editor.method('assets:upload:picker', function (args) {
        args = args || {};

        var fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        fileInput.style.display = 'none';
        editor.call('layout.assets').append(fileInput);

        var onChange = function () {
            editor.call('assets:upload:files', this.files);

            this.value = null;
            fileInput.removeEventListener('change', onChange);
        };

        fileInput.addEventListener('change', onChange, false);
        fileInput.click();

        fileInput.parentNode.removeChild(fileInput);
    });
});
