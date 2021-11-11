editor.once('load', function () {
    'use strict';

    if (editor.call('editor:resolveConflictMode')) return;

    const monacoEditor = editor.call('editor:monaco');

    // custom undo
    monacoEditor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_Z, () => {
            editor.call('editor:command:undo');
        }
    );

    // custom redo
    monacoEditor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_Z, () => {
            editor.call('editor:command:redo');
        }
    );
    monacoEditor.addCommand(
        monaco.KeyMod.CtrlCmd |  monaco.KeyCode.KEY_Y, () => {
            editor.call('editor:command:redo');
        }
    );

    // close current file
    monacoEditor.addCommand(
        monaco.KeyMod.Alt | monaco.KeyCode.KEY_W, () => {
            editor.call('editor:command:close');
        }
    );

    // close all files
    monacoEditor.addCommand(
        monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KEY_W, () => {
            editor.call('editor:command:closeAll');
        }
    );

    // go to file
    monacoEditor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_P, () => {
            editor.call('editor:command:goToFile');
        }
    );

    // next tab
    monacoEditor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.US_DOT, () => {
            editor.call('editor:command:nextTab');
        }
    );

    // previous tab
    monacoEditor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.US_COMMA, () => {
            editor.call('editor:command:previousTab');
        }
    );

    // find in files
    monacoEditor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_F, () => {
            editor.call('picker:search:open');
        }
    );

    // save
    monacoEditor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
            editor.call('editor:command:save');
        }
    );

    // command pallette
    monacoEditor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_P, () => {
            monacoEditor.focus();
            monacoEditor.trigger(null, 'editor.action.quickCommand');
        }
    );
});
