editor.once('load', function () {
    'use strict';

    var settings = editor.call('editor:settings');

    var root = editor.call('layout.root');
    var panel = editor.call('layout.attributes');
    var hidden = true;
    var width = panel.resizeMin + 'px';

    // close button
    var btnClose = new ui.Button({
        text: '&#57650;'
    });
    btnClose.class.add('icon', 'close');
    btnClose.hidden = true;
    btnClose.on('click', function () {
        hidden = true;
        width = panel.style.width;
        panel.style.width = '';
        btnClose.hidden = true;
    });
    panel.headerElement.appendChild(btnClose.element);

    panel.element.addEventListener('transitionend', function () {
        if (hidden) {
            panel.hidden = true;
        } else {
            btnClose.hidden = false;
        }
    });

    editor.method('picker:settings', function () {
        hidden = false;
        panel.hidden = false;
        setTimeout(function () {
            panel.style.width = width;
        }, 100);
    });


    var addField = function (name, field, path, tooltip) {
        var container = new ui.Panel();
        container.flex = true;
        container.class.add('field-container');
        var label = new ui.Label({
            text: name
        });
        container.append(label);
        container.append(field);
        panel.append(container);

        field.class.add('field');
        field.value = settings.get(path);

        var suspendChange = false;

        settings.on(path + ':set', function (value) {
            suspendChange = true;
            field.value = value;
            suspendChange = false;
        });

        field.on('change', function (value) {
            if (suspendChange) return;

            settings.set(path, value);
        });

        if (tooltip) {
            Tooltip.attach({
                target: label.element,
                html: tooltip,
                align: 'right',
                root: root
            });
        }
    };

    var fieldTheme = new ui.SelectField({
        options: editor.call('editor:themes'),
        type: 'string'
    });
    fieldTheme.flexGrow = 1;
    fieldTheme.style.minWidth = '80px';
    fieldTheme.elementOptions.style.maxHeight = '240px';
    addField('Editor Theme:', fieldTheme, 'ide.theme', 'The code editor theme.');

    var fieldFontSize = new ui.NumberField({
        min: 1,
        placeholder: 'pixels'
    });
    fieldFontSize.flexGrow = 1;
    fieldFontSize.style.minWidth = '80px';
    addField('Font Size:', fieldFontSize, 'ide.fontSize', 'The font size of the code.');

    var fieldAutoCloseBrackets = new ui.Checkbox();
    fieldAutoCloseBrackets.class.add('tick');
    addField('Auto Close Brackets:', fieldAutoCloseBrackets, 'ide.autoCloseBrackets', 'If enabled the editor will auto-close brackets and quotes when typed.');

    var fieldHighlightBrackets = new ui.Checkbox();
    fieldHighlightBrackets.class.add('tick');
    addField('Highlight Brackets:', fieldHighlightBrackets, 'ide.highlightBrackets', 'If enabled causes matching brackets to be highlighted whenever the cursor is next to them.');

    var fieldMinimap = new ui.SelectField({
        options: {
            'none': 'None',
            'right': 'Right',
            'left': 'Left'
        },
        type: 'string'
    });
    fieldMinimap.flexGrow = 1;
    fieldMinimap.style.minWidth = '80px';
    fieldMinimap.elementOptions.style.maxHeight = '240px';
    addField('Code Minimap', fieldMinimap, 'ide.minimapMode', 'Display a high-level code outline minimap - useful for quick navigation and code understanding.');

    var fieldFormatOnSave = new ui.Checkbox();
    fieldFormatOnSave.class.add('tick');
    addField('Format On Save', fieldFormatOnSave, 'ide.formatOnSave', 'If enabled the document will be auto-formatted on save');

    panel.on('show', function () {
        editor.emit('picker:settings:open');
    });

    panel.on('hide', function () {
        editor.emit('picker:settings:close');
    });
});
