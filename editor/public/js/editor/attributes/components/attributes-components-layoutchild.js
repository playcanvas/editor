editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[entity]', function(entities) {
        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (!panelComponents)
            return;

        var events = [];
        var componentName = 'layoutchild';

        var panel = editor.call('attributes:entity:addComponentPanel', {
            title: 'Layout Child',
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

        var fieldMinWidth = addField('minWidth', {
            name: 'Min Size',
            type: 'number',
            placeholder: 'Min Width'
        });

        fieldMinWidth.style.width = '32px';

        var fieldMinHeight = addField('minHeight', {
            panel: fieldMinWidth.parent,
            type: 'number',
            placeholder: 'Min Height'
        });

        fieldMinHeight.style.width = '32px';

        var fieldMaxWidth = addField('maxWidth', {
            name: 'Max Size',
            type: 'number',
            placeholder: 'Max Width',
            allowNull: true
        });

        fieldMaxWidth.style.width = '32px';

        var fieldMaxHeight = addField('maxHeight', {
            panel: fieldMaxWidth.parent,
            type: 'number',
            placeholder: 'Max Height',
            allowNull: true
        });

        fieldMaxHeight.style.width = '32px';

        var fieldFitWidthProportion = addField('fitWidthProportion', {
            name: 'Fit Proportion',
            type: 'number',
            placeholder: 'Width'
        });

        fieldFitWidthProportion.style.width = '32px';

        var fieldFitHeightProportion = addField('fitHeightProportion', {
            panel: fieldFitWidthProportion.parent,
            type: 'number',
            placeholder: 'Height'
        });

        fieldFitHeightProportion.style.width = '32px';

        addField('excludeFromLayout', {
            name: 'Exclude from Layout',
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
