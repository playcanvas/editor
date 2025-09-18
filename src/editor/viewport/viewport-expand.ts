editor.once('load', () => {
    const panels = [];
    panels.push(editor.call('layout.hierarchy'));
    panels.push(editor.call('layout.assets'));
    panels.push(editor.call('layout.attributes'));

    let expanded = false;


    editor.method('viewport:expand', (state) => {
        if (state === undefined) {
            state = !expanded;
        }

        if (expanded === state) {
            return;
        }

        expanded = state;

        for (let i = 0; i < panels.length; i++) {
            panels[i].hidden = expanded;
        }

        editor.emit('viewport:expand', state);
    });


    editor.method('viewport:expand:state', () => {
        return expanded;
    });


    // expand hotkey
    editor.call('hotkey:register', 'viewport:expand', {
        key: 'Space',
        callback: function () {
            editor.call('viewport:expand');
        }
    });
});
