const validate = function (data) {
    if (!data) return false;
    if (!data.id) return false;
    if (!data.query) return false;

    return true;
};

this.onmessage = function (evt) {
    const data = evt.data;
    if (!validate(data)) return;

    const results = {
        id: data.id,
        matches: []
    };

    const text = data.text || '';

    let match;

    // remember new line positions
    const newLines = [];
    let newLinesLength = 0;
    const findNewLines = /\n/g;

    while (match = findNewLines.exec(text)) { // eslint-disable-line no-cond-assign
        newLines.push(match.index);
        newLinesLength++;
    }

    // reset query
    const query = data.query;
    query.lastIndex = 0;

    // start matching
    while (match = query.exec(text)) { // eslint-disable-line no-cond-assign

        // binary search the line of the match
        const index = match.index;
        let low = 0;
        let hi = newLines.length - 1;
        let mid = 0;
        while (low <= hi) {
            mid = Math.floor((low + hi) / 2);
            if (index === newLines[mid] || low === hi) {
                break;
            } else if (index > newLines[mid]) {
                low = mid + 1;
            } else if (index < newLines[mid]) {
                hi = mid - 1;
            }
        }

        let line = 0;
        let char = 0;
        let substring;

        // extract line and column of the match
        // and also start / end indices for the line text
        if (newLinesLength === 0) {
            line = 0;
            char = index;
            substring = text;
        } else if (index > newLines[mid]) {
            line = mid + 1;
            char = index - newLines[mid] - 1;
            substring = text.substring(newLines[mid] + 1, newLines[mid + 1]);
        } else if (index <= newLines[mid]) {
            line = mid;
            char = mid > 0 ? index - newLines[mid - 1] - 1 : index;
            substring = text.substring(mid > 0 ? newLines[mid - 1] + 1 : 0, newLines[mid]);
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
