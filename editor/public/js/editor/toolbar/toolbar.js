editor.once('load', function() {
    'use strict';

    var toolbar = editor.call('layout.toolbar');

    var logo = new ui.Button();
    logo.class.add('logo');
    toolbar.append(logo);
});
