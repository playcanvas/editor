editor.once('load', function () {
    'use strict';

    // convert passed time to a local time with moment.js
    editor.method('datetime:convert', function (date) {
        var mom = moment.utc(date).local();
        var now = new moment();
        if (now.diff(mom, 'hour') <= 24) {
            if (now.diff(mom, 'second') < 0) {
                return 'just now';
            } else {
                return mom.fromNow();
            }
        } else {
            return mom.format('MMM D [\']YY H:mm');
        }
    });
});