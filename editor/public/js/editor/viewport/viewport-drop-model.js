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
            var asset = editor.call('assets:get', data.id);
            if (! asset)
                return;

            // parent
            var parent = null;
            if (editor.call('selector:type') === 'entity')
                parent = editor.call('selector:items')[0];

            // new entity
            var entity = editor.call('entities:new', parent);

            entity.history.enabled = false;

            // name
            entity.set('name', asset.get('name'));

            // model asset
            entity.set('components.model', editor.call('components:getDefault', 'model'));
            entity.set('components.model.type', 'asset');
            entity.set('components.model.asset', asset.get('id'));

            entity.history.enabled = true;
        }
    });
});
