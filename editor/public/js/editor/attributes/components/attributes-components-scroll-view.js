editor.once('load', function() {
    'use strict';

    if (editor.call('users:hasFlag', 'hasPcuiComponentInspectors')) return;

    editor.on('attributes:inspect[entity]', function(entities) {
        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (!panelComponents)
            return;

        var events = [];
        var componentName = 'scrollview';

        var panel = editor.call('attributes:entity:addComponentPanel', {
            title: 'Scroll View',
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

        var fieldScrollMode = addField('scrollMode', {
            name: 'Scroll Mode',
            type: 'number',
            enum: [
                {v: '', t: '...'},
                {v: SCROLL_MODE_CLAMP, t: 'Clamp'},
                {v: SCROLL_MODE_BOUNCE, t: 'Bounce'},
                {v: SCROLL_MODE_INFINITE, t: 'Infinite'}
            ],
            canOverrideTemplate: true
        });

        var fieldBounceAmount = addField('bounceAmount', {
            name: 'Bounce',
            type: 'number',
            precision: 3,
            step: 0.01,
            min: 0,
            max: 10,
            canOverrideTemplate: true
        });

        addField('friction', {
            name: 'Friction',
            type: 'number',
            precision: 3,
            step: 0.01,
            min: 0,
            max: 1,
            canOverrideTemplate: true
        });

        addField('viewportEntity', {
            name: 'Viewport',
            type: 'entity',
            canOverrideTemplate: true
        });

        addField('contentEntity', {
            name: 'Content',
            type: 'entity',
            canOverrideTemplate: true
        });

        var dividerHorizontal = document.createElement('div');
        dividerHorizontal.classList.add('fields-divider');
        panel.append(dividerHorizontal);

        var fieldHorizontal = addField('horizontal', {
            name: 'Horizontal',
            type: 'checkbox',
            canOverrideTemplate: true
        });

        var fieldHorizontalScrollbarEntity = addField('horizontalScrollbarEntity', {
            name: 'Scrollbar',
            type: 'entity',
            canOverrideTemplate: true
        });

        var fieldHorizontalScrollbarVisibility = addField('horizontalScrollbarVisibility', {
            name: 'Visibility',
            type: 'number',
            enum: [
                {v: '', t: '...'},
                {v: SCROLLBAR_VISIBILITY_SHOW_ALWAYS, t: 'Show Always'},
                {v: SCROLLBAR_VISIBILITY_SHOW_WHEN_REQUIRED, t: 'Show When Required'}
            ],
            canOverrideTemplate: true
        });

        var dividerVertical = document.createElement('div');
        dividerVertical.classList.add('fields-divider');
        panel.append(dividerVertical);

        var fieldVertical = addField('vertical', {
            name: 'Vertical',
            type: 'checkbox',
            canOverrideTemplate: true
        });

        var fieldVerticalScrollbarEntity = addField('verticalScrollbarEntity', {
            name: 'Scrollbar',
            type: 'entity',
            canOverrideTemplate: true
        });

        var fieldVerticalScrollbarVisibility = addField('verticalScrollbarVisibility', {
            name: 'Visibility',
            type: 'number',
            enum: [
                {v: '', t: '...'},
                {v: SCROLLBAR_VISIBILITY_SHOW_ALWAYS, t: 'Show Always'},
                {v: SCROLLBAR_VISIBILITY_SHOW_WHEN_REQUIRED, t: 'Show When Required'}
            ],
            canOverrideTemplate: true
        });

        var toggleFields = function () {
            var isBounceMode = (fieldScrollMode.value === SCROLL_MODE_BOUNCE);
            var verticalScrollingEnabled = (fieldVertical.value === true);
            var horizontalScrollingEnabled = (fieldHorizontal.value === true);

            fieldBounceAmount.parent.hidden = !isBounceMode;

            fieldVerticalScrollbarEntity.parent.hidden = !verticalScrollingEnabled;
            fieldVerticalScrollbarVisibility.parent.hidden = !verticalScrollingEnabled;

            fieldHorizontalScrollbarEntity.parent.hidden = !horizontalScrollingEnabled;
            fieldHorizontalScrollbarVisibility.parent.hidden = !horizontalScrollingEnabled;
        };

        toggleFields();

        events.push(fieldScrollMode.on('change', toggleFields));
        events.push(fieldVertical.on('change', toggleFields));
        events.push(fieldHorizontal.on('change', toggleFields));

        panel.on('destroy', function () {
            events.forEach(function (e) {
                e.unbind();
            });
            events.length = 0;
        });
    });
});
