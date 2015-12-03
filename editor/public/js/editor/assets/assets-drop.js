editor.once('load', function() {
    'use strict';

    var assetsPanel = editor.call('layout.assets');

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

    var dropRef = editor.call('drop:target', {
        ref: assetsPanel.element,
        type: 'files',
        drop: function(type, data) {
            if (type !== 'files')
                return;

            if (! editor.call('assets:canUploadFiles', data)) {
                var msg = 'Disk allowance exceeded. <a href="/upgrade" target="_blank">UPGRADE</a> to get more disk space.';
                editor.call('status:error', msg);
                return;
            }

            // var searchRelatedAssets = editor.call('assets:pipeline:settings', 'searchRelatedAssets');

            var readScriptFile = function(file) {
                var reader = new FileReader();

                reader.addEventListener('load', function() {
                    editor.call('sourcefiles:create', file.name, reader.result, function(err) {
                        if (err)
                            return;

                        editor.call('assets:panel:currentFolder', 'scripts');
                    });
                }, false);

                reader.readAsText(file);
            };

            for(var i = 0; i < data.length; i++) {
                var currentFolder = editor.call('assets:panel:currentFolder');
                var path = [ ];

                if (currentFolder && currentFolder.get)
                    path = currentFolder.get('path').concat(parseInt(currentFolder.get('id'), 10));

                var source = false;
                var ext = data[i].name.split('.');
                if (ext.length === 1)
                    continue;
                ext = ext[ext.length - 1].toLowerCase();

                if (ext === 'js') {
                    readScriptFile(data[i]);
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
                            if (itemSource && itemSource.get('type') === type && itemSource.get('name').toLowerCase() === data[i].name.toLowerCase()) {
                                sourceAsset = itemSource;
                                return;
                            }
                        }
                        */

                        return item.get('source') === source && item.get('type') === type && item.get('name').toLowerCase() === data[i].name.toLowerCase();
                    });

                    editor.call('assets:uploadFile', {
                        asset: asset ? asset[1] : sourceAsset,
                        file: data[i],
                        name: data[i].name,
                        parent: editor.call('assets:panel:currentFolder'),
                        pipeline: true
                    });
                }
            }
        }
    });

    dropRef.element.classList.add('assets-drop-area');
});
