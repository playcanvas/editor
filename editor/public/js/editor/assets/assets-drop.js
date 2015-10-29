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

            for(var i = 0; i < data.length; i++) {

                var currentFolder = editor.call('assets:panel:currentFolder');
                var path = [ ];

                if (currentFolder)
                    path = currentFolder.get('path').concat(parseInt(currentFolder.get('id'), 10));

                var source = false;
                var ext = data[i].name.split('.');
                if (ext.length === 1)
                    continue;
                ext = ext[ext.length - 1];

                var source = ! targetExtensions[ext];
                var type = extToType[ext];

                // can we override another asset?
                var asset = editor.call('assets:findOne', function(item) {
                    return item.get('name') === data[i].name && item.get('path').match(path) && item.get('source') === source && item.get('type') === type;
                });

                editor.call('assets:uploadFile', {
                    asset: asset ? asset[1] : null,
                    file: data[i],
                    name: data[i].name,
                    parent: editor.call('assets:panel:currentFolder')
                });
            }
        }
    });

    dropRef.element.classList.add('assets-drop-area');
});
