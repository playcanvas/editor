editor.once('load', function () {
    'use strict';

    if (editor.call('editor:resolveConflictMode')) return;

    const monacoEditor = editor.call('editor:monaco');

    // custom undo
    monacoEditor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => {
            editor.call('editor:command:undo');
        }
    );

    // custom redo
    monacoEditor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ, () => {
            editor.call('editor:command:redo');
        }
    );
    monacoEditor.addCommand(
        monaco.KeyMod.CtrlCmd |  monaco.KeyCode.KeyY, () => {
            editor.call('editor:command:redo');
        }
    );

    // close current file
    monacoEditor.addCommand(
        monaco.KeyMod.Alt | monaco.KeyCode.KeyW, () => {
            editor.call('editor:command:close');
        }
    );

    // close all files
    monacoEditor.addCommand(
        monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyW, () => {
            editor.call('editor:command:closeAll');
        }
    );

    // go to file
    monacoEditor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP, () => {
            editor.call('editor:command:goToFile');
        }
    );

    // next tab
    monacoEditor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.Period, () => {
            editor.call('editor:command:nextTab');
        }
    );

    // previous tab
    monacoEditor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.Comma, () => {
            editor.call('editor:command:previousTab');
        }
    );

    // find in files
    monacoEditor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
            editor.call('picker:search:open');
        }
    );

    // save
    monacoEditor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            editor.call('editor:command:save');
        }
    );

    // command pallette
    monacoEditor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP, () => {
            monacoEditor.focus();
            monacoEditor.trigger(null, 'editor.action.quickCommand');
        }
    );
});
