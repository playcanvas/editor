editor.once('load', function() {
    'use strict';

    if (editor.call('users:hasFlag', 'hasPcuiComponentInspectors')) return;

    editor.on('attributes:inspect[entity]', function(entities) {
        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (!panelComponents)
            return;

        var events = [];
        var componentName = 'scrollbar';

        var panel = editor.call('attributes:entity:addComponentPanel', {
            title: 'Scrollbar',
            name: componentName,
            entities: entities
        });

        function addField(propertyName, options) {
            var path = 'components.' + componentName + '.' + propertyName;
            var target = componentName + ':' + propertyName;

            if (!options.panel) {
                options.parent = panel;
            }
            options.parent = panel;
            options.path = path;
            options.link = entities;

            var field = editor.call('attributes:addField', options);
            var fieldParent = Array.isArray(field) ? field[0].parent : field.parent;

            editor.call('attributes:reference:attach', target, fieldParent.innerElement.firstChild.ui);

            return field;
        }

        addField('orientation', {
            name: 'Orientation',
            type: 'number',
            enum: [
                {v: '', t: '...'},
                {v: ORIENTATION_HORIZONTAL, t: 'Horizontal'},
                {v: ORIENTATION_VERTICAL, t: 'Vertical'}
            ],
            canOverrideTemplate: true
        });

        addField('value', {
            name: 'Value',
            type: 'number',
            precision: 3,
            step: 0.01,
            min: 0,
            max: 1,
            canOverrideTemplate: true
        });

        addField('handleEntity', {
            name: 'Handle',
            type: 'entity',
            canOverrideTemplate: true
        });

        addField('handleSize', {
            name: 'Handle Size',
            type: 'number',
            precision: 3,
            step: 0.01,
            min: 0,
            max: 1,
            canOverrideTemplate: true
        });

        panel.on('destroy', function () {
            events.forEach(function (e) {
                e.unbind();
            });
            events.length = 0;
        });
    });
});
