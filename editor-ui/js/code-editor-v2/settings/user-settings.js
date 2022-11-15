/**
 * All themes except ayu-dark, ayu-light, ayu-mirage, playcanvas, vs, and vs-dark:
 *
 * Copyright (c) Brijesh Bittu
 * Released under MIT license
 * https://github.com/brijeshb42/monaco-themes/blob/master/LICENSE
 *
 *
 * ayu-dark, ayu-light, and ayumirage:
 *
 * Copyright (c) 2016 Ike Ku
 * Released under MIT license
 * https://github.com/ayu-theme/vscode-ayu/blob/master/LICENSE
 */

editor.once('load', function () {
    'use strict';

    // settings observer
    var settings = new Observer({
        ide: {
            fontSize: 12,
            continueComments: true,
            autoCloseBrackets: true,
            highlightBrackets: true,
            minimapMode: 'right',
            formatOnSave: false,
            theme: 'playcanvas',
            wordWrap: false
        }
    });

    // Get settings
    editor.method('editor:settings', function () {
        return settings;
    });

    // Supported Themes (from monaco-themes and custom themes)
    editor.method('editor:themes', function () {
        return {
            "active4d": "Active4D",
            "all-hallows-eve": "All Hallows Eve",
            "amy": "Amy",
            "ayu-dark": "Ayu-Dark",
            "ayu-light": "Ayu-Light",
            "ayu-mirage": "Ayu-Mirage",
            "birds-of-paradise": "Birds of Paradise",
            "blackboard": "Blackboard",
            "brilliance-black": "Brilliance Black",
            "brilliance-dull": "Brilliance Dull",
            "chrome-devtools": "Chrome DevTools",
            "clouds-midnight": "Clouds Midnight",
            "clouds": "Clouds",
            "cobalt": "Cobalt",
            "dawn": "Dawn",
            "dracula": "Dracula",
            "dreamweaver": "Dreamweaver",
            "eiffel": "Eiffel",
            "espresso-libre": "Espresso Libre",
            "github": "GitHub",
            "iplastic": "iPlastic",
            "idle": "IDLE",
            "idlefingers": "idleFingers",
            "katzenmilch": "Katzenmilch",
            "krtheme": "krTheme",
            "kuroir-theme": "Kuroir Theme",
            "lazy": "LAZY",
            "magicwb--amiga-": "MagicWB (Amiga)",
            "merbivore-soft": "Merbivore Soft",
            "merbivore": "Merbivore",
            "monoindustrial": "monoindustrial",
            "monokai-bright": "Monokai Bright",
            "monokai": "Monokai",
            "night-owl": "Night Owl",
            "oceanic-next": "Oceanic Next",
            "pastels-on-dark": "Pastels on Dark",
            'playcanvas': 'PlayCanvas',
            "slush-and-poppies": "Slush and Poppies",
            "solarized-dark": "Solarized-dark",
            "solarized-light": "Solarized-light",
            "spacecadet": "SpaceCadet",
            "sunburst": "Sunburst",
            "textmate--mac-classic-": "Textmate (Mac Classic)",
            "tomorrow-night-blue": "Tomorrow-Night-Blue",
            "tomorrow-night-bright": "Tomorrow-Night-Bright",
            "tomorrow-night-eighties": "Tomorrow-Night-Eighties",
            "tomorrow-night": "Tomorrow-Night",
            "tomorrow": "Tomorrow",
            "twilight": "Twilight",
            "upstream-sunburst": "Upstream Sunburst",
            "vibrant-ink": "Vibrant Ink",
            'vs': 'VS Default',
            'vs-dark': 'VS Dark',
            "xcode-default": "Xcode_default",
            "zenburnesque": "Zenburnesque"
        };
    });

    var doc;

    editor.on('realtime:authenticated', function () {
        if (doc) {
            if (!doc.subscribed) {
                doc.subscribe();
            }

            doc.resume();
            return;
        }

        var connection = editor.call('realtime:connection');
        doc = connection.get('settings', 'user_' + config.self.id);

        // handle errors
        doc.on('error', function (err) {
            editor.emit('settings:error', err);
        });

        // load settings
        doc.on('load', function () {
            var data = doc.data;
            for (var key in data) {
                settings.set(key, data[key]);
            }

            // server -> local
            doc.on('op', function (ops, local) {
                if (local) return;

                for (var i = 0; i < ops.length; i++) {
                    settings.sync.write(ops[i]);
                }
            });
        });

        // subscribe for realtime events
        doc.subscribe();
    });

    // local -> server
    settings.sync = new ObserverSync({
        item: settings,
        paths: Object.keys(settings._data)
    });
    settings.sync.on('op', function (op) {
        doc.submitOp([op]);
    });

    editor.on('realtime:disconnected', function () {
        if (doc)
            doc.pause();
    });
});
