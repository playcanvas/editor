editor.once('load', function() {
    'use strict';

    var uploadJobs = 0;

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
                form.append('parent', args.parent + '');
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
            url: '/editor/project/{{project.id}}/asset-upload',
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

            editor.call('status:text', data);
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
            if (! editor.call('assets:canUploadFiles', this.files)) {
                var msg = 'Disk allowance exceeded. <a href="/upgrade" target="_blank">UPGRADE</a> to get more disk space.';
                editor.call('status:error', msg);
                return;
            }

            for(var i = 0; i < this.files.length; i++) {

                if (/\.js$/i.test(this.files[i].name)) {
                    editor.call('assets:upload:script', this.files[i]);
                } else {
                    editor.call('assets:uploadFile', {
                        file: this.files[i],
                        name: this.files[i].name,
                        parent: parent
                    });
                }
            }
            this.value = null;
            fileInput.removeEventListener('change', onChange);
        };

        fileInput.addEventListener('change', onChange, false);
        fileInput.click();

        fileInput.parentNode.removeChild(fileInput);
    });
});
