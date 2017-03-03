var validate = function (data) {
    if (! data) return false;
    if (! data.id) return false;
    if (! data.query) return false;

    return true;
};

this.onmessage = function (evt) {
    var data = evt.data;
    if (! validate(data)) return;

    var results = {
        id: data.id,
        matches: []
    };

    var text = data.text || '';

    var match;

    // remember new line positions
    var newLines = [];
    var newLinesLength = 0;
    var findNewLines = /\n/g;

    while (match = findNewLines.exec(text)) {
        newLines.push(match.index);
        newLinesLength++;
    }

    // reset query
    var query = data.query;
    query.lastIndex = 0;

    // start matching
    while (match = query.exec(text)) {

        // binary search the line of the match
        var index = match.index;
        var low = 0;
        var hi = newLines.length - 1;
        var mid = 0;
        while (low <= hi) {
            mid = Math.floor((low + hi) / 2);
            if (index === newLines[mid] || low === hi) {
                break;
            } else if (index > newLines[mid]) {
                low = mid+1;
            } else if (index < newLines[mid]) {
                hi = mid-1;
            }
        }

        var line = 0;
        var char = 0;
        var substring;

        // extract line and column of the match
        // and also start / end indices for the line text
        if (newLinesLength === 0) {
            line = 0;
            char = index;
            substring = text;
        } else if (index > newLines[mid]) {
            line = mid + 1;
            char = index - newLines[mid] - 1;
            substring = text.substring(newLines[mid] + 1, newLines[mid+1]);
        } else if (index <= newLines[mid]) {
            line = mid;
            char = mid > 0 ? index - newLines[mid-1] - 1 : index;
            substring = text.substring(mid > 0 ? newLines[mid-1] + 1 : 0, newLines[mid]);
        }

        results.matches.push({
            line: line,
            char: char,
            length: match[0].length,
            text: substring
        });

        // break infinite loops in some cases
        if (index === data.query.lastIndex)
            data.query.lastIndex++;
    }

    postMessage(results);
};
