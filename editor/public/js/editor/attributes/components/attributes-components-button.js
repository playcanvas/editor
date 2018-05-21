editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[entity]', function(entities) {
        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (!panelComponents)
            return;

        var events = [];
        var componentName = 'button';

        var panel = editor.call('attributes:entity:addComponentPanel', {
            title: 'Button',
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

        addField('active', {
            name: 'Active',
            type: 'checkbox'
        });

        addField('imageEntity', {
            name: 'Image',
            type: 'entity'
        });

        addField('hitPadding', {
            name: 'Hit Padding',
            type: 'vec4',
            placeholder: ['←', '↓', '→', '↑']
        });

        var fieldTransitionMode = addField('transitionMode', {
            name: 'Transition Mode',
            type: 'number',
            enum: [
                {v: '', t: '...'},
                {v: BUTTON_TRANSITION_MODE_TINT, t: 'Tint'},
                {v: BUTTON_TRANSITION_MODE_SPRITE_CHANGE, t: 'Sprite Change'}
            ]
        });

        var fieldHoverTint = addField('hoverTint', {
            name: 'Hover Tint',
            type: 'rgb',
            channels: 4
        });

        var fieldPressedTint = addField('pressedTint', {
            name: 'Pressed Tint',
            type: 'rgb',
            channels: 4
        });

        var fieldInactiveTint = addField('inactiveTint', {
            name: 'Inactive Tint',
            type: 'rgb',
            channels: 4
        });

        var fieldFadeDuration = addField('fadeDuration', {
            name: 'Fade Duration',
            type: 'number',
            precision: 0,
            step: 1,
            placeholder: 'ms'
        });

        fieldFadeDuration.style.flexGrow = 0;
        fieldFadeDuration.style.width = '70px';

        var fieldHoverSpriteAsset = addField('hoverSpriteAsset', {
            name: 'Hover Sprite',
            type: 'asset',
            kind: 'sprite'
        });

        var fieldHoverSpriteFrame = addField('hoverSpriteFrame', {
            name: 'Hover Frame',
            type: 'number',
            min: 0,
            precision: 0,
            step: 1
        });

        var fieldPressedSpriteAsset = addField('pressedSpriteAsset', {
            name: 'Pressed Sprite',
            type: 'asset',
            kind: 'sprite'
        });

        var fieldPressedSpriteFrame = addField('pressedSpriteFrame', {
            name: 'Pressed Frame',
            type: 'number',
            min: 0,
            precision: 0,
            step: 1
        });

        var fieldInactiveSpriteAsset = addField('inactiveSpriteAsset', {
            name: 'Inactive Sprite',
            type: 'asset',
            kind: 'sprite'
        });

        var fieldInactiveSpriteFrame = addField('inactiveSpriteFrame', {
            name: 'Inactive Frame',
            type: 'number',
            min: 0,
            precision: 0,
            step: 1
        });

        var toggleFields = function () {
            var isTintMode = (fieldTransitionMode.value === BUTTON_TRANSITION_MODE_TINT);
            var isSpriteChangeMode = (fieldTransitionMode.value === BUTTON_TRANSITION_MODE_SPRITE_CHANGE);

            fieldHoverTint.parent.hidden = !isTintMode;
            fieldPressedTint.parent.hidden = !isTintMode;
            fieldInactiveTint.parent.hidden = !isTintMode;
            fieldFadeDuration.parent.hidden = !isTintMode;

            fieldHoverSpriteAsset.parent.hidden = !isSpriteChangeMode;
            fieldHoverSpriteFrame.parent.hidden = !isSpriteChangeMode;
            fieldPressedSpriteAsset.parent.hidden = !isSpriteChangeMode;
            fieldPressedSpriteFrame.parent.hidden = !isSpriteChangeMode;
            fieldInactiveSpriteAsset.parent.hidden = !isSpriteChangeMode;
            fieldInactiveSpriteFrame.parent.hidden = !isSpriteChangeMode;
        };

        toggleFields();

        events.push(fieldTransitionMode.on('change', toggleFields));

        panel.on('destroy', function () {
            events.forEach(function (e) {
                e.unbind();
            });
            events.length = 0;
        });
    });
});
