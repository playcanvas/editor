import type { Observer } from '@playcanvas/observer';

editor.once('load', () => {
    editor.method('assets:uploadFile', (args, fn) => {
        editor.api.globals.rest.assets.assetCreate(args)
        .on('load', (status, data) => {
            if (fn) {
                fn(null, data);
            }
        })
        .on('error', (status, data) => {
            if (/Disk allowance/.test(data)) {
                data += '. <a href="/upgrade" target="_blank">UPGRADE</a> to get more disk space.';
            }

            editor.call('status:error', data);
            if (fn) {
                fn(data || new Error(`Status ${status}`));
            }
        });
    });


    const onAssetSelect = function (asset: Observer) {
        // do this in a timeout to give the asset a frame
        // to be added to the tree
        setTimeout(() => {
            editor.call('tabs:temp:lock');
            editor.call('files:select', asset.get('id'));
            editor.call('tabs:temp:unlock');
        });
    };

    // create asset
    editor.method('assets:create', (data, fn) => {
        let evtAssetAdd;

        editor.call('status:log', 'Creating new asset...');

        // cancel select after add
        // if another asset is selected
        editor.once('select:asset', () => {
            if (evtAssetAdd) {
                evtAssetAdd.unbind();
                evtAssetAdd = null;
            }
        });

        editor.call('assets:uploadFile', data, (err, res) => {
            if (err) {
                editor.call('status:error', err);
                return fn && fn(err);
            }

            const asset = editor.call('assets:get', res.id);
            if (asset) {
                onAssetSelect(asset);
            } else {
                evtAssetAdd = editor.once(`assets:add[${res.id}]`, onAssetSelect);
            }

            if (fn) {
                fn(err, res.id);
            }
        });
    });
});
