editor.once('load', function() {
    'use strict';

    var settings = editor.call('editor:settings');

    var panel = editor.call('layout.right');
    var panelWidth = '220px';

    // close button
    var btnClose = new ui.Button({
        text: '&#57650;'
    });
    btnClose.class.add('icon', 'close');
    btnClose.on('click', function () {
        panelWidth = panel.style.width;
        panel.hidden = true;
        panel.style.width = '';
    });
    panel.headerElement.appendChild(btnClose.element);

    var addField = function (name, field, path) {
        var container = new ui.Panel();
        container.class.add('field-container');
        var label = new ui.Label({
            text: name
        });
        container.append(label);
        container.append(field);
        panel.append(container);

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
    };

    var fieldFontSize = new ui.NumberField({
        min: 1
    });
    fieldFontSize.style.width = '30px';
    addField('Font Size (in pixels):', fieldFontSize, 'fontSize');

    var fieldContinueComments = new ui.Checkbox();
    fieldContinueComments.class.add('tick');
    addField('Continue Comments:', fieldContinueComments, 'continueComments');

    var fieldAutoCloseBrackets = new ui.Checkbox();
    fieldAutoCloseBrackets.class.add('tick');
    addField('Auto Close Brackets:', fieldAutoCloseBrackets, 'autoCloseBrackets');

    var fieldHighlightBrackets = new ui.Checkbox();
    fieldHighlightBrackets.class.add('tick');
    addField('Highlight Brackets:', fieldHighlightBrackets, 'highlightBrackets');

    panel.on('show', function () {
        editor.emit('picker:settings:open');;
    });

    panel.on('hide', function() {
        editor.emit('picker:settings:close');
    });

    editor.method('picker:settings', function () {
        panel.hidden = false;
        setTimeout(function () {
            panel.style.width = panelWidth;
        });
    });

});
