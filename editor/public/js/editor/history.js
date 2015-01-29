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


    // key binding
    window.addEventListener('keydown', function(evt) {
        if ((evt.ctrlKey || evt.metaKey) && evt.keyCode === 90) {
            if (evt.shiftKey) {
                editor.call('history:redo');
            } else {
                editor.call('history:undo');
            }
            evt.preventDefault();
            evt.stopPropagation();
        }
    });
});
