import playcanvasConfig from '@playcanvas/eslint-config';
// eslint-disable-next-line import/no-unresolved
import typescriptParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
    ...playcanvasConfig,
    {
        files: [
            'src/core/**/*.ts',
            'src/common/**/*.ts',
            'src/editor/**/*.ts',
            'src/code-editor/**/*.ts',
            'src/launch/**/*.ts',
            'src/plugins/**/*.ts'
        ],
        languageOptions: {
            parser: typescriptParser,
            globals: {
                ...globals.browser,
                config: 'readonly',
                editor: 'readonly',
                log: 'readonly',
                metrics: 'readonly',
                monaco: 'readonly',
                pc: 'readonly',
                pcx: 'readonly',
                pcBootstrap: 'readonly'
            }
        },
        rules: {
            'accessor-pairs': ['error', { setWithoutGet: false, getWithoutSet: false }],
            'curly': ['error', 'all'],
            'jsdoc/require-param-type': 'off',
            'jsdoc/require-returns-type': 'off',
            'jsdoc/require-returns': 'off',
            'no-use-before-define': 'off',
            'no-var': 'off'
        }
    },
    {
        files: ['src/workers/*.ts'],
        languageOptions: {
            parser: typescriptParser,
            globals: {
                ...globals.worker,
                pc: 'readonly'
            }
        },
        rules: {
            'accessor-pairs': ['error', { setWithoutGet: false, getWithoutSet: false }],
            'curly': ['error', 'all'],
            'jsdoc/require-param-type': 'off',
            'jsdoc/require-returns-type': 'off',
            'jsdoc/require-returns': 'off',
            'no-use-before-define': 'off',
            'no-var': 'off'
        }
    },
    {
        files: ['src/sw/*.ts'],
        languageOptions: {
            parser: typescriptParser,
            globals: {
                ...globals.serviceworker
            }
        },
        rules: {
            'accessor-pairs': ['error', { setWithoutGet: false, getWithoutSet: false }],
            'curly': ['error', 'all'],
            'jsdoc/require-param-type': 'off',
            'jsdoc/require-returns-type': 'off',
            'jsdoc/require-returns': 'off',
            'no-use-before-define': 'off',
            'no-var': 'off'
        }
    },
    {
        files: ['modules/**/*.ts'],
        languageOptions: {
            parser: typescriptParser,
            globals: {
                ...globals.browser
            }
        },
        rules: {
            'accessor-pairs': ['error', { setWithoutGet: false, getWithoutSet: false }],
            'curly': ['error', 'all'],
            'jsdoc/require-param-type': 'off',
            'jsdoc/require-returns-type': 'off',
            'jsdoc/require-returns': 'off',
            'no-use-before-define': 'off',
            'no-var': 'off'
        }
    },
    {
        files: ['**/*.mjs'],
        languageOptions: {
            globals: {
                ...globals.node
            }
        },
        rules: {
            'curly': ['error', 'all'],
            'import/no-named-as-default': 'off'
        }
    },
    {
        ignores: [
            'src/realtime/share.uncompressed.js', // added when serving
            'src/modules/pcui-diff.js',
            'src/wasm/**/*.js'
        ]
    }
];
