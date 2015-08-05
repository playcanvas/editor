editor.once('load', function() {
    'use strict';

    var canvas = editor.call('viewport:canvas');

    var dropRef = editor.call('drop:target', {
        ref: canvas.element,
        type: 'asset.model',
        drop: function(type, data) {
            if (type !== 'asset.model')
                return;

            // asset
            var asset = editor.call('assets:get', parseInt(data.id, 10));
            if (! asset)
                return;

            // parent
            var parent = null;
            if (editor.call('selector:type') === 'entity')
                parent = editor.call('selector:items')[0];

            var component = editor.call('components:getDefault', 'model');
            component.type = 'asset';
            component.asset = parseInt(asset.get('id'), 10);

            // new entity
            editor.call('entities:new', {
                parent: parent,
                name: asset.get('name'),
                components: {
                    model: component
                }
            });

            setTimeout(function() {
                editor.call('viewport:focus');
            }, 0);
        }
    });
});
