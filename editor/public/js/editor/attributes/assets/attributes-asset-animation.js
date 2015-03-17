editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || assets[0].get('type') !== 'animation')
            return;

        var asset = assets[0];

        // panel
        var panel = editor.call('attributes:addPanel', {
            name: 'Properties'
        });
        panel.class.add('component');

        // duration
        var fieldDuration = editor.call('attributes:addField', {
            parent: panel,
            name: 'Duration',
            placeholder: 'Seconds'
        });
        if (asset._duration != undefined)
            fieldDuration.text = asset._duration;

        // load data
        if (asset._duration == undefined) {
            // loading
            var fieldLoading = editor.call('attributes:addField', {
                parent: panel,
                type: 'progress'
            });
            fieldLoading.on('progress:100', function() {
                this.destroy();
            });

            Ajax
            .get('{{url.home}}/' + asset.get('file.url'))
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
    });
});
