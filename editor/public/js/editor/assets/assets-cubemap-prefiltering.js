editor.once('load', function () {

    var device = editor.call('preview:device');
    var assets = editor.call('preview:assetRegistry');

    editor.method('assets:cubemaps:prefilter', function (cubemapAsset, fn) {
        var realtimeAsset = assets.getAssetById(cubemapAsset.get('id'));
        if (!realtimeAsset) return;

        // load cubemap asset
        var cubemap;

        if (!realtimeAsset.resource) {
            assets.load(realtimeAsset).then(function (resources) {
                cubemap = resources[0][0];
                onLoad();
            });
        } else {
            cubemap = realtimeAsset.resource;
            onLoad();
        }

        function onLoad() {
            // prefilter cubemap
            var options = {
                device: device,
                sourceCubemap: cubemap,
                method: 1,
                samples: 4096,
                cpuSync: true,
                filteredFixed: [],
                singleFilteredFixed: true
            };

            pc.prefilterCubemap(options);

            // get dds and create blob
            var dds = options.singleFilteredFixed.getDds();
            var blob = new Blob([dds], {type: 'image/dds'});

            // upload blob as dds
            editor.call('assets:uploadFile', blob, cubemapAsset.get('name') + '.dds', cubemapAsset, function (err, data) {
                if (fn)
                    fn();
            });
        }

    });

});
