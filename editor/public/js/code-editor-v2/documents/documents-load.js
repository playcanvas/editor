editor.once('load', function () {
    'use strict';

    var documentsIndex = {};

    // Load document for the specified asset if not loaded already
    // and focus it
    editor.method('document:load', function (asset) {
        // editor.emit('document:load', doc, asset);
        // editor.emit('document:focus', doc);
    });

    editor.method('document:isDirty', function (doc) {

    });

});