editor.once('load', function () {
    'use strict';

    var panel = editor.call('layout.bottom');
    var label = new ui.Label({
        text: 'Loading...'
    });
    label.class.add('status');
    panel.append(label);

    editor.method('status:log', function (msg) {
        label.class.remove('error');
        label.class.remove('warning');
        label.text = msg;
    });

    editor.method('status:warning', function (msg) {
        label.class.remove('error');
        label.class.add('warning');
        label.text = msg;
    });

    editor.method('status:error', function (msg) {
        label.class.add('error');
        label.class.remove('warning');
        label.text = msg;
    });

    editor.method('status:clear', function () {
        editor.call('status:log', '');
    });

});