(function() {
    'use strict';

    var bytesToHuman = function(bytes) {
        if (isNaN(bytes) || bytes === 0) return '0 B';
        var k = 1000;
        var sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
    };

    msg.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1)
            return;

        var asset = assets[0];

        msg.call('attributes:header', 'asset, ' + asset.type);

        // id
        msg.call('attributes:addField', {
            name: 'ID',
            link: asset,
            path: 'id'
        });

        if (asset.get('file.filename')) {
            // filename
            msg.call('attributes:addField', {
                name: 'Filename',
                type: 'string',
                link: asset,
                path: 'file.filename'
            });
        } else {
            // name
            msg.call('attributes:addField', {
                name: 'Name',
                type: 'string',
                link: asset,
                path: 'name'
            });
        }

        // type
        msg.call('attributes:addField', {
            name: 'Type',
            link: asset,
            path: 'type'
        });

        // size
        if (asset.file) {
            var fieldSize = msg.call('attributes:addField', {
                name: 'Size',
                value: bytesToHuman(asset.file.size)
            });
            asset.on('file.size:set', function(value) {
                fieldSize.text = bytesToHuman(value);
            });
        }

        // TEMP
        // load raw
        var button = msg.call('attributes:addField', {
            type: 'button',
            text: 'Load raw'
        });

        button.style.position = 'fixed';
        button.style.right = '0';
        button.style.bottom = '24px';
        button.style.zIndex = 1;

        button.on('click', function() {
            this.destroy();

            // loading
            var fieldLoading = msg.call('attributes:addField', {
                type: 'progress'
            });
            fieldLoading.on('progress:100', function() {
                this.destroy();
            });

            // code
            var fieldData = msg.call('attributes:addField', {
                type: 'code'
            });

            Ajax({
                url: '{{url.api}}/assets/' + asset.id,
                query: {
                    access_token: '{{accessToken}}'
                }
            })
            .on('load', function(status, data) {
                fieldData.text = JSON.stringify(data.response[0], null, 4);
                fieldLoading.progress = 1;
            })
            .on('progress', function(progress) {
                fieldLoading.progress = .1 + progress * .8;
            });

            fieldLoading.progress = .1;
        });
    });

})();
