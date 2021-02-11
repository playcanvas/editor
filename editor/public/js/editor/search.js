editor.once('load', function () {
    'use strict';

    // calculate, how many string `a`
    // requires edits, to become string `b`
    editor.method('search:stringEditDistance', function (a, b) {
        // Levenshtein distance
        // https://en.wikibooks.org/wiki/Algorithm_Implementation/Strings/Levenshtein_distance#JavaScript
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        if (a === b) return 0;

        var i, j;
        var matrix = [];

        for (i = 0; i <= b.length; i++)
            matrix[i] = [i];

        for (j = 0; j <= a.length; j++)
            matrix[0][j] = j;

        for (i = 1; i <= b.length; i++){
            for (j = 1; j <= a.length; j++){
                if (b.charAt(i - 1) === a.charAt(j - 1)){
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
                }
            }
        }

        return matrix[b.length][a.length];
    });


    // calculate, how many characters string `b`
    // contains of a string `a`
    editor.method('search:charsContains', function (a, b) {
        if (a === b)
            return a.length;

        var contains = 0;
        var ind = { };
        var i;

        for (i = 0; i < b.length; i++)
            ind[b.charAt(i)] = true;

        for (i = 0; i < a.length; i++) {
            if (ind[a.charAt(i)])
                contains++;
        }

        return contains;
    });


    // tokenize string into array of tokens
    editor.method('search:stringTokenize', function (name) {
        var tokens = [];

        // camelCase
        // upperCASE123
        var string = name.replace(/([^A-Z])([A-Z][^A-Z])/g, '$1 $2').replace(/([A-Z0-9]{2,})/g, ' $1');

        // space notation
        // dash-notation
        // underscore_notation
        var parts = string.split(/(\s|\-|_)/g);

        // filter valid tokens
        for (let i = 0; i < parts.length; i++) {
            parts[i] = parts[i].toLowerCase().trim();
            if (parts[i] && parts[i] !== '-' && parts[i] !== '_')
                tokens.push(parts[i]);
        }

        return tokens;
    });


    var searchItems = function (items, search, args) {
        var results = [];

        for (let i = 0; i < items.length; i++) {
            var item = items[i];

            // direct hit
            if (item.subFull !== Infinity) {
                results.push(item);

                if (item.edits === Infinity)
                    item.edits = 0;

                if (item.sub === Infinity)
                    item.sub = item.subFull;

                continue;
            } else if (item.name === search || item.name.indexOf(search) === 0) {
                results.push(item);

                if (item.edits === Infinity)
                    item.edits = 0;

                if (item.sub === Infinity)
                    item.sub = 0;

                continue;
            }

            // check if name contains enough of search characters
            var contains = editor.call('search:charsContains', search, item.name);
            if (contains / search.length < args.containsCharsTolerance)
                continue;

            var editsCandidate = Infinity;
            var subCandidate = Infinity;

            // for each token
            for (var t = 0; t < item.tokens.length; t++) {
                // direct token match
                if (item.tokens[t] === search) {
                    editsCandidate = 0;
                    subCandidate = t;
                    break;
                }

                var edits = editor.call('search:stringEditDistance', search, item.tokens[t]);

                if ((subCandidate === Infinity || edits < editsCandidate) && item.tokens[t].indexOf(search) !== -1) {
                    // search is a substring of a token
                    subCandidate = t;
                    editsCandidate = edits;
                    continue;
                } else if (subCandidate === Infinity && edits < editsCandidate) {
                    // new edits candidate, not a substring of a token
                    if ((edits / Math.max(search.length, item.tokens[t].length)) <= args.editsDistanceTolerance) {
                        // check if edits tolerance is satisfied
                        editsCandidate = edits;
                    }
                }
            }

            // no match candidate
            if (editsCandidate === Infinity)
                continue;

            // add new result
            results.push(item);
            item.edits = item.edits === Infinity ? editsCandidate : item.edits + editsCandidate;
            item.sub = item.sub === Infinity ? subCandidate : item.sub + subCandidate;
        }

        return results;
    };

    // perform search through items
    // items is an array with arrays of two values
    // where first value is a string to be searched by
    // and second value is an object to be found
    //
    // [
    //     [ 'camera', {object} ],
    //     [ 'New Entity', {object} ],
    //     [ 'Sun', {object} ]
    // ]
    //
    editor.method('search:items', function (items, search, args) {
        search = (search || '').toLowerCase().trim();

        if (! search)
            return [];

        var searchTokens = editor.call('search:stringTokenize', search);
        if (! searchTokens.length)
            return [];

        args = args || { };
        args.containsCharsTolerance = args.containsCharsTolerance || 0.5;
        args.editsDistanceTolerance = args.editsDistanceTolerance || 0.5;

        var result = [];
        var records = [];

        for (let i = 0; i < items.length; i++) {
            var subInd = items[i][0].toLowerCase().trim().indexOf(search);

            records.push({
                name: items[i][0],
                item: items[i][1],
                tokens: editor.call('search:stringTokenize', items[i][0]),
                edits: Infinity,
                subFull: (subInd !== -1) ? subInd : Infinity,
                sub: Infinity
            });
        }

        // search each token
        for (let i = 0; i < searchTokens.length; i++)
            records = searchItems(records, searchTokens[i], args);

        // sort result first by substring? then by edits number
        records.sort(function (a, b) {
            if (a.subFull !== b.subFull) {
                return a.subFull - b.subFull;
            } else if (a.sub !== b.sub) {
                return a.sub - b.sub;
            } else if (a.edits !== b.edits) {
                return a.edits - b.edits;
            }
            return a.name.length - b.name.length;

        });

        // return only items without match information
        for (let i = 0; i < records.length; i++)
            records[i] = records[i].item;

        // limit number of results
        if (args.hasOwnProperty('limitResults') && records.length > args.limitResults) {
            records = records.slice(0, args.limitResults);
        }

        return records;
    });
});
