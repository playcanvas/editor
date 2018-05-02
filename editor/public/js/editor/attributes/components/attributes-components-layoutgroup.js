editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[entity]', function(entities) {
        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (!panelComponents)
            return;

        var events = [];
        var componentName = 'layoutgroup';

        var panel = editor.call('attributes:entity:addComponentPanel', {
            title: 'Layout Group',
            name: componentName,
            entities: entities
        });

        function addField(propertyName, options) {
            var path = 'components.' + componentName + '.' + propertyName;
            var target = componentName + ':' + propertyName;

            if (!options.panel) {
                options.parent = panel;
            }
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
            ]
        });

        addField('reverseX', {
            name: 'Reverse X',
            type: 'checkbox'
        });

        addField('reverseY', {
            name: 'Reverse Y',
            type: 'checkbox'
        });

        addField('alignment', {
            name: 'Alignment',
            type: 'vec2',
            placeholder: ['↔', '↕'],
            precision: 2,
            step: 0.1,
            min: 0,
            max: 1
        });

        addField('padding', {
            name: 'Padding',
            type: 'vec4',
            placeholder: ['←', '↓', '→', '↑']
        });

        addField('spacing', {
            name: 'Spacing',
            type: 'vec2',
            placeholder: ['↔', '↕'],
        });

        addField('widthFitting', {
            name: 'Width Fitting',
            type: 'number',
            enum: [
                {v: '', t: '...'},
                {v: FITTING_NONE, t: 'None'},
                {v: FITTING_STRETCH, t: 'Stretch'},
                {v: FITTING_SHRINK, t: 'Shrink'},
                {v: FITTING_BOTH, t: 'Both'}
            ]
        });

        addField('heightFitting', {
            name: 'Height Fitting',
            type: 'number',
            enum: [
                {v: '', t: '...'},
                {v: FITTING_NONE, t: 'None'},
                {v: FITTING_STRETCH, t: 'Stretch'},
                {v: FITTING_SHRINK, t: 'Shrink'},
                {v: FITTING_BOTH, t: 'Both'}
            ]
        });

        addField('wrap', {
            name: 'Wrap',
            type: 'checkbox'
        });

        panel.on('destroy', function () {
            events.forEach(function (e) {
                e.unbind();
            });
            events.length = 0;
        });
    });
});
