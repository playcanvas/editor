editor.once('load', function() {
    'use strict';

    var actions = [ ];
    var current = -1;
    var canUndo = false;
    var canRedo = false;


    var checkCanUndoRedo = function() {
        if (canUndo && current == -1) {
            canUndo = false;
            editor.emit('history:canUndo', false);
        } else if (! canUndo && current >= 0) {
            canUndo = true;
            editor.emit('history:canUndo', true);
        }

        if (canRedo && current === actions.length - 1) {
            canRedo = false;
            editor.emit('history:canRedo', false);
        } else if (! canRedo && current < actions.length - 1) {
            canRedo = true;
            editor.emit('history:canRedo', true);
        }
    };

    editor.method('history:canUndo', function() {
        return canUndo;
    });
    editor.method('history:canRedo', function() {
        return canRedo;
    });


    // current
    editor.method('history:current', function(action) {
        if (current === -1)
            return null;

        return actions[current];
    });


    // clear
    editor.method('history:clear', function() {
        if (! actions.length)
            return;

        actions = [ ];
        current = -1;
        checkCanUndoRedo();
    });


    // add action
    editor.method('history:add', function(action) {
        // some history needs erasing
        if (current !== actions.length - 1) {
            actions = actions.slice(0, current + 1);
        }

        // add action
        actions.push(action);

        editor.call('status:text', action.name);

        // current action state
        current = actions.length - 1;

        checkCanUndoRedo();
    });


    // update action
    editor.method('history:update', function(action) {
        if (current === -1 || actions[current].name !== action.name)
            return;

        actions[current].redo = action.redo;

        editor.call('status:text', action.name);
    });


    // undo
    editor.method('history:undo', function() {
        // no history
        if (current === -1)
            return;

        actions[current].undo();
        current--;

        if (current >= 0) {
            editor.call('status:text', actions[current].name);
        } else {
            editor.call('status:text', '');
        }

        editor.emit('history:undo', name);
        checkCanUndoRedo();
    });


    // redo
    editor.method('history:redo', function() {
        if (current === actions.length - 1)
            return;

        current++;
        actions[current].redo();
        editor.call('status:text', actions[current].name);

        editor.emit('history:redo', name);
        checkCanUndoRedo();
    });

    // list history
    editor.method('history:list', function () {
        return actions.slice();
    });

    // hotkey undo
    editor.call('hotkey:register', 'history:undo', {
        key: 'z',
        ctrl: true,
        callback: function() {
            editor.call('history:undo');
        }
    });

    // hotkey redo
    editor.call('hotkey:register', 'history:redo', {
        key: 'z',
        ctrl: true,
        shift: true,
        callback: function() {
            editor.call('history:redo');
        }
    });

    // hotkey redo
    editor.call('hotkey:register', 'history:redo:y', {
        key: 'y',
        ctrl: true,
        callback: function() {
            editor.call('history:redo');
        }
    });
});
