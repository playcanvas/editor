editor.once('load', function() {
    'use strict';

    var settings = editor.call('editor:settings');

    var root = editor.call('layout.root');
    var panel = editor.call('layout.right');
    var hidden = true;
    var width = '220px';

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
                html:  tooltip,
                align: 'right',
                root: root
            });
        }
    };

    var fieldFontSize = new ui.NumberField({
        min: 1
    });
    fieldFontSize.style.width = '30px';
    addField('Font Size (in pixels):', fieldFontSize, 'fontSize', 'The font size of the code.');

    var fieldContinueComments = new ui.Checkbox();
    fieldContinueComments.class.add('tick');
    addField('Continue Comments:', fieldContinueComments, 'continueComments', 'If enabled the editor will make the next line continue a comment when you press Enter inside a comment block.');

    var fieldAutoCloseBrackets = new ui.Checkbox();
    fieldAutoCloseBrackets.class.add('tick');
    addField('Auto Close Brackets:', fieldAutoCloseBrackets, 'autoCloseBrackets', 'If enabled the editor will auto-close brackets and quotes when typed.');

    var fieldHighlightBrackets = new ui.Checkbox();
    fieldHighlightBrackets.class.add('tick');
    addField('Highlight Brackets:', fieldHighlightBrackets, 'highlightBrackets', 'If enabled causes matching brackets to be highlighted whenever the cursor is next to them.');

    panel.on('show', function () {
        editor.emit('picker:settings:open');
    });

    panel.on('hide', function() {
        editor.emit('picker:settings:close');
    });

});
