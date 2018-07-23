editor.once('load', function () {
    'use strict';

    // Converts specified date string to a date in this format:
    // Wed, Jul 18, 2018, 12:55:00
    editor.method('datetime:convert', function (date) {
        var d = new Date(date);
        var dateString = d.toDateString();
        var dateParts = dateString.split(' ');
        var timeString = d.toTimeString();
        var space = timeString.indexOf(' ');
        return dateParts[0] + ', ' + dateParts[1] + ' ' + dateParts[2] + ', ' + dateParts[3] + ', ' + timeString.substring(0, space);
    });
});
