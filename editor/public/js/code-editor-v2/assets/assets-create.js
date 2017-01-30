editor.once('load', function () {
    'use strict';

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

        var data = {
            url: '/api/assets',
            method: 'POST',
            auth: true,
            data: form,
            ignoreContentType: true,
            headers: {
                Accept: 'application/json'
            }
        };

        Ajax(data)
        .on('load', function(status, data) {
            if (fn)
                fn(null, data);
        })
        .on('error', function(status, data) {
            if (/Disk allowance/.test(data))
                data += '. <a href="/upgrade" target="_blank">UPGRADE</a> to get more disk space.';

            editor.call('status:error', data);
            if (fn)
                fn(data);
        });
    });


    var onAssetSelect = function (asset) {
        // do this in a timeout to give the asset a frame
        // to be added to the tree
        setTimeout(function () {
            editor.call('files:select', asset.get('id'));
        });
    };

    // create asset
    editor.method('assets:create', function (data, fn) {
        var evtAssetAdd;

        editor.call('status:log', 'Creating new asset...');

        // cancel select after add
        // if another asset is selected
        editor.once('select:asset', function() {
            if (evtAssetAdd) {
                evtAssetAdd.unbind();
                evtAssetAdd = null;
            }
        });

        editor.call('assets:uploadFile', data, function(err, res) {
            if (err) {
                editor.call('status:error', err);
                return fn && fn(err);
            }

            var asset = editor.call('assets:get', res.asset.id);
            if (asset) {
                onAssetSelect(asset);
            } else {
                evtAssetAdd = editor.once('assets:add[' + res.asset.id + ']', onAssetSelect);
            }

            if (fn) fn(err, res.asset.id);
        });
    });


});
