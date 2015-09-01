editor.once('load', function () {
    'use strict';

    // convert passed time to a local time with moment.js
    editor.method('datetime:convert', function (date) {
        return new Date(date).toLocaleString();
    });
});