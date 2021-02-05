editor.once('load', function () {
    'use strict';

    /**
     * Adds the specified component to the specified entities.
     *
     * @param {Observer[]} entities - The entities
     * @param {string} component - The name of the component
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
