editor.once('load', function() {
    'use strict';

    var LIMIT_RESULT = 16;
    var CONTAINS_CHARS_TOLERANCE = 0.5;
    var EDITS_DISTANCE_TOLERANCE = 0.5;


    var stringsEditDistance = function(a, b) {
        // Levenshtein distance
        // https://en.wikibooks.org/wiki/Algorithm_Implementation/Strings/Levenshtein_distance#JavaScript
        if(a.length === 0) return b.length;
        if(b.length === 0) return a.length;
        if(a === b) return 0;

        var i, j;
        var matrix = [];

        for(i = 0; i <= b.length; i++)
            matrix[i] = [i];

        for(j = 0; j <= a.length; j++)
            matrix[0][j] = j;

        for(i = 1; i <= b.length; i++){
            for(j = 1; j <= a.length; j++){
                if(b.charAt(i-1) === a.charAt(j-1)){
                    matrix[i][j] = matrix[i-1][j-1];
                } else {
                    matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, Math.min(matrix[i][j-1] + 1, matrix[i-1][j] + 1));
                }
            }
        }

        return matrix[b.length][a.length];
    };


    var charsContains = function(a, b) {
        if (a === b)
            return a.length;

        var contains = 0;
        var ind = { };
        var i;

        for(i = 0; i < b.length; i++)
            ind[b.charAt(i)] = true;

        for(i = 0; i < a.length; i++) {
            if(ind[a.charAt(i)])
                contains++;
        }

        return contains;
    };


    var stringTokenizer = function(name) {
        var tokens = [ ];

        // camelCase
        // upperCASE123
        var string = name.replace(/([^A-Z])([A-Z][^A-Z])/g, '$1 $2').replace(/([A-Z0-9]{2,})/g, ' $1');

        // space notation
        // dash-notation
        // underscore_notation
        var parts = string.split(/(\s|\-|_)/g);

        // filter valid tokens
        for(var i = 0; i < parts.length; i++) {
            parts[i] = parts[i].toLowerCase().trim();
            if (parts[i] && parts[i] !== '-' && parts[i] !== '_')
                tokens.push(parts[i]);
        }

        return tokens;
    };


    editor.method('string-edit-distance', stringsEditDistance);


    editor.method('string-tokenizer', stringTokenizer);


    editor.method('entities:fuzzy-search', function(query, limit) {
        var search = (query || '').trim();

        if (! search)
            return [ ];

        var searchTokens = stringTokenizer(search);
        if (! searchTokens.length)
            return [ ];

        var items = editor.call('entities:list');
        var result = [ ];

        for(var i = 0; i < items.length; i++) {
            var name = items[i].get('name');

            items[i] = {
                item: items[i],
                name: name.toLowerCase().trim(),
                tokens: stringTokenizer(name),
                edits: Infinity,
                sub: Infinity
            };
        }

        var searchItems = function(items, search) {
            var results = [ ];

            for(var i = 0; i < items.length; i++) {
                var item = items[i];

                // direct hit
                if (item.name === search || item.name.indexOf(search) === 0) {
                    results.push(item);

                    if (item.edits === Infinity)
                        item.edits = 0;

                    if (item.sub === Infinity)
                        item.sub = 0;

                    continue;
                }

                // check if name contains enough of search characters
                var contains = charsContains(search, item.name);
                if (contains / search.length < CONTAINS_CHARS_TOLERANCE)
                    continue;

                var editsCandidate = Infinity;
                var subCandidate = Infinity;

                // for each token
                for(var t = 0; t < item.tokens.length; t++) {
                    // direct token match
                    if (item.tokens[t] === search) {
                        editsCandidate = 0;
                        subCandidate = t;
                        break;
                    }

                    var edits = stringsEditDistance(search, item.tokens[t]);

                    if ((subCandidate === Infinity || edits < editsCandidate) && item.tokens[t].indexOf(search) !== -1) {
                        // search is a substring of a token
                        subCandidate = t;
                        editsCandidate = edits;
                        continue;
                    } else if (subCandidate === Infinity && edits < editsCandidate) {
                        // new edits candidate, not a substring of a token
                        if ((edits / Math.max(search.length, item.tokens[t].length)) <= EDITS_DISTANCE_TOLERANCE) {
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

        // search each token
        for(var i = 0; i < searchTokens.length; i++)
            items = searchItems(items, searchTokens[i]);

        // sort result first by substring? then by edits number
        items.sort(function(a, b) {
            if (a.sub !== b.sub) {
                return a.sub - b.sub;
            } else if (a.edits !== b.edits) {
                return a.edits - b.edits;
            } else {
                return a.name.length - b.name.length;
            }
        });

        // return only entities without match information
        for(var i = 0; i < items.length; i++)
            items[i] = items[i].item;

        // limit number of results
        if (items.length > (limit || LIMIT_RESULT))
            items = items.slice(0, limit || LIMIT_RESULT);

        // return results
        return items;
    });
});
