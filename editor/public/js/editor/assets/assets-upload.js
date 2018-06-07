editor.once('load', function() {
    'use strict';

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
        'wav': true,
        'mp4': true,
        'm4a': true,
        'js': true,
        'atlas': true
    };

    var typeToExt = {
        'scene': [ 'fbx', 'dae', 'obj', '3ds' ],
        'text': [ 'txt', 'xml', 'atlas' ],
        'html': [ 'html' ],
        'css': [ 'css' ],
        'json': [ 'json' ],
        'texture': [ 'tif', 'tga', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'dds', 'hdr', 'exr' ],
        'audio': [ 'wav', 'mp3', 'mp4', 'ogg', 'm4a' ],
        'shader': [ 'glsl', 'frag', 'vert' ],
        'script': [ 'js' ],
        'font': [ 'ttf', 'ttc', 'otf', 'dfont' ]
    };

    var extToType = { };
    for(var type in typeToExt) {
        for(var i = 0; i < typeToExt[type].length; i++) {
            extToType[typeToExt[type][i]] = type;
        }
    }


    editor.method('assets:canUploadFiles', function (files) {
        // check usage first
        var totalSize = 0;
        for(var i = 0; i < files.length; i++) {
            totalSize += files[i].size;
        }

        return config.owner.size + totalSize <= config.owner.diskAllowance;
    });

    editor.method('assets:upload:script', function(file) {
        var reader = new FileReader();

        reader.addEventListener('load', function() {
            editor.call('sourcefiles:create', file.name, reader.result, function(err) {
                if (err)
                    return;

                editor.call('assets:panel:currentFolder', 'scripts');
            });
        }, false);

        reader.readAsText(file);
    });

    var create = function (args) {
        var form = new FormData();

        // scope
        form.append('project', config.project.id);

        // type
        if (!args.type) {
            console.error('\"type\" required for upload request');
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
        form.append('preload', args.preload === undefined ? true : args.preload);

        form = appendCommon(form, args);
        return form;
    }

    var update = function (assetId, args) {
        var form = new FormData();
        form = appendCommon(form, args);
        return form;
    }

    var appendCommon = function(form, args) {
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
                if (! isNaN(id))
                    form.append('parent', id + '');
            }
        }

        // conversion pipeline specific parameters
        var settings = editor.call('settings:projectUser');
        switch(args.type) {
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
                break
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
    }

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
        .on('load', function(status, data) {
            editor.call('status:job', 'asset-upload:' + job);
            if (fn) {
                fn(null, data);
            }
        })
        .on('progress', function(progress) {
            editor.call('status:job', 'asset-upload:' + job, progress);
        })
        .on('error', function(status, data) {
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

    editor.method('assets:upload:files', function(files) {
        if (! editor.call('assets:canUploadFiles', files)) {
            var msg = 'Disk allowance exceeded. <a href="/upgrade" target="_blank">UPGRADE</a> to get more disk space.';
            editor.call('status:error', msg);
            return;
        }

        var currentFolder = editor.call('assets:panel:currentFolder');

        for(var i = 0; i < files.length; i++) {
            var path = [ ];

            if (currentFolder && currentFolder.get)
                path = currentFolder.get('path').concat(parseInt(currentFolder.get('id'), 10));

            var source = false;
            var ext = files[i].name.split('.');
            if (ext.length === 1)
                continue;

            ext = ext[ext.length - 1].toLowerCase();

            if (legacyScripts && ext === 'js') {
                editor.call('assets:upload:script', files[i]);
            } else {
                var type = extToType[ext] || 'binary';

                var source = type !== 'binary' && ! targetExtensions[ext];

                // check if we need to convert textures to texture atlases
                if (type === 'texture' && userSettings.get('editor.pipeline.textureDefaultToAtlas')) {
                    type = 'textureatlas';
                }

                // can we overwrite another asset?
                var sourceAsset = null;
                var asset = editor.call('assets:findOne', function(item) {
                    // check files in current folder only
                    if (! item.get('path').equals(path))
                        return;

                    // try locate source when dropping on its targets
                    if (source && ! item.get('source') && item.get('source_asset_id')) {
                        var itemSource = editor.call('assets:get', item.get('source_asset_id'));
                        if (itemSource && itemSource.get('type') === type && itemSource.get('name').toLowerCase() === files[i].name.toLowerCase()) {
                            sourceAsset = itemSource;
                            return;
                        }
                    }

                    return item.get('source') === source && item.get('type') === type && item.get('name').toLowerCase() === files[i].name.toLowerCase();
                });

                var data = null;
                if (ext === 'js') {
                    data = {
                        order: 100,
                        scripts: { }
                    };
                }

                editor.call('assets:uploadFile', {
                    asset: asset ? asset[1] : sourceAsset,
                    file: files[i],
                    type: type,
                    name: files[i].name,
                    parent: editor.call('assets:panel:currentFolder'),
                    pipeline: true,
                    data: data,
                    meta: asset ? asset[1].get('meta') : null
                }, function(err, data) {
                    if (err || ext !== 'js') return;

                    var onceAssetLoad = function(asset) {
                        var url = asset.get('file.url');
                        if (url) {
                            editor.call('scripts:parse', asset);
                        } else {
                            asset.once('file.url:set', function() {
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
            }
        }
    });

    editor.method('assets:upload:picker', function(args) {
        args = args || { };

        var parent = args.parent || editor.call('assets:panel:currentFolder');

        var fileInput = document.createElement('input');
        fileInput.type = 'file';
        // fileInput.accept = '';
        fileInput.multiple = true;
        fileInput.style.display = 'none';
        editor.call('layout.assets').append(fileInput);

        var onChange = function() {
            editor.call('assets:upload:files', this.files);

            this.value = null;
            fileInput.removeEventListener('change', onChange);
        };

        fileInput.addEventListener('change', onChange, false);
        fileInput.click();

        fileInput.parentNode.removeChild(fileInput);
    });
});
