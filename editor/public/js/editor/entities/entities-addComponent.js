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
                get: entities[i].history._getItemFn,
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
                    var item = records[i].get();
                    if (!item)
                        continue;
                    item.history.enabled = false;
                    item.unset('components.' + component);
                    item.history.enabled = true;
                }
            },
            redo: function () {
                for (var i = 0; i < records.length; i++) {
                    var item = records[i].get();
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
