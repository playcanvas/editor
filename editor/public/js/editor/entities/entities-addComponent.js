editor.once('load', function () {
    'use strict';

    var settings = editor.call('settings:project');

    /**
     * Adds the specified component to the specified entities.
     * @param {Observer[]} entities The entities
     * @param {String} component The name of the component
     */
    editor.method('entities:addComponent', function (entities, component) {
        var componentData = editor.call('components:getDefault', component);
        var records = [];

        for (var i = 0; i < entities.length; i++) {
            if (entities[i].has('components.' + component))
                continue;

            records.push({
                item: entities[i],
                value: componentData
            });

            entities[i].history.enabled = false;
            entities[i].set('components.' + component, componentData);
            entities[i].history.enabled = true;
        }

        // if it's a collision or rigidbody component then enable physics
        if (component === 'collision' || component === 'rigidbody') {
            var history = settings.history.enabled;
            settings.history.enabled = false;
            settings.set('use3dPhysics', true);
            settings.history.enabled = history;
        }

        editor.call('history:add', {
            name: 'entities.' + component,
            undo: function () {
                for (var i = 0; i < records.length; i++) {
                    var item = records[i].item.latest();
                    if (!item)
                        continue;
                    item.history.enabled = false;
                    item.unset('components.' + component);
                    item.history.enabled = true;
                }
            },
            redo: function () {
                for (var i = 0; i < records.length; i++) {
                    var item = records[i].item.latest();
                    if (!item)
                        continue;
                    item.history.enabled = false;
                    item.set('components.' + component, records[i].value);
                    item.history.enabled = true;
                }
            }
        });
    });
});
