import playcanvasConfig from '@playcanvas/eslint-config';
import typescriptParser from '@typescript-eslint/parser';
import globals from 'globals';

const importConfig = {
    settings: {
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts']
        },
        'import/resolver': {
            typescript: {
                alwaysTryTypes: true
            }
        }
    }
};

const coreConfig = {
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
};

const workersConfig =     {
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
};

const serviceWorkersConfig = {
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
};

const modulesConfig = {
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
        'jsdoc/require-jsdoc': 'off',
        'jsdoc/require-param': 'off',
        'jsdoc/require-param-type': 'off',
        'jsdoc/require-returns': 'off',
        'jsdoc/require-returns-type': 'off',
        'no-use-before-define': 'off',
        'no-var': 'off'
    }
};

const testConfig = {
    files: ['test/**/*.ts'],
    languageOptions: {
        parser: typescriptParser,
        globals: {
            ...globals.node
        }
    },
    rules: {
        'accessor-pairs': ['error', { setWithoutGet: false, getWithoutSet: false }],
        'curly': ['error', 'all'],
        'no-unused-expressions': 'off',
        'jsdoc/require-param-type': 'off',
        'jsdoc/require-returns-type': 'off',
        'jsdoc/require-returns': 'off',
        'no-use-before-define': 'off',
        'no-var': 'off'
    }
};

const esmJsConfig = {
    files: ['**/*.mjs'],
    languageOptions: {
        globals: {
            ...globals.node
        }
    },
    rules: {
        'curly': ['error', 'all'],
        'import/no-named-as-default': 'off',
        'import/default': 'off'
    }
};

export default [
    importConfig,
    ...playcanvasConfig,
    coreConfig,
    workersConfig,
    serviceWorkersConfig,
    modulesConfig,
    testConfig,
    esmJsConfig,
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            'src/realtime/share.uncompressed.js', // added when serving
            'src/wasm/**/*.js',
            'test/editor-api'
        ]
    }
];
