editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || assets[0].get('type') !== 'animation')
            return;

        var asset = assets[0];

        var fieldDuration = editor.call('attributes:addField', {
            name: 'Duration',
            placeholder: 'Seconds'
        });
        if (asset._duration != undefined)
            fieldDuration.text = asset._duration;

        // // panel
        // var panelRaw = editor.call('attributes:addPanel', {
        //     name: 'Raw Data'
        // });

        // load data
        if (asset._duration == undefined) {
            // loading
            var fieldLoading = editor.call('attributes:addField', {
                type: 'progress'
            });
            fieldLoading.on('progress:100', function() {
                this.destroy();
            });

            Ajax
            .get('{{url.api}}/' + asset.file.url)
            .on('load', function(status, data) {
                if (data.animation && data.animation.duration !== undefined) {
                    asset._duration = data.animation.duration;
                    fieldDuration.renderChanges = false;
                    fieldDuration.text = data.animation.duration;
                    fieldDuration.renderChanges = true;
                }
                // fieldData.text = JSON.stringify(data, null, 4);
                fieldLoading.progress = 1;
            })
            .on('progress', function(progress) {
                fieldLoading.progress = .1 + progress * .8;
            })

            fieldLoading.progress = .1;
        }

        // // code
        // var fieldData = editor.call('attributes:addField', {
        //     parent: panelRaw,
        //     type: 'code'
        // });
    });
});
