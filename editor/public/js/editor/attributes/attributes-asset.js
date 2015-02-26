(function() {
    'use strict';

    var bytesToHuman = function(bytes) {
        if (isNaN(bytes) || bytes === 0) return '0 B';
        var k = 1000;
        var sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
    };


    editor.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1)
            return;

        // unfold panel
        var panel = editor.call('attributes.rootPanel');
        if (panel.folded)
            panel.folded = false;

        var asset = assets[0];

        editor.call('attributes:header', 'asset, ' + asset.get('type'));


        // panel
        var panel = editor.call('attributes:addPanel');
        panel.class.add('component');


        // id
        editor.call('attributes:addField', {
            parent: panel,
            name: 'ID',
            link: asset,
            path: 'id'
        });

        if (asset.get('file.filename')) {
            // filename
            editor.call('attributes:addField', {
                parent: panel,
                name: 'Filename',
                type: 'string',
                link: asset,
                path: 'file.filename'
            });
        } else {
            // name
            editor.call('attributes:addField', {
                parent: panel,
                name: 'Name',
                type: 'string',
                link: asset,
                path: 'name'
            });
        }

        // type
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Type',
            link: asset,
            path: 'type'
        });

        // size
        if (asset.has('file')) {
            var fieldSize = editor.call('attributes:addField', {
                parent: panel,
                name: 'Size',
                value: bytesToHuman(asset.get('file.size'))
            });
            asset.on('file.size:set', function(value) {
                fieldSize.text = bytesToHuman(value);
            });
        }

        // // TEMP
        // // load raw
        // var button = editor.call('attributes:addField', {
        //     parent: panel,
        //     type: 'button',
        //     text: 'Load raw'
        // });

        // button.style.position = 'fixed';
        // button.style.right = '0';
        // button.style.bottom = '24px';
        // button.style.zIndex = 1;

        // button.on('click', function() {
        //     this.destroy();

        //     // loading
        //     var fieldLoading = editor.call('attributes:addField', {
        //         parent: panel,
        //         type: 'progress'
        //     });
        //     fieldLoading.on('progress:100', function() {
        //         this.destroy();
        //     });

        //     // code
        //     var fieldData = editor.call('attributes:addField', {
        //         parent: panel,
        //         type: 'code'
        //     });

        //     Ajax({
        //         url: '{{url.api}}/assets/' + asset.get('id'),
        //         query: {
        //             access_token: '{{accessToken}}'
        //         }
        //     })
        //     .on('load', function(status, data) {
        //         fieldData.text = JSON.stringify(data.response[0], null, 4);
        //         fieldLoading.progress = 1;
        //     })
        //     .on('progress', function(progress) {
        //         fieldLoading.progress = .1 + progress * .8;
        //     });

        //     fieldLoading.progress = .1;
        // });
    });

})();
