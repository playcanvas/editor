editor.once('load', function() {
    'use strict';


    var hotkeys = { };
    var keyIndex = { };
    var keysDown = { };
    var ctrl = false;
    var shift = false;
    var alt = false;
    var meta = false;

    var isMac = navigator.userAgent.indexOf('Mac OS X') !== -1;

    var keyMap = {
        'backspace': 8,
        'tab': 9,
        'enter': 13,
        'shift': 16,
        'ctrl': 17,
        'alt': 18,
        'pause/break': 19,
        'caps lock': 20,
        'esc': 27,
        'space': 32,
        'page up': 33, 'page down': 34,
        'end': 35, 'home': 36,
        'left arrow': 37, 'up arrow': 38, 'right arrow': 39, 'down arrow': 40,
        'insert': 45, 'delete': 46,
        '0': 48, '1': 49, '2': 50, '3': 51, '4': 52, '5': 53, '6': 54, '7': 55, '8': 56, '9': 57, 'a': 65,
        'b': 66, 'c': 67, 'd': 68, 'e': 69, 'f': 70, 'g': 71, 'h': 72, 'i': 73, 'j': 74, 'k': 75, 'l': 76, 'm': 77, 'n': 78, 'o': 79, 'p': 80, 'q': 81, 'r': 82, 's': 83, 't': 84, 'u': 85, 'v': 86, 'w': 87, 'x': 88, 'y': 89, 'z': 90,
        'left window key': 91, 'right window key': 92,
        'select key': 93,
        'numpad 0': 96, 'numpad 1': 97, 'numpad 2': 98, 'numpad 3': 99, 'numpad 4': 100, 'numpad 5': 101, 'numpad 6': 102, 'numpad 7': 103, 'numpad 8': 104, 'numpad 9': 105,
        'multiply': 106,
        'add': 107,
        'subtract': 109,
        'decimal point': 110,
        'divide': 111,
        'f1': 112, 'f2': 113, 'f3': 114, 'f4': 115, 'f5': 116, 'f6': 117, 'f7': 118, 'f8': 119, 'f9': 120, 'f10': 121, 'f11': 122, 'f12': 123,
        'num lock': 144,
        'scroll lock': 145,
        'semi-colon': 186,
        'equal sign': 187,
        'comma': 188,
        'dash': 189,
        'period': 190,
        'forward slash': 191,
        'grave accent': 192,
        'open bracket': 219,
        'back slash': 220,
        'close braket': 221,
        'single quote': 222
    };


    editor.method('hotkey:register', function(name, args) {
        hotkeys[name] = args;

        // keys list
        var keys;
        if (isMac) {
            // on mac if we haven't specified
            // the meta key for this hotkey then allow
            // the meta key to be used as well for the control key
            if (args.ctrl && args.meta === undefined) {
                var argsCopy = {};
                for (var key in args)
                    argsCopy[key] = args[key];

                argsCopy.ctrl = false;
                argsCopy.meta = true;
                editor.call('hotkey:register', name, argsCopy);
            }

            keys = [ args.ctrl ? 1 : 0, args.alt ? 1 : 0, args.shift ? 1 : 0, args.meta ? 1 : 0 ];
        } else {
            keys = [ args.ctrl ? 1 : 0, args.alt ? 1 : 0, args.shift ? 1 : 0, args.meta ? 1 : 0 ];
        }

        // map string to keyCode
        if (typeof(args.key) === 'string')
            args.key = keyMap[args.key];

        // unknown key
        if (! args.key) {
            console.error('unknown key: ' + name + ', ' + args.key);
            return;
        }

        keys.push(args.key);

        args.index = keys.join('+');

        if (! keyIndex[args.index])
            keyIndex[args.index] = [ ];

        keyIndex[args.index].push(name);
    });


    editor.method('hotkey:unregister', function(name) {
        var hotkey = hotkeys[name];
        if (! hotkey) return;

        if (keyIndex[hotkey.index].length === 1) {
            delete keyIndex[hotkey.index];
        } else {
            keyIndex[hotkey.index].splice(keyIndex[hotkey.index].indexOf(name), 1);
        }

        delete hotkeys[name];
    });


    editor.method('hotkey:shift', function() {
        return shift;
    });

    editor.method('hotkey:ctrl', function() {
        return ctrl;
    });

    editor.method('hotkey:alt', function() {
        return alt;
    });

    editor.method('hotkey:meta', function () {
        return meta;
    });

    var updateModifierKeys = function(evt) {
        if (shift !== evt.shiftKey) {
            shift = evt.shiftKey;
            editor.emit('hotkey:shift', shift);
        }

        if (ctrl !== evt.ctrlKey) {
            ctrl = evt.ctrlKey;
            editor.emit('hotkey:ctrl', ctrl);
        }

        if (meta !== evt.metaKey) {
            meta = evt.metaKey;
            editor.emit('hotkey:meta', meta);
        }

        if (alt !== evt.altKey) {
            alt = evt.altKey;
            editor.emit('hotkey:alt', alt);
        }
    };

    var codePanel = editor.call('layout.code');

    window.addEventListener('keydown', function(evt) {
        if (evt.target) {
            var tag = evt.target.tagName;
            if (tag === 'textarea' && ! codePanel.innerElement.contains(evt.target)) {
                return;
            }

            if (tag === 'input')
                return;
        }

        updateModifierKeys(evt);

        var keyCode = evt.keyCode;

        // fix weirdness between chrome / safari / firefox
        if (keyCode === 91 && (evt.code === 'MetaLeft' || evt.keyIdentifier === 'Meta'))
            return;

        if (keyCode === 219 && (evt.code === 'BracketLeft' || evt.keyIdentifier === 'U+005B'))
            keyCode = 91;

        if (keyCode === 221 && (evt.code === 'BracketRight' || evt.keyIdentifier === 'U+005D'))
            keyCode = 93;

        var index = [ ctrl+0, alt+0, shift+0, meta+0, keyCode ].join('+');

        if (keyIndex[index]) {
            var skipPreventDefault = false;
            for(var i = 0; i < keyIndex[index].length; i++) {
                hotkeys[keyIndex[index][i]].callback(evt);
                if (! skipPreventDefault && hotkeys[keyIndex[index][i]].skipPreventDefault)
                    skipPreventDefault = true;
            }
            if (! skipPreventDefault)
                evt.preventDefault();
        }
    }, false);


    window.addEventListener('keyup', updateModifierKeys, false);
    window.addEventListener('mousedown', updateModifierKeys, false);

    // Returns Ctrl or Cmd for Mac
    editor.method('hotkey:ctrl:string', function () {
        return isMac ? 'Cmd' : 'Ctrl';
    });


    ui.Grid._ctrl = function() {
        return ctrl;
    };
    ui.Grid._shift = function() {
        return shift;
    };

    ui.Tree._ctrl = function() {
        return ctrl;
    };
    ui.Tree._shift = function() {
        return shift;
    };
});
