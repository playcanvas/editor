// calculate, how many string `a`
// requires edits, to become string `b`
export const searchStringEditDistance = function (a, b) {
    // Levenshtein distance
    // https://en.wikibooks.org/wiki/Algorithm_Implementation/Strings/Levenshtein_distance#JavaScript
    if (a.length === 0) {
        return b.length;
    }
    if (b.length === 0) {
        return a.length;
    }
    if (a === b) {
        return 0;
    }

    let i, j;
    const matrix = [];

    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }

    return matrix[b.length][a.length];
};


// calculate, how many characters string `b`
// contains of a string `a`
export const searchCharsContains = function (a, b) {
    if (a === b) {
        return a.length;
    }

    let contains = 0;
    const ind = { };
    let i;

    for (i = 0; i < b.length; i++) {
        ind[b.charAt(i)] = true;
    }

    for (i = 0; i < a.length; i++) {
        if (ind[a.charAt(i)]) {
            contains++;
        }
    }

    return contains;
};


// tokenize string into array of tokens
export const searchStringTokenize = function (name) {
    const tokens = [];

    // camelCase
    // upperCASE123
    const string = name.replace(/([^A-Z])([A-Z][^A-Z])/g, '$1 $2').replace(/([A-Z0-9]{2,})/g, ' $1');

    // space notation
    // dash-notation
    // underscore_notation
    const parts = string.split(/([\s\-_])/g);

    // filter valid tokens
    for (let i = 0; i < parts.length; i++) {
        parts[i] = parts[i].toLowerCase().trim();
        if (parts[i] && parts[i] !== '-' && parts[i] !== '_') {
            tokens.push(parts[i]);
        }
    }

    return tokens;
};

export const getMap = function (items, key) {
    switch (key) {
        case 'Name':
            return items;

        case 'Component Type': {
            const componentItems = [];
            items.forEach((item) => {
                item[1].entity._data.components._keys.forEach(component => componentItems.push([component.toLowerCase(), item[1]]));
            });
            return componentItems;
        }
        case 'Script Name': {
            const scriptItems = [];
            items.forEach((item) => {
                if (item[1].entity._data.components._data.script) {
                    item[1].entity._data.components._data.script._data.order.forEach(script => scriptItems.push([script.toLowerCase(), item[1]]));
                }
            });
            return scriptItems;
        }
        case 'Tags': {
            const tagItems = [];
            items.forEach((item) => {
                item[1].entity._data.tags.forEach(tag => tagItems.push([tag.toLowerCase(), item[1]]));
            });
            return tagItems;
        }
    }
};

const _searchExact = function (items, search) {

    const results = [];

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.name.toLowerCase().includes(search)) {
            results.push(item);
        }
    }

    return results;
};

const _searchItems = function (items, search, args) {
    const results = [];

    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // direct hit
        if (item.subFull !== Infinity) {
            results.push(item);

            if (item.edits === Infinity) {
                item.edits = 0;
            }

            if (item.sub === Infinity) {
                item.sub = item.subFull;
            }

            continue;
        } else if (item.name === search || item.name.indexOf(search) === 0) {
            results.push(item);

            if (item.edits === Infinity) {
                item.edits = 0;
            }

            if (item.sub === Infinity) {
                item.sub = 0;
            }

            continue;
        }

        // check if name contains enough of search characters
        const contains = searchCharsContains(search, item.name);
        if (contains / search.length < args.containsCharsTolerance) {
            continue;
        }

        let editsCandidate = Infinity;
        let subCandidate = Infinity;

        // for each token
        for (let t = 0; t < item.tokens.length; t++) {
            // direct token match
            if (item.tokens[t] === search) {
                editsCandidate = 0;
                subCandidate = t;
                break;
            }

            const edits = searchStringEditDistance(search, item.tokens[t]);

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
        if (editsCandidate === Infinity) {
            continue;
        }

        // add new result
        results.push(item);
        item.edits = item.edits === Infinity ? editsCandidate : item.edits + editsCandidate;
        item.sub = item.sub === Infinity ? subCandidate : item.sub + subCandidate;
    }

    return results;
};

/**
 * Search for items in a list.
 *
 * @param items - array of [string, any] tuples
 * @param items[0] - string to search by
 * @param items[1] - object to be found
 * @param search - search string
 * @param args - search arguments
 * @returns array of matched items
 */
export const searchItems = function (items: [string, any][], search: string, args: any) {
    let i;

    search = (search || '').toLowerCase().trim();

    if (!search) {
        return [];
    }

    const searchTokens = searchStringTokenize(search);
    if (!searchTokens.length) {
        return [];
    }

    args = args || { };
    args.containsCharsTolerance = args.containsCharsTolerance || 0.5;
    args.editsDistanceTolerance = args.editsDistanceTolerance || 0.5;

    let records = [];

    for (i = 0; i < items.length; i++) {
        const subInd = items[i][0].toLowerCase().trim().indexOf(search);

        records.push({
            name: items[i][0],
            item: items[i][1],
            tokens: args.fuzzy ? searchStringTokenize(items[i][0]) : [],
            edits: Infinity,
            subFull: (subInd !== -1) ? subInd : Infinity,
            sub: Infinity
        });
    }

    // search each token
    for (i = 0; i < searchTokens.length; i++) {
        records = args.fuzzy ? _searchItems(records, searchTokens[i], args) : _searchExact(records, searchTokens[i]);
    }

    // sort result first by substring? then by edits number
    records.sort((a, b) => {
        if (a.subFull !== b.subFull) {
            return a.subFull - b.subFull;
        }
        if (a.sub !== b.sub) {
            return a.sub - b.sub;
        }
        if (a.edits !== b.edits) {
            return a.edits - b.edits;
        }
        return a.name.length - b.name.length;
    });

    // return only items without match information
    for (i = 0; i < records.length; i++) {
        records[i] = records[i].item;
    }

    // limit number of results
    if (args.hasOwnProperty('limitResults') && records.length > args.limitResults) {
        records = records.slice(0, args.limitResults);
    }

    return records;
};
