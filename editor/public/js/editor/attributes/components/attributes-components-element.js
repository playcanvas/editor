editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[entity]', function(entities) {
        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;

        var events = [ ];

        var panel = editor.call('attributes:entity:addComponentPanel', {
            title: 'Element',
            name: 'element',
            entities: entities
        });

        var fieldType = editor.call('attributes:addField', {
            parent: panel,
            name: 'Type',
            type: 'string',
            enum: [
                {v: '', t: '...'},
                {v: 'text', t: 'Text'},
                {v: 'image', t: 'Image'},
                {v: 'group', t: 'Group'}
            ],
            link: entities,
            path: 'components.element.type'
        });

        // reference
        editor.call('attributes:reference:attach', 'element:type', fieldType.parent.innerElement.firstChild.ui);

        var fieldAnchor = editor.call('attributes:addField', {
            parent: panel,
            name: 'Anchor',
            type: 'vec4',
            link: entities,
            path: 'components.element.anchor'
        });

        // reference
        editor.call('attributes:reference:attach', 'element:anchor', fieldAnchor[0].parent.innerElement.firstChild.ui);

        var fieldPivot = editor.call('attributes:addField', {
            parent: panel,
            name: 'Pivot',
            type: 'vec2',
            link: entities,
            path: 'components.element.pivot'
        });

        // reference
        editor.call('attributes:reference:attach', 'element:pivot', fieldPivot[0].parent.innerElement.firstChild.ui);

        var fieldText = editor.call('attributes:addField', {
            parent: panel,
            name: 'Text',
            type: 'string',
            link: entities,
            path: 'components.element.text'
        });

        fieldText.parent.hidden = fieldType.value !== 'text';

        // reference
        editor.call('attributes:reference:attach', 'element:text', fieldText.parent.innerElement.firstChild.ui);

        var fieldFontAsset = editor.call('attributes:addField', {
            parent: panel,
            name: 'Font',
            type: 'asset',
            kind: 'font',
            link: entities,
            path: 'components.element.fontAsset'
        });

        fieldFontAsset.parent.hidden = fieldType.value !== 'text';

        // reference
        editor.call('attributes:reference:attach', 'element:fontAsset', fieldFontAsset.parent.innerElement.firstChild.ui);

        var fieldFontSize = editor.call('attributes:addField', {
            parent: panel,
            name: 'Font Size',
            type: 'number',
            link: entities,
            path: 'components.element.fontSize'
        });

        fieldFontSize.parent.hidden = fieldType.value !== 'text';

        // reference
        editor.call('attributes:reference:attach', 'element:fontSize', fieldFontSize.parent.innerElement.firstChild.ui);

        var fieldLineHeight = editor.call('attributes:addField', {
            parent: panel,
            name: 'Line Height',
            type: 'number',
            link: entities,
            path: 'components.element.lineHeight'
        });

        fieldLineHeight.parent.hidden = fieldType.value !== 'text';

        // reference
        editor.call('attributes:reference:attach', 'element:lineHeight', fieldLineHeight.parent.innerElement.firstChild.ui);

        var fieldSpacing = editor.call('attributes:addField', {
            parent: panel,
            name: 'Spacing',
            type: 'number',
            link: entities,
            path: 'components.element.spacing'
        });

        fieldSpacing.parent.hidden = fieldType.value !== 'text';

        // reference
        editor.call('attributes:reference:attach', 'element:spacing', fieldSpacing.parent.innerElement.firstChild.ui);

        var fieldTextureAsset = editor.call('attributes:addField', {
            parent: panel,
            name: 'Texture',
            type: 'asset',
            kind: 'texture',
            link: entities,
            path: 'components.element.textureAsset'
        });

        // reference
        editor.call('attributes:reference:attach', 'element:textureAsset', fieldTextureAsset.parent.innerElement.firstChild.ui);

        var fieldWidth = editor.call('attributes:addField', {
            parent: panel,
            name: 'Size',
            type: 'number',
            placeholder: 'Width',
            min: 0,
            link: entities,
            path: 'components.element.width'
        });

        fieldWidth.style.width = '32px';
        fieldWidth.parent.hidden = fieldType.value !== 'image' || !fieldTextureAsset.value;

        // reference
        editor.call('attributes:reference:attach', 'element:size', fieldWidth.parent.innerElement.firstChild.ui);

        var fieldHeight = editor.call('attributes:addField', {
            panel: fieldWidth.parent,
            type: 'number',
            placeholder: 'Height',
            min: 0,
            link: entities,
            path: 'components.element.height'
        });

        fieldHeight.style.width = '32px';

        var fieldRect = editor.call('attributes:addField', {
            parent: panel,
            name: 'Rect',
            type: 'vec4',
            placeholder: ['u', 'v', 'w', 'h'],
            link: entities,
            path: 'components.element.rect'
        });

        fieldRect[0].parent.hidden = fieldType.value !== 'image' || !fieldTextureAsset.value;

        // reference
        editor.call('attributes:reference:attach', 'element:rect', fieldRect[0].parent.innerElement.firstChild.ui);

        var fieldColor = editor.call('attributes:addField', {
            parent: panel,
            name: 'Color',
            type: 'rgb',
            channels: 4,
            link: entities,
            path: 'components.element.color'
        });

        fieldColor.parent.hidden = fieldType.value !== 'text';

        // reference
        editor.call('attributes:reference:attach', 'element:color', fieldColor.parent.innerElement.firstChild.ui);

        var fieldMaterialAsset = editor.call('attributes:addField', {
            parent: panel,
            name: 'Material',
            type: 'asset',
            kind: 'material',
            link: entities,
            path: 'components.element.materialAsset'
        });

        fieldMaterialAsset.parent.hidden = fieldType.value !== 'image' || fieldTextureAsset.value;
        fieldTextureAsset.parent.hidden = fieldType.value !== 'image' || fieldMaterialAsset.value;

        // reference
        editor.call('attributes:reference:attach', 'element:materialAsset', fieldMaterialAsset.parent.innerElement.firstChild.ui);

        events.push(fieldType.on('change', function (value) {
            fieldText.parent.hidden = value !== 'text';
            fieldFontAsset.parent.hidden = value !== 'text';
            fieldFontSize.parent.hidden = value !== 'text';
            fieldLineHeight.parent.hidden = value !== 'text';
            fieldSpacing.parent.hidden = value !== 'text';
            fieldTextureAsset.parent.hidden = value !== 'image' || fieldMaterialAsset.value;
            fieldMaterialAsset.parent.hidden = value !== 'image' || fieldTextureAsset.value;
            fieldRect[0].parent.hidden = value !== 'image' || !fieldTextureAsset.value;
            fieldWidth.parent.hidden = value !== 'image' || !fieldTextureAsset.value;
            fieldColor.parent.hidden = value !== 'text';
        }));


        events.push(fieldTextureAsset.on('change', function (value) {
            fieldRect[0].parent.hidden = fieldType.value !== 'image' || !value;
            fieldWidth.parent.hidden = fieldType.value !== 'image' || !value;
            fieldMaterialAsset.parent.hidden = fieldType.value !== 'image' || value;
        }));

        events.push(fieldMaterialAsset.on('change', function (value) {
            fieldTextureAsset.parent.hidden = fieldType.value !== 'image' || value;
        }));

        panel.on('destroy', function () {
            events.forEach(function (e) {
                e.unbind();
            });
            events.length = 0;
        });

    });
});
