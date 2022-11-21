editor.once('load', function () {
    'use strict';

    const settings = editor.call('editor:settings');

    const root = editor.call('layout.root');
    const settingsPanel = editor.call('layout.attributes');
    let hidden = true;
    let width = settingsPanel.resizeMin + 'px';

    // close button
    const btnClose = new pcui.Button({
        class: ['close'],
        hidden: true,
        icon: 'E132'
    });
    btnClose.on('click', function () {
        hidden = true;
        width = settingsPanel.style.width;
        settingsPanel.style.width = '';
        btnClose.hidden = true;
    });
    settingsPanel.headerElement.appendChild(btnClose.element);

    settingsPanel.element.addEventListener('transitionend', function () {
        if (hidden) {
            settingsPanel.hidden = true;
        } else {
            btnClose.hidden = false;
        }
    });

    editor.method('picker:settings', function () {
        hidden = false;
        settingsPanel.hidden = false;
        setTimeout(function () {
            settingsPanel.style.width = width;
        }, 100);
    });


    const addField = function (name, field, path, tooltip) {
        const labelGroup = new pcui.LabelGroup({
            field: field,
            text: name
        });
        settingsPanel.append(labelGroup);

        field.value = settings.get(path);

        let suspendChange = false;

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
                target: labelGroup.label.element,
                html: tooltip,
                align: 'right',
                root: root
            });
        }
    };

    const themes = editor.call('editor:themes');
    const themeOptions = Object.keys(themes).map((key) => {
        return {
            v: key,
            t: themes[key]
        };
    });
    const fieldTheme = new pcui.SelectInput({
        options: themeOptions,
        type: 'string'
    });
    addField('Editor Theme:', fieldTheme, 'ide.theme', 'The code editor theme.');

    const fieldFontSize = new pcui.NumericInput({
        hideSlider: true,
        min: 1,
        placeholder: 'pixels'
    });
    addField('Font Size:', fieldFontSize, 'ide.fontSize', 'The font size of the code.');

    const fieldWordWrap = new pcui.BooleanInput();
    addField('Word Wrap:', fieldWordWrap, 'ide.wordWrap', 'If enabled, long code lines will wrap to the next line.');

    const fieldAutoCloseBrackets = new pcui.BooleanInput();
    addField('Auto Close Brackets:', fieldAutoCloseBrackets, 'ide.autoCloseBrackets', 'If enabled the editor will auto-close brackets and quotes when typed.');

    const fieldHighlightBrackets = new pcui.BooleanInput();
    addField('Highlight Brackets:', fieldHighlightBrackets, 'ide.highlightBrackets', 'If enabled causes matching brackets to be highlighted whenever the cursor is next to them.');

    const fieldBracketPairColorization = new pcui.BooleanInput();
    addField('Bracket Pair Colorization:', fieldBracketPairColorization, 'ide.bracketPairColorization', 'If enabled, paired brackets will be unique colors.');

    const fieldMinimap = new pcui.SelectInput({
        options: [
            { v: 'none', t: 'None' },
            { v: 'right', t: 'Right' },
            { v: 'left', t: 'Left' }
        ],
        type: 'string'
    });
    addField('Code Minimap:', fieldMinimap, 'ide.minimapMode', 'Display a high-level code outline minimap - useful for quick navigation and code understanding.');

    const fieldFormatOnSave = new pcui.BooleanInput();
    addField('Format On Save:', fieldFormatOnSave, 'ide.formatOnSave', 'If enabled the document will be auto-formatted on save');

    settingsPanel.on('show', function () {
        editor.emit('picker:settings:open');
    });

    settingsPanel.on('hide', function () {
        editor.emit('picker:settings:close');
    });
});
