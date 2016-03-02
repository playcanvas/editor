editor.once('load', function() {
    'use strict';

    var uploadJobs = 0;

    var targetExtensions = [ 'jpg', 'jpeg', 'png', 'css', 'html', 'json', 'xml', 'txt', 'vert', 'frag', 'glsl', 'mp3', 'ogg', 'wav', 'mp4' ];
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
        'shader': [ 'glsl', 'frag', 'vert' ]
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

        // name
        if (args.name)
            form.append('name', args.name);

        // update asset
        if (args.asset)
            form.append('asset', args.asset.get('id'));

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

        // preload
        form.append('preload', true);

        // filename
        if (args.filename)
            form.append('filename', args.filename);

        // file
        if (args.file && args.file.size)
            form.append('file', args.file, args.filename || args.name);

        var job = ++uploadJobs;
        editor.call('status:job', 'asset-upload:' + job, 0);

        var data = {
            url: '/editor/project/{{project.id}}/upload/asset',
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

            if (ext === 'js') {
                editor.call('assets:upload:script', files[i]);
            } else {
                var source = ! targetExtensions[ext];
                var type = extToType[ext];

                // can we override another asset?
                var sourceAsset = null;
                var asset = editor.call('assets:findOne', function(item) {
                    // check files in current folder only
                    if (! item.get('path').equals(path))
                        return;

                    // try locate source when dropping on its targets
                    /*
                    if (searchRelatedAssets && source && ! item.get('source') && item.get('source_asset_id')) {
                        var itemSource = editor.call('assets:get', item.get('source_asset_id'));
                        if (itemSource && itemSource.get('type') === type && itemSource.get('name').toLowerCase() === files[i].name.toLowerCase()) {
                            sourceAsset = itemSource;
                            return;
                        }
                    }
                    */

                    return item.get('source') === source && item.get('type') === type && item.get('name').toLowerCase() === files[i].name.toLowerCase();
                });

                editor.call('assets:uploadFile', {
                    asset: asset ? asset[1] : sourceAsset,
                    file: files[i],
                    name: files[i].name,
                    parent: editor.call('assets:panel:currentFolder'),
                    pipeline: true
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
