editor.once('load', function () {
    'use strict';

    // Creates a codemirror overlay which uses a regex
    // to search each line for matches and add overlay elements
    // on each find result
    editor.method('editor:codemirror:overlay', function (regex, matchClass) {
        return {
            token: function (stream) {
                regex.lastIndex = stream.pos;
                var match = regex.exec(stream.string);
                if (match && match.index === stream.pos) {
                    stream.pos += match[0].length || 1;
                    return matchClass;
                } else if (match) {
                    stream.pos = match.index;
                } else {
                    stream.skipToEnd();
                }
            }
        };
    });
});
