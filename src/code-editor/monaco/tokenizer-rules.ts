/* eslint-disable */
const CUSTOM_TAGS = {
    number: [
        'precision',
        'step',
        'size'
    ],
    string: [
        'resource',
        'placeholder',
        'color'
    ],
    array: [
        'range',
        'curve'
    ]
};

const NUMBER_STATE = [
    [/(@digits)[eE]([\-+]?(@digits))?/, 'number.float'],
    [/(@digits)\.(@digits)([eE][\-+]?(@digits))?/, 'number.float'],
    [/0[xX](@hexdigits)n?/, 'number.hex'],
    [/0[oO]?(@octaldigits)n?/, 'number.octal'],
    [/0[bB](@binarydigits)n?/, 'number.binary'],
    [/(@digits)n?/, 'number']
];

export const jsRules = {
    jsdoc: [
        [/\*\//, 'comment.doc', '@pop'],
        ...(CUSTOM_TAGS.number.map(tag => ([`([@]${tag})`, 'keyword', '@jsdocNumber']))),
        ...(CUSTOM_TAGS.string.map(tag => ([`([@]${tag})(\\s*(?:(?!\\*\\/).)+)`, ['keyword', 'identifier']]))),
        ...(CUSTOM_TAGS.array.map(tag => ([`([@]${tag})(\\s*\\[)`, ['keyword', { token: 'identifier', next: '@jsdocSquareBrackets' }]]))),
        [/@\w+/, 'keyword'],
        [/(\})([^-]+)(?=-)/, ['comment.doc', 'identifier']],
        [/\{/, 'comment.doc', '@jsdocCurlyBrackets'],
        [/./, 'comment.doc']
    ],
    jsdocCurlyBrackets: [
        [/([@]link)(\s*[^\}]+)/, ['keyword', 'identifier']],
        [/\{/, 'comment.doc', '@push'],
        [/(?=\})/, 'comment.doc', '@pop'],
        [/./, 'type.identifier']
    ],
    jsdocSquareBrackets: [
        [/\[/, 'identifier', '@push'],
        [/\]/, 'identifier', '@pop'],
        ...NUMBER_STATE,
        [/"/, 'string', '@string_double'],
        [/'/, 'string', '@string_single'],
        [/`/, 'string', '@string_backtick'],
        [/./, 'identifier']
    ],
    jsdocNumber: [
        ...NUMBER_STATE.map(([regex, token]) => [regex, token, '@pop']),
        [/./, 'identifier']
    ]
};
/* eslint-enable */
