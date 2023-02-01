monaco.languages.register({ id: 'glsl' });

monaco.languages.setLanguageConfiguration('glsl', {
    wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\#\$\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
    comments: {
        lineComment: '//',
        blockComment: ['/*', '*/']
    },
    brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
    ],
    autoClosingPairs: [
        { open: '[', close: ']' },
        { open: '{', close: '}' },
        { open: '(', close: ')' },
        { open: "'", close: "'", notIn: ['string', 'comment'] },
        { open: '"', close: '"', notIn: ['string'] }
    ]
});

monaco.languages.setMonarchTokensProvider('glsl', {
    defaultToken: '',
    tokenPostfix: '.glsl',
    keywords: ['attribute', 'bool', 'break', 'bvec2', 'bvec3', 'bvec4', 'case', 'centroid', 'const', 'continue', 'default', 'discard', 'do', 'else', 'false', 'flat', 'float', 'for', 'highp', 'if', 'in', 'inout', 'int', 'invariant', 'isampler2D', 'isampler2DArray', 'isampler3D', 'isamplerCube', 'ivec2', 'ivec3', 'ivec4', 'layout', 'lowp', 'mat2', 'mat2x2', 'mat2x3', 'mat2x4', 'mat3', 'mat3x2', 'mat3x3', 'mat3x4', 'mat4', 'mat4x2', 'mat4x3', 'mat4x4', 'mediump', 'out', 'precision', 'return', 'sampler2D', 'sampler2DArray', 'sampler2DArrayShadow', 'sampler2DShadow', 'sampler3D', 'samplerCube', 'samplerCubeShadow', 'smooth', 'struct', 'switch', 'true', 'uint', 'uniform', 'usampler2D', 'usampler2DArray', 'usampler3D', 'usamplerCube', 'uvec2', 'uvec3', 'uvec4', 'varying', 'vec2', 'vec3', 'vec4', 'void', 'while'],
    operators: ['++', '--', '+', '-', '~', '!', '*', '/', '%', '<<', '>>', '<', '>', '<=', '>=', '==', '!=', '&', '^', '|', '&&', '^^', '||', '?', ':', '=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=', '&=', '^=', '|=', ','],
    brackets: [
        { token: 'delimiter.curly', open: '{', close: '}' },
        { token: 'delimiter.parenthesis', open: '(', close: ')' },
        { token: 'delimiter.square', open: '[', close: ']' },
        { token: 'delimiter.angle', open: '<', close: '>' }
    ],
    symbols: /[=><!~?:&|+\-*\/\^%]+/,
    integersuffix: /[uU]?/,
    floatsuffix: /[fF]?/,
    tokenizer: {
        root: [
            [/\d*\d+[eE]([\-+]?\d+)?(@floatsuffix)/, 'number.float'],
            [/\d*\.\d+([eE][\-+]?\d+)?(@floatsuffix)/, 'number.float'],
            [/0[xX][0-9a-fA-F']*[0-9a-fA-F](@integersuffix)/, 'number.hex'],
            [/([+-]?)\d+(@integersuffix)/, 'number.integer'],
            [
                /[a-zA-Z_][a-zA-Z_0-9]*/,
                {
                    cases: {
                        '@keywords': { token: 'keyword.$0' },
                        '@default': 'identifier'
                    }
                }
            ],
            [/^\s*#\s*\w+/, 'keyword.directive'],
            [/(\d+(\.\d+))/, 'number.float'],
            [/\d+/, 'keyword'],
            [/\/\/.+/, 'comment'],
            [/\/\*.+?(\*\/)/, 'comment'],
            [/[{}()\[\]]/, '@brackets'],
            [
                /@symbols/,
                {
                    cases: {
                        '@operators': 'delimiter',
                        '@default': ''
                    }
                }
            ],
            [/[;,.]/, 'delimiter']
        ]
    }
});
