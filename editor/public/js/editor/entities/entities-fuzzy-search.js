editor.once('load', function() {
    'use strict';

    var MIN_CHARS = 3;
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
        var parts = name.toLowerCase().split(/(\s|\-|_)/g);

        for(var i = 0; i < parts.length; i++) {
            parts[i] = parts[i].trim();
            if (parts[i] && parts[i] !== '-' && parts[i] !== '_')
                tokens.push(parts[i]);
        }

        return tokens;
    };


    editor.method('string-edit-distance', stringsEditDistance);


    editor.method('entities:fuzzy-search', function(query, limit) {
        var search = (query || '').toLowerCase().trim();

        if (! search || search.length < MIN_CHARS)
            return [ ];

        var entities = editor.call('entities:list');
        var result = [ ];

        for(var i = 0; i < entities.length; i++) {
            var name = entities[i].get('name');

            // check if name contains enough of search characters
            var contains = charsContains(search, name);
            if (contains / search.length < CONTAINS_CHARS_TOLERANCE)
                continue;

            // tokenize name
            // this splits name to separate strings to be compared
            // using this regexp: (\s|\-|_)
            var tokens = stringTokenizer(name);
            var closest = Infinity;
            var sub = false;

            // for each token
            for(var t = 0; t < tokens.length; t++) {
                // equal match
                if (tokens[t] === search) {
                    closest = 0;
                    sub = true;
                    break;
                }

                // calculate edit distance
                var edits = stringsEditDistance(search, tokens[t]);

                if (! sub && tokens[t].indexOf(search) !== -1) { // is a substring
                    sub = true;
                    closest = edits;
                    break;
                } else if (edits < closest) { // new edits candidate
                    // make sure number of edits is below edits tolerance
                    if (edits / Math.max(search.length, tokens[t].length) < EDITS_DISTANCE_TOLERANCE)
                        closest = edits;
                }

                if (closest === 0)
                    break;
            }

            if (closest === Infinity)
                continue;

            // add to results
            result.push([ entities[i], closest, sub ]);
        }

        // sort result first by substring? then by edits number
        result.sort(function(a, b) {
            if (a[2] !== b[2]) {
                return b[2] - a[2];
            } else {
                return a[1] - b[1];
            }
        });

        // return only entities without match information
        for(var i = 0; i < result.length; i++)
            result[i] = result[i][0];

        // limit number of results
        if (result.length > (limit || LIMIT_RESULT))
            result = return.slice(0, limit || LIMIT_RESULT);

        // return results
        return result;
    });
});
