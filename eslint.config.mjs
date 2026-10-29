import typescriptConfig from '@playcanvas/eslint-config/typescript';

const API_URL_MESSAGE =
    'Build api urls on config.url.api (launch asset files on config.url.launch), not a literal /api/.';

const esmJsConfig = {
    files: ['**/*.mjs'],
    rules: {
        'import-x/no-named-as-default': 'off'
    }
};

export default [
    ...typescriptConfig,
    esmJsConfig,
    {
        files: [
            'src/core/**/*.ts',
            'src/common/**/*.ts',
            'src/editor/**/*.ts',
            'src/code-editor/**/*.ts',
            'src/launch/**/*.ts',
            'src/plugins/**/*.ts'
        ],
        rules: {
            'no-unused-expressions': ['error', { allowTaggedTemplates: true }]
        }
    },
    {
        files: ['src/**/*.ts'], // api urls come from the page config
        ignores: ['src/sw/**'], // hosted's url map
        rules: {
            'no-restricted-syntax': [
                'error',
                { selector: 'Literal[value=/(^|url\\()\\/api\\//]', message: API_URL_MESSAGE },
                { selector: 'TemplateElement[value.raw=/(^|url\\()\\/api\\//]', message: API_URL_MESSAGE }
            ]
        }
    },
    {
        // deferred during @playcanvas/eslint-config v3 migration — fix incrementally
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': 'warn'
        }
    },
    {
        ignores: [
            '.claude/**',
            'src/realtime/share.uncompressed.js', // added when serving
            'src/wasm/**/*.js',
            'test/editor-api',
            'test-suite'
        ]
    }
];
