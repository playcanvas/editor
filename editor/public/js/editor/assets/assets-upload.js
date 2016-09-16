editor.once('load', function() {
    'use strict';

    var uploadJobs = 0;
    var legacyScripts = editor.call('project:settings').get('use_legacy_scripts');

    var targetExtensions = [ 'jpg', 'jpeg', 'png', 'js', 'css', 'html', 'json', 'xml', 'txt', 'vert', 'frag', 'glsl', 'mp3', 'ogg', 'wav', 'mp4', 'atlas' ];
    var tmp = { };
    for(var i = 0; i < targetExtensions.length; i++)
        tmp[targetExtensions[i]] = true;
    targetExtensions = tmp;


    var typeToExt = {
        'scene': [ 'fbx', 'dae', 'obj', '3ds' ],
        'text': [ 'txt', 'xml' ],
        'html': [ 'html' ],
        'css': [ 'css' ],
        'json': [ 'json' ],
        'texture': [ 'tif', 'tga', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'dds', 'hdr', 'exr' ],
        'audio': [ 'wav', 'mp3', 'mp4', 'ogg' ],
        'shader': [ 'glsl', 'frag', 'vert' ],
        'script': [ 'js' ],
        'font': [ 'ttf', 'otf' ]
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

    editor.method('assets:uploadFile', function (args, fn) {
        // NOTE
        // non-file form data should be above file,
        // to make it parsed on back-end first

        var form = new FormData();

        // scope
        form.append('project', config.project.id);

        // name
        if (args.name)
            form.append('name', args.name);

        // update asset
        if (args.asset)
            form.append('asset', args.asset.get('id'));

        // tags
        if (args.tags)
            form.append('tags', args.tags.join('\n'));

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

        // type
        if (args.type)
            form.append('type', args.type);

        // source_asset_id
        if (args.source_asset_id)
            form.append('source_asset_id', args.source_asset_id);

        // data
        if (args.data)
            form.append('data', JSON.stringify(args.data));

        // meta
        if (args.meta)
            form.append('meta', JSON.stringify(args.meta));

        // preload
        form.append('preload', args.preload === undefined ? true : args.preload);

        // filename
        if (args.filename)
            form.append('filename', args.filename);

        // file
        if (args.file && args.file.size)
            form.append('file', args.file, args.filename || args.name);

        var job = ++uploadJobs;
        editor.call('status:job', 'asset-upload:' + job, 0);

        var data = {
            url: '/api/assets',
            method: 'POST',
            query: {
                'access_token': '{{accessToken}}'
            },
            data: form,
            ignoreContentType: true,
            headers: {
                Accept: 'application/json'
            }
        };

        Ajax(data)
        .on('load', function(status, data) {
            if (args.pipeline) {
                var asset = editor.call('assets:get', data.asset.id);
                if (asset) {
                    editor.call('assets:jobs:add', asset);
                } else {
                    var evt = editor.once('assets:add[' + data.asset.id + ']', function(asset) {
                        editor.call('assets:jobs:add', asset);
                    });
                }
            }

            editor.call('status:job', 'asset-upload:' + job);
            if (fn)
                fn(null, data);
        })
        .on('progress', function(progress) {
            editor.call('status:job', 'asset-upload:' + job, progress);
        })
        .on('error', function(status, data) {
            if (/Disk allowance/.test(data))
                data += '. <a href="/upgrade" target="_blank">UPGRADE</a> to get more disk space.';

            editor.call('status:error', data);
            editor.call('status:job', 'asset-upload:' + job);
            if (fn)
                fn(data);
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

                // can we override another asset?
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

                    var asset = editor.call('assets:get', data.asset.id);
                    if (asset) {
                        onceAssetLoad(asset);
                    } else {
                        editor.once('assets:add[' + data.asset.id + ']', onceAssetLoad);
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
