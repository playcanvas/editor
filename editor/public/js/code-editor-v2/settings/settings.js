editor.once('load', function () {
    'use strict';

    var defaultSettings = {
        fontSize: 14,
        continueComments: true,
        autoCloseBrackets: true,
        highlightBrackets: true
    };

    var usedSettings = defaultSettings;

    try {
        var saved = localStorage.getItem('codeeditor:settings');
        if (saved) {
            usedSettings = JSON.parse(saved);

            // add new default settings
            for (var key in defaultSettings) {
                if (! usedSettings.hasOwnProperty(key)) {
                    usedSettings[key] = defaultSettings[key];
                }
            }

            // remove old saved settings
            for (var key in usedSettings) {
                if (! defaultSettings.hasOwnProperty(key)) {
                    delete usedSettings[key];
                }
            }
        }
    } catch (ex) {}

    // settings observer
    var settings = new Observer(usedSettings);

    // Get settigns
    editor.method('editor:settings', function () {
        return settings;
    });

    var suspendSave = false;

    var save = function () {
        try {
            localStorage.setItem('codeeditor:settings', JSON.stringify(settings.json()));
        } catch (ex) {}
    };

    // save to local storage
    settings.on('*:set', function () {
        if (suspendSave) return;

        save();
    });

    // Reset to defaults
    editor.method('editor:settings:reset', function () {
        suspendSave = true;
        for (var key in defaultSettings) {
            settings.set(key, defaultSettings[key]);
        }

        save();
    });

});