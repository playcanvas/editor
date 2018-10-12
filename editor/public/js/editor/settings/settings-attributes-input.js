editor.once('load', function () {
    'use strict';

    var projectSettings = editor.call('settings:project');

    var folded = true;

    editor.on('attributes:inspect[editorSettings]', function () {
        // input
        var inputPanel = editor.call('attributes:addPanel', {
            name: 'Input'
        });
        inputPanel.foldable = true;
        inputPanel.folded = folded;
        inputPanel.on('fold', function () { folded = true; });
        inputPanel.on('unfold', function () { folded = false; });
        inputPanel.class.add('component');

        // enable keyboard
        var fieldKeyboard = editor.call('attributes:addField', {
            parent: inputPanel,
            name: 'Keyboard',
            type: 'checkbox',
            link: projectSettings,
            path: 'useKeyboard'
        });
        editor.call('attributes:reference:attach', 'settings:project:useKeyboard', fieldKeyboard.parent.innerElement.firstChild.ui);

        // enable mouse
        var fieldMouse = editor.call('attributes:addField', {
            parent: inputPanel,
            name: 'Mouse',
            type: 'checkbox',
            link: projectSettings,
            path: 'useMouse'
        });
        editor.call('attributes:reference:attach', 'settings:project:useMouse', fieldMouse.parent.innerElement.firstChild.ui);

        // enable touch
        var fieldTouch = editor.call('attributes:addField', {
            parent: inputPanel,
            name: 'Touch',
            type: 'checkbox',
            link: projectSettings,
            path: 'useTouch'
        });
        editor.call('attributes:reference:attach', 'settings:project:useTouch', fieldTouch.parent.innerElement.firstChild.ui);

        // enable gamepads
        var fieldGamepads = editor.call('attributes:addField', {
            parent: inputPanel,
            name: 'Gamepads',
            type: 'checkbox',
            link: projectSettings,
            path: 'useGamepads'
        });
        editor.call('attributes:reference:attach', 'settings:project:useGamepads', fieldGamepads.parent.innerElement.firstChild.ui);

    });
});
